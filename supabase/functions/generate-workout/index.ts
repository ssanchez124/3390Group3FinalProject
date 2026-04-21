import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), { status: 401 })
    }

    // Use service role key to create admin client, then verify token separately
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Use anon client with the user's token to get their identity
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), { status: 401 })
    }

    // Fetch profile using admin client (bypasses RLS issues during testing)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found", details: profileError }), { status: 404 })
    }

    const { workoutConfig, swapExercise } = await req.json()
    const { systemPrompt, userPrompt } = buildPrompt(profile, workoutConfig, swapExercise)

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
      }),
    })

    const aiData = await openAIResponse.json()

    if (!aiData.choices || !aiData.choices[0]) {
      return new Response(JSON.stringify({ error: "OpenAI error", details: aiData }), { status: 500 })
    }

    const plan = JSON.parse(aiData.choices[0].message.content)

    if (!swapExercise) {
      await supabaseAdmin.from("workout_plans").insert({
        user_id: user.id,
        plan_data: plan,
        config_used: workoutConfig,
      })
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

function buildPrompt(profile: any, config: any, swapExercise: any) {
  const schema = `{
    "planTitle": string,
    "totalDuration": number,
    "exercises": [{
      "id": string,
      "name": string,
      "muscleGroup": string,
      "sets": number,
      "reps": string,
      "restSeconds": number,
      "instructions": string,
      "difficulty": string,
      "equipment": string
    }]
  }`

  const systemPrompt = `You are a certified personal trainer.
Always respond with ONLY valid JSON matching this exact schema — no markdown, no explanation:
${schema}`

  if (swapExercise) {
    const userPrompt = `Replace the exercise "${swapExercise.name}" (targets: ${swapExercise.muscleGroup}).
User has: ${profile.equipment?.join(", ") || "no equipment"}.
Do NOT suggest any of these: ${swapExercise.excludeNames.join(", ")}.
Respond with ONLY a single exercise JSON object matching the schema above, keeping the same "id": "${swapExercise.id}".`
    return { systemPrompt, userPrompt }
  }

  const userPrompt = `Create a workout plan for:
- Age: ${profile.age}, Gender: ${profile.gender}
- Weight: ${profile.weight_kg}kg, Height: ${profile.height_cm}cm
- Fitness level: ${profile.fitness_level}
- Goal: ${profile.primary_goal}
- Equipment: ${profile.equipment?.join(", ") || "none"}
- Injuries/limitations: ${profile.injuries || "none"}

Workout config:
- Target muscles: ${config.muscleGroups.join(", ")}
- Number of exercises: ${config.numExercises}
- Duration: ${config.durationMinutes} minutes
- Difficulty: ${config.difficulty}`

  return { systemPrompt, userPrompt }
}