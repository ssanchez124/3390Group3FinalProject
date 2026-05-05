import { serve } from "std/http/server"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), { status: 401 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError }), { status: 401 })
    }

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
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})

interface Profile {
  age: number
  gender: string
  weight_kg: number
  height_cm: number
}

interface WorkoutConfig {
  muscleGroups: string[]
  numExercises: number
  durationMinutes: number
  difficulty: string
}

interface SwapExercise {
  id: string
  name: string
  muscleGroup: string
  excludeNames: string[]
}

function buildPrompt(profile: Profile, config: WorkoutConfig, swapExercise: SwapExercise | null) {
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
Do NOT suggest any of these: ${swapExercise.excludeNames.join(", ")}.
Respond with ONLY a single exercise JSON object matching the schema above, keeping the same "id": "${swapExercise.id}".`
    return { systemPrompt, userPrompt }
  }

  const userPrompt = `Create a workout plan for:
- Age: ${profile.age}, Gender: ${profile.gender}
- Weight: ${profile.weight_kg}kg, Height: ${profile.height_cm}cm

Workout config:
- Target muscles: ${config.muscleGroups.join(", ")}
- Number of exercises: ${config.numExercises}
- Duration: ${config.durationMinutes} minutes
- Difficulty: ${config.difficulty}`

  return { systemPrompt, userPrompt }
}