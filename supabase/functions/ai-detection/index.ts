import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageName } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing image:", imageName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert AI image forensics analyst. Your task is to analyze images and determine if they are AI-generated or authentic photographs.

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
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and determine if it is AI-generated or an authentic photograph. Provide detailed forensic analysis.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);
    
    // Parse JSON from response
    let result;
    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Return a default response if parsing fails
      result = {
        isAIGenerated: false,
        confidence: 50,
        reasons: ["Analysis completed but results were inconclusive"],
        analysis: {
          noiseScore: 50,
          edgeScore: 50,
          textureScore: 50,
          anatomyScore: 50,
          lightingScore: 50,
          overallScore: 50
        },
        details: content || "Unable to parse AI response"
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-detection:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
