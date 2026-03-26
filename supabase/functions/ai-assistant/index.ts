import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, projectData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    const projectContext = `
Project: ${projectData.name}
Description: ${projectData.description || "No description"}
Status: ${projectData.status}
Due Date: ${projectData.dueDate || "Not set"}
Tags: ${(projectData.tags || []).join(", ") || "None"}
Handlers: ${(projectData.handlers || []).map((h: any) => h.display_name || h.email).join(", ") || "None"}
Subtasks: ${(projectData.subtasks || []).map((s: any) => `[${s.completed ? "✓" : "○"}] ${s.title}`).join(", ") || "None"}
Total Time Tracked: ${projectData.totalTimeTracked || "0h"}
Recent Activities: ${(projectData.activities || []).slice(0, 5).map((a: any) => a.description).join("; ") || "None"}
Comments: ${(projectData.comments || []).slice(0, 5).map((c: any) => c.content).join("; ") || "None"}
    `.trim();

    switch (type) {
      case "summarize":
        systemPrompt =
          "Kamu adalah asisten proyek yang cerdas. Buat ringkasan status proyek yang singkat, jelas, dan actionable dalam bahasa Indonesia. Gunakan format markdown dengan heading dan bullet points. Maksimal 200 kata.";
        userPrompt = `Buatkan ringkasan status untuk proyek berikut:\n\n${projectContext}`;
        break;

      case "suggest":
        systemPrompt =
          "Kamu adalah asisten proyek yang cerdas. Berikan 3-5 saran tindakan selanjutnya yang spesifik dan actionable berdasarkan status proyek saat ini. Gunakan bahasa Indonesia, format markdown numbered list. Prioritaskan berdasarkan urgensi.";
        userPrompt = `Berikan saran tindakan selanjutnya untuk proyek berikut:\n\n${projectContext}`;
        break;

      case "generate_description":
        systemPrompt =
          "Kamu adalah asisten penulisan profesional. Buat deskripsi proyek yang menarik dan informatif dalam bahasa Indonesia. Maksimal 3 paragraf. Gunakan tone profesional tapi tidak kaku.";
        userPrompt = `Buatkan deskripsi proyek berdasarkan informasi berikut:\n\n${projectContext}`;
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit tercapai, coba lagi nanti." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredit AI habis, silakan tambah kredit di Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
