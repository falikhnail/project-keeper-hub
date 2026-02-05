 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface Project {
   id: string;
   name: string;
   description: string | null;
   due_date: string;
   reminder_days: number;
   status: string;
   created_by: string;
 }
 
 interface Profile {
   email: string | null;
   display_name: string | null;
 }
 
 const generateEmailHTML = (
   userName: string,
   projectName: string,
   dueDate: Date,
   daysLeft: number,
   projectDescription: string | null,
   projectUrl: string
 ) => {
   const formattedDate = dueDate.toLocaleDateString('id-ID', {
     weekday: 'long',
     year: 'numeric',
     month: 'long',
     day: 'numeric'
   });
 
   const urgencyColor = daysLeft <= 1 ? '#ef4444' : daysLeft <= 3 ? '#f59e0b' : '#3b82f6';
   const urgencyBg = daysLeft <= 1 ? '#fef2f2' : daysLeft <= 3 ? '#fffbeb' : '#eff6ff';
   const urgencyText = daysLeft === 0 ? 'Hari Ini!' : daysLeft === 1 ? 'Besok!' : `${daysLeft} Hari Lagi`;
 
   return `
 <!DOCTYPE html>
 <html lang="id">
 <head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Pengingat Deadline Proyek</title>
 </head>
 <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
   <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
     <tr>
       <td align="center">
         <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
           <!-- Header -->
           <tr>
             <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px;">
               <table width="100%" cellpadding="0" cellspacing="0">
                 <tr>
                   <td>
                     <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                       ⏰ Pengingat Deadline
                     </h1>
                     <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                       Proyek Anda membutuhkan perhatian
                     </p>
                   </td>
                 </tr>
               </table>
             </td>
           </tr>
           
           <!-- Content -->
           <tr>
             <td style="padding: 40px;">
               <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                 Halo <strong>${userName}</strong>,
               </p>
               
               <!-- Urgency Badge -->
               <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                 <tr>
                   <td align="center">
                     <div style="display: inline-block; background-color: ${urgencyBg}; border: 2px solid ${urgencyColor}; border-radius: 50px; padding: 12px 24px;">
                       <span style="color: ${urgencyColor}; font-size: 18px; font-weight: 700;">
                         🔔 Deadline: ${urgencyText}
                       </span>
                     </div>
                   </td>
                 </tr>
               </table>
               
               <!-- Project Card -->
               <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 24px;">
                 <tr>
                   <td style="padding: 24px;">
                     <table width="100%" cellpadding="0" cellspacing="0">
                       <tr>
                         <td>
                           <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 600;">
                             📁 ${projectName}
                           </h2>
                           ${projectDescription ? `
                           <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                             ${projectDescription}
                           </p>
                           ` : ''}
                           <table cellpadding="0" cellspacing="0">
                             <tr>
                               <td style="padding-right: 24px;">
                                 <p style="margin: 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                   Deadline
                                 </p>
                                 <p style="margin: 4px 0 0; color: ${urgencyColor}; font-size: 16px; font-weight: 600;">
                                   ${formattedDate}
                                 </p>
                               </td>
                               <td>
                                 <p style="margin: 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                   Sisa Waktu
                                 </p>
                                 <p style="margin: 4px 0 0; color: ${urgencyColor}; font-size: 16px; font-weight: 600;">
                                   ${daysLeft === 0 ? 'Hari ini!' : `${daysLeft} hari`}
                                 </p>
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
                     </table>
                   </td>
                 </tr>
               </table>
               
               <!-- CTA Button -->
               <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                 <tr>
                   <td align="center">
                     <a href="${projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);">
                       Lihat Detail Proyek →
                     </a>
                   </td>
                 </tr>
               </table>
               
               <!-- Tips Section -->
               <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                 <tr>
                   <td style="padding: 16px 20px;">
                     <p style="margin: 0 0 8px; color: #166534; font-size: 14px; font-weight: 600;">
                       💡 Tips Produktivitas
                     </p>
                     <p style="margin: 0; color: #15803d; font-size: 13px; line-height: 1.5;">
                       Pecah proyek menjadi subtask kecil dan selesaikan satu per satu. Mulai dari yang paling mudah untuk membangun momentum!
                     </p>
                   </td>
                 </tr>
               </table>
             </td>
           </tr>
           
           <!-- Footer -->
           <tr>
             <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
               <table width="100%" cellpadding="0" cellspacing="0">
                 <tr>
                   <td>
                     <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                       Email ini dikirim otomatis karena Anda mengatur pengingat untuk proyek ini.
                     </p>
                     <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                       © ${new Date().getFullYear()} Project Manager. Semua hak dilindungi.
                     </p>
                   </td>
                 </tr>
               </table>
             </td>
           </tr>
         </table>
       </td>
     </tr>
   </table>
 </body>
 </html>
   `;
 };
 
 const handler = async (req: Request): Promise<Response> => {
   // Handle CORS preflight requests
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     console.log("Starting deadline reminder check...");
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Get all active projects with due dates
     const { data: projects, error: projectsError } = await supabase
       .from("projects")
       .select("id, name, description, due_date, reminder_days, status, created_by")
       .not("due_date", "is", null)
       .in("status", ["active", "on-hold"]);
 
     if (projectsError) {
       console.error("Error fetching projects:", projectsError);
       throw projectsError;
     }
 
     console.log(`Found ${projects?.length || 0} projects with due dates`);
 
     const now = new Date();
     now.setHours(0, 0, 0, 0);
 
     const emailsSent: string[] = [];
     const errors: string[] = [];
 
     for (const project of projects || []) {
       const dueDate = new Date(project.due_date);
       dueDate.setHours(0, 0, 0, 0);
       
       const diffTime = dueDate.getTime() - now.getTime();
       const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       
       const reminderDays = project.reminder_days || 3;
 
       console.log(`Project "${project.name}": ${daysUntilDue} days until due (reminder at ${reminderDays} days)`);
 
       // Send reminder if within reminder window and not overdue by more than 1 day
       if (daysUntilDue >= 0 && daysUntilDue <= reminderDays) {
         // Get owner's email from profiles
         const { data: profile, error: profileError } = await supabase
           .from("profiles")
           .select("email, display_name")
           .eq("id", project.created_by)
           .single();
 
         if (profileError || !profile?.email) {
           console.error(`Could not find email for project owner: ${project.created_by}`);
           errors.push(`No email for project: ${project.name}`);
           continue;
         }
 
         const userName = profile.display_name || profile.email.split("@")[0];
         const projectUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/project/${project.id}`;
 
         const emailHtml = generateEmailHTML(
           userName,
           project.name,
           dueDate,
           daysUntilDue,
           project.description,
           projectUrl
         );
 
         try {
           const { error: emailError } = await resend.emails.send({
             from: "Project Manager <onboarding@resend.dev>",
             to: [profile.email],
             subject: daysUntilDue === 0 
               ? `⚠️ HARI INI: Deadline "${project.name}"`
               : daysUntilDue === 1
               ? `⏰ BESOK: Deadline "${project.name}"`
               : `📅 ${daysUntilDue} Hari Lagi: Deadline "${project.name}"`,
             html: emailHtml,
           });
 
           if (emailError) {
             console.error(`Error sending email for project ${project.name}:`, emailError);
             errors.push(`Failed to send email for: ${project.name}`);
           } else {
             console.log(`Email sent successfully to ${profile.email} for project: ${project.name}`);
             emailsSent.push(`${project.name} -> ${profile.email}`);
           }
         } catch (emailErr) {
           console.error(`Exception sending email for project ${project.name}:`, emailErr);
           errors.push(`Exception for: ${project.name}`);
         }
       }
     }
 
     const response = {
       success: true,
       message: `Processed ${projects?.length || 0} projects`,
       emailsSent,
       errors: errors.length > 0 ? errors : undefined,
       timestamp: new Date().toISOString(),
     };
 
     console.log("Deadline reminder check completed:", response);
 
     return new Response(JSON.stringify(response), {
       status: 200,
       headers: { "Content-Type": "application/json", ...corsHeaders },
     });
   } catch (error: any) {
     console.error("Error in send-deadline-reminder function:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 500,
         headers: { "Content-Type": "application/json", ...corsHeaders },
       }
     );
   }
 };
 
 serve(handler);