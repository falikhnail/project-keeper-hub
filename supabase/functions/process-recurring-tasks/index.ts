import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();

    // Get active recurring tasks that are due
    const { data: tasks, error: fetchError } = await supabase
      .from("recurring_tasks")
      .select("*, project_templates(*)")
      .eq("is_active", true)
      .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`);

    if (fetchError) throw fetchError;

    let created = 0;

    for (const task of tasks || []) {
      const template = task.project_templates;
      if (!template) continue;

      const dateSuffix = now.toISOString().split("T")[0];
      const projectName = task.name_prefix
        ? `${task.name_prefix} - ${dateSuffix}`
        : `${template.name} - ${dateSuffix}`;

      // Create the project
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: projectName,
          description: template.description,
          status: "active",
          tags: template.default_tags,
          reminder_days: template.default_reminder_days,
          created_by: task.created_by,
          last_handler_id: task.created_by,
        })
        .select()
        .single();

      if (projectError) {
        console.error("Error creating project:", projectError);
        continue;
      }

      // Add subtasks from template
      if (template.subtask_titles?.length > 0) {
        const subtasks = template.subtask_titles.map(
          (title: string, idx: number) => ({
            project_id: newProject.id,
            title,
            order_position: idx,
            created_by: task.created_by,
          })
        );
        await supabase.from("project_subtasks").insert(subtasks);
      }

      // Auto-assign handlers from template
      if (template.default_handler_ids?.length > 0) {
        const handlers = template.default_handler_ids.map(
          (profileId: string) => ({
            project_id: newProject.id,
            profile_id: profileId,
          })
        );
        await supabase.from("project_handlers").insert(handlers);
      }

      // Add creator as handler
      await supabase.from("project_handlers").insert({
        project_id: newProject.id,
        profile_id: task.created_by,
      });

      // Add activity
      await supabase.from("project_activities").insert({
        project_id: newProject.id,
        type: "created",
        description: `Auto-created from recurring task "${task.name_prefix || template.name}"`,
        handler_id: task.created_by,
      });

      // Calculate next run based on cron expression (simple parsing)
      const nextRun = calculateNextRun(task.cron_expression, now);

      await supabase
        .from("recurring_tasks")
        .update({ last_run_at: now.toISOString(), next_run_at: nextRun.toISOString() })
        .eq("id", task.id);

      created++;
    }

    return new Response(
      JSON.stringify({ success: true, created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateNextRun(cron: string, from: Date): Date {
  // Simple cron parser for common patterns
  const parts = cron.split(" ");
  const next = new Date(from);

  if (parts.length === 5) {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Daily: 0 9 * * *
    if (dayOfMonth === "*" && dayOfWeek === "*") {
      next.setDate(next.getDate() + 1);
      next.setHours(parseInt(hour) || 9, parseInt(minute) || 0, 0, 0);
      return next;
    }

    // Weekly: 0 9 * * 1 (Monday)
    if (dayOfMonth === "*" && dayOfWeek !== "*") {
      const targetDay = parseInt(dayOfWeek);
      let daysUntil = targetDay - next.getDay();
      if (daysUntil <= 0) daysUntil += 7;
      next.setDate(next.getDate() + daysUntil);
      next.setHours(parseInt(hour) || 9, parseInt(minute) || 0, 0, 0);
      return next;
    }

    // Monthly: 0 9 1 * *
    if (dayOfMonth !== "*") {
      next.setMonth(next.getMonth() + 1);
      next.setDate(parseInt(dayOfMonth));
      next.setHours(parseInt(hour) || 9, parseInt(minute) || 0, 0, 0);
      return next;
    }
  }

  // Fallback: next week
  next.setDate(next.getDate() + 7);
  next.setHours(9, 0, 0, 0);
  return next;
}
