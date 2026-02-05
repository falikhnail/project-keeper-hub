 import { useState } from 'react';
 import { Save, Loader2, X, Plus } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { useProjectTemplates, TemplateInput } from '@/hooks/useProjectTemplates';
 import { Project } from '@/hooks/useProjects';
 
 interface SaveAsTemplateDialogProps {
   open: boolean;
   onClose: () => void;
   project?: Project | null;
 }
 
 export const SaveAsTemplateDialog = ({
   open,
   onClose,
   project,
 }: SaveAsTemplateDialogProps) => {
   const { createTemplate } = useProjectTemplates();
   const [saving, setSaving] = useState(false);
   
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const [tags, setTags] = useState<string[]>([]);
   const [tagInput, setTagInput] = useState('');
   const [reminderDays, setReminderDays] = useState(3);
   const [subtasks, setSubtasks] = useState<string[]>([]);
   const [subtaskInput, setSubtaskInput] = useState('');
 
   // Initialize from project when opened
   useState(() => {
     if (project && open) {
       setName(`${project.name} Template`);
       setDescription(project.description || '');
       setTags(project.tags || []);
       setReminderDays(project.reminder_days);
       setSubtasks(project.subtasks?.map((s) => s.title) || []);
     }
   });
 
   const handleAddTag = () => {
     if (tagInput.trim() && !tags.includes(tagInput.trim())) {
       setTags([...tags, tagInput.trim()]);
       setTagInput('');
     }
   };
 
   const handleRemoveTag = (tag: string) => {
     setTags(tags.filter((t) => t !== tag));
   };
 
   const handleAddSubtask = () => {
     if (subtaskInput.trim() && !subtasks.includes(subtaskInput.trim())) {
       setSubtasks([...subtasks, subtaskInput.trim()]);
       setSubtaskInput('');
     }
   };
 
   const handleRemoveSubtask = (subtask: string) => {
     setSubtasks(subtasks.filter((s) => s !== subtask));
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!name.trim()) return;
 
     setSaving(true);
     try {
       const input: TemplateInput = {
         name: name.trim(),
         description: description.trim(),
         default_tags: tags,
         default_reminder_days: reminderDays,
         subtask_titles: subtasks,
       };
 
       await createTemplate(input);
       onClose();
       
       // Reset form
       setName('');
       setDescription('');
       setTags([]);
       setReminderDays(3);
       setSubtasks([]);
     } finally {
       setSaving(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
       <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Save className="h-5 w-5 text-primary" />
             Save as Template
           </DialogTitle>
           <DialogDescription>
             Create a reusable template from this project structure
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="template-name">Template Name *</Label>
             <Input
               id="template-name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="My Project Template"
               required
               disabled={saving}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="template-description">Description</Label>
             <Textarea
               id="template-description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Describe when to use this template..."
               rows={2}
               disabled={saving}
             />
           </div>
 
           <div className="space-y-2">
             <Label>Default Tags</Label>
             <div className="flex gap-2">
               <Input
                 value={tagInput}
                 onChange={(e) => setTagInput(e.target.value)}
                 placeholder="Add a tag..."
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     handleAddTag();
                   }
                 }}
                 disabled={saving}
               />
               <Button type="button" variant="outline" size="icon" onClick={handleAddTag} disabled={saving}>
                 <Plus className="h-4 w-4" />
               </Button>
             </div>
             {tags.length > 0 && (
               <div className="flex flex-wrap gap-1.5 mt-2">
                 {tags.map((tag) => (
                   <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                     {tag}
                     <button type="button" onClick={() => handleRemoveTag(tag)} className="rounded-full p-0.5 hover:bg-background/50" disabled={saving}>
                       <X className="h-3 w-3" />
                     </button>
                   </Badge>
                 ))}
               </div>
             )}
           </div>
 
           <div className="space-y-2">
             <Label>Default Reminder</Label>
             <Select value={reminderDays.toString()} onValueChange={(v) => setReminderDays(parseInt(v))} disabled={saving}>
               <SelectTrigger className="w-[180px]">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="1">1 day before</SelectItem>
                 <SelectItem value="3">3 days before</SelectItem>
                 <SelectItem value="7">7 days before</SelectItem>
                 <SelectItem value="14">14 days before</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Default Subtasks</Label>
             <div className="flex gap-2">
               <Input
                 value={subtaskInput}
                 onChange={(e) => setSubtaskInput(e.target.value)}
                 placeholder="Add a subtask..."
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     handleAddSubtask();
                   }
                 }}
                 disabled={saving}
               />
               <Button type="button" variant="outline" size="icon" onClick={handleAddSubtask} disabled={saving}>
                 <Plus className="h-4 w-4" />
               </Button>
             </div>
             {subtasks.length > 0 && (
               <div className="space-y-1 mt-2">
                 {subtasks.map((subtask, index) => (
                   <div key={index} className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                     <span className="text-muted-foreground">{index + 1}.</span>
                     <span className="flex-1">{subtask}</span>
                     <button type="button" onClick={() => handleRemoveSubtask(subtask)} className="text-muted-foreground hover:text-destructive" disabled={saving}>
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
           </div>
 
           <div className="flex justify-end gap-2 pt-4">
             <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
               Cancel
             </Button>
             <Button type="submit" disabled={!name.trim() || saving}>
               {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Save Template
             </Button>
           </div>
         </form>
       </DialogContent>
     </Dialog>
   );
 };