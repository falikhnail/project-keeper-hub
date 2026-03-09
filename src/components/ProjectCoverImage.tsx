import { useState, useRef } from 'react';
import { ImagePlus, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProjectCoverImageProps {
  projectId: string;
  coverImageUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  editable?: boolean;
  className?: string;
  aspectRatio?: 'video' | 'square';
}

export const ProjectCoverImage = ({
  projectId,
  coverImageUrl,
  onUploaded,
  onRemoved,
  editable = false,
  className,
  aspectRatio = 'video',
}: ProjectCoverImageProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${projectId}/cover-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-covers')
        .getPublicUrl(filePath);

      // Update project
      const { error: updateError } = await supabase
        .from('projects')
        .update({ cover_image_url: publicUrl } as any)
        .eq('id', projectId);

      if (updateError) throw updateError;

      onUploaded(publicUrl);
      toast({ title: 'Cover uploaded', description: 'Project cover image has been updated.' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ cover_image_url: null } as any)
        .eq('id', projectId);

      if (error) throw error;
      onRemoved();
      toast({ title: 'Cover removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  if (coverImageUrl) {
    return (
      <div className={cn(
        'group relative overflow-hidden rounded-lg',
        aspectRatio === 'video' ? 'aspect-video' : 'aspect-square',
        className
      )}>
        <img
          src={coverImageUrl}
          alt="Project cover"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {editable && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Change
            </Button>
            <Button size="sm" variant="destructive" onClick={handleRemove}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </div>
        )}
      </div>
    );
  }

  if (!editable) return null;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
        aspectRatio === 'video' ? 'aspect-video' : 'aspect-square',
        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50',
        className
      )}
    >
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <>
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Drop image or click to upload
          </span>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
    </div>
  );
};

// Compact thumbnail for cards
export const ProjectCoverThumbnail = ({
  coverImageUrl,
  className,
}: {
  coverImageUrl: string | null;
  className?: string;
}) => {
  if (!coverImageUrl) return null;

  return (
    <div className={cn('overflow-hidden rounded-lg', className)}>
      <img
        src={coverImageUrl}
        alt="Project cover"
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
};
