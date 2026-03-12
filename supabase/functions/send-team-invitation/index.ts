import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, projectId, role, projectName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get inviter profile
    const { data: inviterProfile } = await supabaseClient
      .from("profiles")
      .select("id, display_name, email")
      .eq("user_id", user.id)
      .single();

    if (!inviterProfile) {
      return new Response(JSON.stringify({ error: "Inviter profile not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is already a member
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile && projectId) {
      const { data: existingMember } = await supabaseClient
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("profile_id", existingProfile.id)
        .maybeSingle();

      if (existingMember) {
        return new Response(JSON.stringify({ error: "User is already a member of this project" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create invitation
    const { data: invitation, error: invError } = await supabaseClient
      .from("team_invitations")
      .insert({
        email,
        project_id: projectId || null,
        role: role || "member",
        invited_by: inviterProfile.id,
      })
      .select()
      .single();

    if (invError) {
      console.error("Error creating invitation:", invError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If the user already exists, auto-add them
    if (existingProfile && projectId) {
      await supabaseClient
        .from("project_members")
        .insert({
          project_id: projectId,
          profile_id: existingProfile.id,
          role: role || "member",
          added_by: inviterProfile.id,
        });

      await supabaseClient
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);
    }

    // Send email notification if Resend is configured
    if (resendApiKey) {
      const inviteUrl = `${req.headers.get("origin") || supabaseUrl}?invite=${invitation.token}`;
      
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Project Management <onboarding@resend.dev>",
          to: [email],
          subject: projectName
            ? `${inviterProfile.display_name || inviterProfile.email} invited you to "${projectName}"`
            : `${inviterProfile.display_name || inviterProfile.email} invited you to the team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #1a1a1a;">You've been invited!</h2>
              <p style="color: #555;">${inviterProfile.display_name || inviterProfile.email} has invited you as <strong>${role || 'member'}</strong>${projectName ? ` to the project "<strong>${projectName}</strong>"` : ' to the team'}.</p>
              <a href="${inviteUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Accept Invitation</a>
              <p style="color: #999; font-size: 12px; margin-top: 24px;">This invitation expires in 7 days.</p>
            </div>
          `,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        autoAdded: !!existingProfile,
        invitation,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
