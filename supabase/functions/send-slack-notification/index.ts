import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SlackPayload {
  event_type: "status_change" | "comment" | "deadline" | "handler_change";
  project_name: string;
  project_id: string;
  details: Record<string, string>;
}

const getEmoji = (type: string) => {
  switch (type) {
    case "status_change": return "🔄";
    case "comment": return "💬";
    case "deadline": return "⏰";
    case "handler_change": return "👤";
    default: return "📋";
  }
};

const getTitle = (type: string) => {
  switch (type) {
    case "status_change": return "Status Berubah";
    case "comment": return "Komentar Baru";
    case "deadline": return "Pengingat Deadline";
    case "handler_change": return "Handler Berubah";
    default: return "Notifikasi Project";
  }
};

const buildSlackBlocks = (payload: SlackPayload) => {
  const emoji = getEmoji(payload.event_type);
  const title = getTitle(payload.event_type);

  const fields = Object.entries(payload.details).map(([key, value]) => ({
    type: "mrkdwn",
    text: `*${key}:*\n${value}`,
  }));

  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} ${title}`, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Project:* ${payload.project_name}` },
      },
      ...(fields.length > 0
        ? [{ type: "section", fields: fields.slice(0, 10) }]
        : []),
      { type: "divider" },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📅 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`,
          },
        ],
      },
    ],
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SlackPayload = await req.json();

    if (!body.event_type || !body.project_name || !body.project_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event_type, project_name, project_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's Slack webhook config
    const { data: config, error: configError } = await supabase
      .from("slack_webhook_configs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Slack webhook not configured" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!config.is_active) {
      return new Response(
        JSON.stringify({ message: "Slack notifications disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this event type is enabled
    const eventEnabled = {
      status_change: config.notify_status_change,
      comment: config.notify_comments,
      deadline: config.notify_deadlines,
      handler_change: config.notify_handler_change,
    };

    if (!eventEnabled[body.event_type]) {
      return new Response(
        JSON.stringify({ message: `Notification for ${body.event_type} is disabled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to Slack
    const slackPayload = buildSlackBlocks(body);
    const slackResponse = await fetch(config.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error("Slack API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send Slack notification", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent to Slack" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
