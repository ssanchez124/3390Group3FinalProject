import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const { workoutConfig, swapExercise } = await req.json()

    const { systemPrompt, userPrompt } = buildPrompt(profile, workoutConfig, swapExercise)

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      return new Response(JSON.stringify({ error: errorText }), {
        status: openAIResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const aiData = await openAIResponse.json()
    const plan = JSON.parse(aiData.choices[0].message.content)

    if (!swapExercise) {
      await supabase.from("workout_plans").insert({
        user_id: user.id,
        plan_data: plan,
        config_used: workoutConfig,
      })
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

// ---- Prompt builder ----
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
Respond with ONLY a single exercise JSON object, keeping the same "id": "${swapExercise.id}".`
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