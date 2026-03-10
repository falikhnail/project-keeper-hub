import { useState, useRef } from 'react';
import { ImagePlus, Upload, X, Loader2, Camera } from 'lucide-react';
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
  projectUrl?: string | null;
}

export const ProjectCoverImage = ({
  projectId,
  coverImageUrl,
  onUploaded,
  onRemoved,
  editable = false,
  className,
  aspectRatio = 'video',
  projectUrl,
}: ProjectCoverImageProps) => {
  const [uploading, setUploading] = useState(false);
  const [screenshotting, setScreenshotting] = useState(false);
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

  const handleAutoScreenshot = async () => {
    if (!projectUrl) {
      toast({ title: 'No URL', description: 'Project does not have a URL to screenshot.', variant: 'destructive' });
      return;
    }

    setScreenshotting(true);
    try {
      const { data, error } = await supabase.functions.invoke('screenshot-url', {
        body: { url: projectUrl, projectId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Screenshot failed');

      onUploaded(data.url);
      toast({ title: 'Screenshot captured!', description: 'Cover image updated from project URL.' });
    } catch (error: any) {
      toast({ title: 'Screenshot failed', description: error.message, variant: 'destructive' });
    } finally {
      setScreenshotting(false);
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
            {projectUrl && (
              <Button size="sm" variant="secondary" onClick={handleAutoScreenshot} disabled={screenshotting}>
                {screenshotting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1.5 h-3.5 w-3.5" />}
                Re-capture
              </Button>
            )}
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
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
          aspectRatio === 'video' ? 'aspect-video' : 'aspect-square',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50',
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

      {projectUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoScreenshot}
          disabled={screenshotting}
          className="gap-2 self-start"
        >
          {screenshotting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {screenshotting ? 'Capturing screenshot...' : 'Auto-screenshot from URL'}
        </Button>
      )}
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
