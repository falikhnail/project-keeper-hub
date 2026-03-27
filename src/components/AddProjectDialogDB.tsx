 import { useState, useEffect } from 'react';
 import { X, Plus, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Project, ProjectInput } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
import { Badge } from '@/components/ui/badge';
import { DueDatePicker } from '@/components/DueDatePicker';
 import { TemplateSelector } from '@/components/TemplateSelector';
 import { ProjectTemplate } from '@/hooks/useProjectTemplates';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AddProjectDialogDBProps {
  open: boolean;
  onClose: () => void;
   onSave: (project: ProjectInput, initialSubtasks?: string[], templateHandlerIds?: string[]) => Promise<void>;
  editingProject?: Project | null;
}

export const AddProjectDialogDB = ({
  open,
  onClose,
  onSave,
  editingProject,
}: AddProjectDialogDBProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on-hold' | 'archived'>('active');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderDays, setReminderDays] = useState(3);
  const [saving, setSaving] = useState(false);
   const [templateOpen, setTemplateOpen] = useState(false);
   const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
   const [initialSubtasks, setInitialSubtasks] = useState<string[]>([]);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || '');
      setLink(editingProject.link || '');
      setStatus(editingProject.status);
      setTags(editingProject.tags || []);
      setDueDate(editingProject.due_date);
      setReminderDays(editingProject.reminder_days);
    } else {
      resetForm();
    }
  }, [editingProject, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setLink('');
    setStatus('active');
    setTagInput('');
    setTags([]);
    setDueDate(null);
    setReminderDays(3);
     setSelectedTemplate(null);
     setInitialSubtasks([]);
     setTemplateOpen(false);
  };
 
   const handleTemplateSelect = (template: ProjectTemplate) => {
     setSelectedTemplate(template);
     setTags(template.default_tags);
     setReminderDays(template.default_reminder_days);
     setInitialSubtasks(template.subtask_titles);
     setTemplateOpen(false);
   };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        link: link.trim(),
        status,
        tags,
        due_date: dueDate,
        reminder_days: reminderDays,
       }, initialSubtasks);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingProject ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              required
              disabled={saving}
            />
          </div>

         {/* Template Selector - only show for new projects */}
         {!editingProject && (
           <Collapsible open={templateOpen} onOpenChange={setTemplateOpen}>
             <CollapsibleTrigger asChild>
               <Button
                 type="button"
                 variant="outline"
                 className="w-full justify-between"
                 disabled={saving}
               >
                 <span className="flex items-center gap-2">
                   <FileText className="h-4 w-4" />
                   {selectedTemplate ? selectedTemplate.name : 'Use Template (Optional)'}
                 </span>
                 {templateOpen ? (
                   <ChevronUp className="h-4 w-4" />
                 ) : (
                   <ChevronDown className="h-4 w-4" />
                 )}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="pt-2">
               <TemplateSelector
                 onSelect={handleTemplateSelect}
                 selectedId={selectedTemplate?.id}
               />
             </CollapsibleContent>
           </Collapsible>
         )}
 
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the project..."
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Project Link</Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/..."
              type="url"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: typeof status) => setStatus(value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                disabled={saving}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full p-0.5 hover:bg-background/50"
                      disabled={saving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <DueDatePicker
              dueDate={dueDate}
              reminderDays={reminderDays}
              onDueDateChange={setDueDate}
              onReminderDaysChange={setReminderDays}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProject ? 'Update Project' : 'Add Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
