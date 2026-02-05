 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 import { useToast } from './use-toast';
 
 export interface ProjectTemplate {
   id: string;
   name: string;
   description: string | null;
   default_tags: string[];
   default_reminder_days: number;
   subtask_titles: string[];
   created_at: Date;
   updated_at: Date;
 }
 
 export interface TemplateInput {
   name: string;
   description: string;
   default_tags: string[];
   default_reminder_days: number;
   subtask_titles: string[];
 }
 
 export const useProjectTemplates = () => {
   const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
   const [loading, setLoading] = useState(true);
   const { profile } = useAuth();
   const { toast } = useToast();
 
   const fetchTemplates = useCallback(async () => {
     if (!profile) {
       setLoading(false);
       return;
     }
 
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('project_templates')
         .select('*')
         .order('created_at', { ascending: false });
 
       if (error) throw error;
 
       const mapped: ProjectTemplate[] = (data || []).map((t: any) => ({
         id: t.id,
         name: t.name,
         description: t.description,
         default_tags: t.default_tags || [],
         default_reminder_days: t.default_reminder_days ?? 3,
         subtask_titles: t.subtask_titles || [],
         created_at: new Date(t.created_at),
         updated_at: new Date(t.updated_at),
       }));
 
       setTemplates(mapped);
     } catch (error: any) {
       console.error('Error fetching templates:', error);
     } finally {
       setLoading(false);
     }
   }, [profile]);
 
   useEffect(() => {
     fetchTemplates();
   }, [fetchTemplates]);
 
   const createTemplate = async (input: TemplateInput) => {
     if (!profile) return null;
 
     try {
       const { data, error } = await supabase
         .from('project_templates')
         .insert({
           name: input.name,
           description: input.description || null,
           default_tags: input.default_tags,
           default_reminder_days: input.default_reminder_days,
           subtask_titles: input.subtask_titles,
           created_by: profile.id,
         } as any)
         .select()
         .single();
 
       if (error) throw error;
 
       toast({
         title: 'Template Saved',
         description: `Template "${input.name}" has been created.`,
       });
 
       fetchTemplates();
       return data;
     } catch (error: any) {
       toast({
         title: 'Error creating template',
         description: error.message,
         variant: 'destructive',
       });
       return null;
     }
   };
 
   const updateTemplate = async (id: string, input: TemplateInput) => {
     try {
       const { error } = await supabase
         .from('project_templates')
         .update({
           name: input.name,
           description: input.description || null,
           default_tags: input.default_tags,
           default_reminder_days: input.default_reminder_days,
           subtask_titles: input.subtask_titles,
         } as any)
         .eq('id', id);
 
       if (error) throw error;
 
       toast({
         title: 'Template Updated',
         description: `Template "${input.name}" has been updated.`,
       });
 
       fetchTemplates();
     } catch (error: any) {
       toast({
         title: 'Error updating template',
         description: error.message,
         variant: 'destructive',
       });
     }
   };
 
   const deleteTemplate = async (id: string) => {
     try {
       const template = templates.find((t) => t.id === id);
 
       const { error } = await supabase
         .from('project_templates')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
 
       toast({
         title: 'Template Deleted',
         description: `Template "${template?.name}" has been removed.`,
         variant: 'destructive',
       });
 
       fetchTemplates();
     } catch (error: any) {
       toast({
         title: 'Error deleting template',
         description: error.message,
         variant: 'destructive',
       });
     }
   };
 
   return {
     templates,
     loading,
     createTemplate,
     updateTemplate,
     deleteTemplate,
     refetch: fetchTemplates,
   };
 };