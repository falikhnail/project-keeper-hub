import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2 } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingProject?: Project | null;
}

export const AddProjectDialog = ({
  open,
  onClose,
  onAdd,
  editingProject,
}: AddProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingProject?.name || '',
    description: editingProject?.description || '',
    link: editingProject?.link || '',
    status: editingProject?.status || 'active' as ProjectStatus,
    handlerName: editingProject?.lastHandler.name || '',
    handlerEmail: editingProject?.lastHandler.email || '',
    tags: editingProject?.tags?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const handler = {
      name: formData.handlerName,
      email: formData.handlerEmail,
    };

    onAdd({
      name: formData.name,
      description: formData.description,
      link: formData.link,
      status: formData.status,
      lastHandler: handler,
      allHandlers: [handler],
      activities: [
        {
          id: crypto.randomUUID(),
          type: 'created',
          description: 'Project created',
          handler: handler,
          timestamp: new Date(),
        },
      ],
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setLoading(false);
    setFormData({
      name: '',
      description: '',
      link: '',
      status: 'active',
      handlerName: '',
      handlerEmail: '',
      tags: '',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="relative rounded-xl border border-border bg-card p-6 shadow-xl">
              {/* Glow */}
              <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-xl" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingProject
                    ? 'Update project details below'
                    : 'Fill in the project details below'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief project description"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Project Link</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://github.com/..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="handlerName">Last Handler Name</Label>
                    <Input
                      id="handlerName"
                      value={formData.handlerName}
                      onChange={(e) => setFormData({ ...formData, handlerName: e.target.value })}
                      placeholder="Handler name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="handlerEmail">Handler Email</Label>
                    <Input
                      id="handlerEmail"
                      type="email"
                      value={formData.handlerEmail}
                      onChange={(e) => setFormData({ ...formData, handlerEmail: e.target.value })}
                      placeholder="handler@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {editingProject ? 'Update' : 'Add Project'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
