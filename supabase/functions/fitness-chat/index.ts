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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const m = user.user_metadata || {}
    const profile = (m.age || m.weight || m.height || m.gender)
      ? { age: m.age, gender: m.gender, weight_kg: m.weight, height_cm: m.height }
      : null

    const { messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(profile)

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    const aiData = await openAIResponse.json()

    if (!aiData.choices?.[0]) {
      return new Response(JSON.stringify({ error: "OpenAI error", details: aiData }), { status: 500 })
    }

    const reply = aiData.choices[0].message.content

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})

function buildSystemPrompt(profile: { age: string; gender: string; weight_kg: string; height_cm: string } | null) {
  const profileText = profile
    ? `The user's stats: ${profile.age} years old, ${profile.gender}, ${profile.weight_kg}kg, ${profile.height_cm}cm tall.`
    : "No user profile available."

  return `You are a knowledgeable, friendly personal trainer and fitness coach inside a workout tracking app.
${profileText}
Always tailor your advice to these stats when relevant (e.g. suggest appropriate weights, consider their body metrics).
Keep answers concise and practical — 2 to 4 short paragraphs max.
Use plain text only, no markdown, no bullet symbols, no asterisks.
If asked something unrelated to fitness, health, nutrition, or exercise, politely redirect to those topics.`
}