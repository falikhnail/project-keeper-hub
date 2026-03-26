import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, Lightbulb, PenLine, Loader2, Copy, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAIAssistant, type AIActionType } from '@/hooks/useAIAssistant';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface AIAssistantProps {
  projectData: {
    name: string;
    description?: string | null;
    status: string;
    dueDate?: string | null;
    tags?: string[];
    handlers?: { display_name?: string | null; email?: string | null }[];
    subtasks?: { title: string; completed: boolean }[];
    totalTimeTracked?: string;
    activities?: { description: string }[];
    comments?: { content: string }[];
  };
  onApplyDescription?: (description: string) => void;
}

const actions: { type: AIActionType; label: string; description: string; icon: typeof FileText }[] = [
  { type: 'summarize', label: 'Ringkasan Project', description: 'Buat ringkasan status project saat ini', icon: FileText },
  { type: 'suggest', label: 'Saran Tindakan', description: 'Dapatkan saran langkah selanjutnya', icon: Lightbulb },
  { type: 'generate_description', label: 'Generate Deskripsi', description: 'Buat deskripsi project otomatis', icon: PenLine },
];

export const AIAssistant = ({ projectData, onApplyDescription }: AIAssistantProps) => {
  const { loading, result, activeAction, runAction, clearResult } = useAIAssistant();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (type: AIActionType) => {
    runAction(type, projectData);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="grid gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.type;
          return (
            <Button
              key={action.type}
              variant={isActive ? 'default' : 'outline'}
              className={cn('h-auto flex-col gap-1 py-3 text-left', isActive && 'ring-2 ring-primary/30')}
              onClick={() => handleAction(action.type)}
              disabled={loading}
            >
              {loading && isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Result Display */}
      <AnimatePresence mode="wait">
        {(result || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-border bg-card/80 backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {loading ? 'AI sedang berpikir...' : actions.find((a) => a.type === activeAction)?.label}
              </div>
              <div className="flex items-center gap-1">
                {result && !loading && (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAction(activeAction!)}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}>
                      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    {activeAction === 'generate_description' && onApplyDescription && (
                      <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => onApplyDescription(result)}>
                        Terapkan
                      </Button>
                    )}
                  </>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={clearResult}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto px-4 py-3">
              {loading && !result ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <p className="text-center text-xs text-muted-foreground">
          Pilih salah satu aksi di atas untuk mendapatkan insight dari AI
        </p>
      )}
    </div>
  );
};
