 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { FileText, Check, Trash2, ChevronRight, Tag, ListChecks, Clock } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { useProjectTemplates, ProjectTemplate } from '@/hooks/useProjectTemplates';
 import { cn } from '@/lib/utils';
 
 interface TemplateSelectorProps {
   onSelect: (template: ProjectTemplate) => void;
   selectedId?: string | null;
 }
 
 export const TemplateSelector = ({ onSelect, selectedId }: TemplateSelectorProps) => {
   const { templates, loading, deleteTemplate } = useProjectTemplates();
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [templateToDelete, setTemplateToDelete] = useState<ProjectTemplate | null>(null);
 
   const handleDeleteClick = (e: React.MouseEvent, template: ProjectTemplate) => {
     e.stopPropagation();
     setTemplateToDelete(template);
     setDeleteDialogOpen(true);
   };
 
   const handleConfirmDelete = async () => {
     if (templateToDelete) {
       await deleteTemplate(templateToDelete.id);
       setDeleteDialogOpen(false);
       setTemplateToDelete(null);
     }
   };
 
   if (loading) {
     return (
       <div className="flex items-center justify-center py-8">
         <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
       </div>
     );
   }
 
   if (templates.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center py-8 text-center">
         <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
         <p className="text-sm text-muted-foreground">No templates yet</p>
         <p className="text-xs text-muted-foreground mt-1">
           Save a project as template to get started
         </p>
       </div>
     );
   }
 
   return (
     <>
       <ScrollArea className="max-h-[300px]">
         <div className="space-y-2">
           <AnimatePresence>
             {templates.map((template) => (
               <motion.div
                 key={template.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
               >
                 <button
                   type="button"
                   onClick={() => onSelect(template)}
                   className={cn(
                     'w-full rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-accent/50',
                     selectedId === template.id
                       ? 'border-primary bg-primary/5'
                       : 'border-border bg-card'
                   )}
                 >
                   <div className="flex items-start justify-between gap-2">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <FileText className="h-4 w-4 text-primary shrink-0" />
                         <span className="font-medium text-foreground truncate">
                           {template.name}
                         </span>
                         {selectedId === template.id && (
                           <Check className="h-4 w-4 text-primary shrink-0" />
                         )}
                       </div>
                       {template.description && (
                         <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                           {template.description}
                         </p>
                       )}
                       <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                         {template.default_tags.length > 0 && (
                           <span className="flex items-center gap-1">
                             <Tag className="h-3 w-3" />
                             {template.default_tags.length} tags
                           </span>
                         )}
                         {template.subtask_titles.length > 0 && (
                           <span className="flex items-center gap-1">
                             <ListChecks className="h-3 w-3" />
                             {template.subtask_titles.length} subtasks
                           </span>
                         )}
                         <span className="flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           {template.default_reminder_days}d reminder
                         </span>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       <Button
                         type="button"
                         variant="ghost"
                         size="icon"
                         className="h-7 w-7 text-muted-foreground hover:text-destructive"
                         onClick={(e) => handleDeleteClick(e, template)}
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </Button>
                       <ChevronRight className="h-4 w-4 text-muted-foreground" />
                     </div>
                   </div>
                 </button>
               </motion.div>
             ))}
           </AnimatePresence>
         </div>
       </ScrollArea>
 
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Template?</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 };