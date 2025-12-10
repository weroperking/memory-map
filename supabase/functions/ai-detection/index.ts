import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit config
const MAX_REQUESTS_PER_MIN = 8;

// in-memory rate map
const rateMap = new Map<string, { count: number; timestamp: number }>();

// Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -----------------------------
    //  RATE LIMIT
    // -----------------------------
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const record = rateMap.get(ip);

    if (record) {
      const diff = now - record.timestamp;

      if (diff < 60_000) {
        if (record.count >= MAX_REQUESTS_PER_MIN) {
          return new Response(
            JSON.stringify({
              error: "Rate limit exceeded. Try again in 60 seconds.",
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        record.count++;
      } else {
        rateMap.set(ip, { count: 1, timestamp: now });
      }
    } else {
      rateMap.set(ip, { count: 1, timestamp: now });
    }

    // -----------------------------
    //  PARSE REQUEST
    // -----------------------------
    const { imageBase64, imageName } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------
    //  ENV
    // -----------------------------
    const OPENROUTER_KEY = Deno.env.get("OPENROUTER_KEY");
    if (!OPENROUTER_KEY) throw new Error("OPENROUTER_KEY not configured");

    // -----------------------------
    // FULL SYSTEM PROMPT YOU WROTE — UNCHANGED
    // -----------------------------
    const systemPrompt = `You are an expert AI image forensics analyst. Your task is to analyze images and determine if they are AI-generated or authentic photographs.

Analyze the following aspects:
1. **Noise patterns**: AI images often have uniform noise distribution vs natural camera sensor noise
2. **Edge artifacts**: Look for unnatural smoothness, blur inconsistencies, or impossible lighting
3. **Texture consistency**: Check for repetitive patterns, especially in backgrounds
4. **Anatomical accuracy**: In portraits, check hands, fingers, teeth, ears, hair strands
5. **Lighting coherence**: Shadows should be consistent with light sources
6. **Background details**: AI often generates blurry or nonsensical background elements
7. **Text in image**: AI often struggles with readable text
8. **Reflection/refraction**: Windows, glasses, water surfaces are often unrealistic

Return your analysis as JSON with this exact structure:
{
  "isAIGenerated": boolean,
  "confidence": number (0-100),
  "reasons": string[],
  "analysis": {
    "noiseScore": number (0-100, higher = more likely AI),
    "edgeScore": number (0-100),
    "textureScore": number (0-100),
    "anatomyScore": number (0-100, if applicable),
    "lightingScore": number (0-100),
    "overallScore": number (0-100)
  },
  "details": string
}`;

    const userMessageText =
      "Analyze this image and determine if it is AI-generated or an authentic photograph. Provide detailed forensic analysis.";

    // remove dataURI prefix
    const imageData = imageBase64.startsWith("data:")
      ? imageBase64.split(",")[1]
      : imageBase64;

    // -----------------------------
    //  CALL QWEN2.5 VL (OPENROUTER)
    // -----------------------------
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-vl",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userMessageText },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${imageData}`,
              },
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0,
      }),
    });

    if (!orRes.ok) {
      const t = await orRes.text();
      console.error("OpenRouter error:", t);
      return new Response(JSON.stringify({ error: "Model call failed." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modelData = await orRes.json();
    const content = modelData?.choices?.[0]?.message?.content;

    // -----------------------------
    // PARSE JSON
    // -----------------------------
    let result;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(match[0]);
    } catch {
      result = {
        isAIGenerated: false,
        confidence: 50,
        reasons: ["Could not parse response JSON"],
        analysis: {
          noiseScore: 50,
          edgeScore: 50,
          textureScore: 50,
          anatomyScore: 50,
          lightingScore: 50,
          overallScore: 50,
        },
        details: content ?? "No valid JSON returned",
      };
    }

    // -----------------------------
    // SAVE LOGS
    // -----------------------------
    await supabase.from("ai_logs").insert({
      ip,
      image_name: imageName ?? null,
      model: "qwen2.5-vl",
      confidence: result.confidence,
      is_ai: result.isAIGenerated,
      raw_output: result,
    });

    // -----------------------------
    // RETURN RESULT
    // -----------------------------
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Edge error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
