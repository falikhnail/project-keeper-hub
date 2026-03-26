import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export type AIActionType = 'summarize' | 'suggest' | 'generate_description';

interface ProjectDataForAI {
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
}

export const useAIAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [activeAction, setActiveAction] = useState<AIActionType | null>(null);

  const runAction = useCallback(async (type: AIActionType, projectData: ProjectDataForAI) => {
    setLoading(true);
    setResult('');
    setActiveAction(type);

    try {
      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type, projectData }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
        if (resp.status === 429) {
          toast.error('Rate limit tercapai, coba lagi nanti.');
        } else if (resp.status === 402) {
          toast.error('Kredit AI habis, silakan tambah kredit.');
        } else {
          toast.error(err.error || 'Terjadi kesalahan');
        }
        setLoading(false);
        setActiveAction(null);
        return '';
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullText = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch { /* ignore */ }
        }
      }

      setLoading(false);
      setActiveAction(null);
      return fullText;
    } catch (e) {
      console.error('AI Assistant error:', e);
      toast.error('Gagal menjalankan AI Assistant');
      setLoading(false);
      setActiveAction(null);
      return '';
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult('');
    setActiveAction(null);
  }, []);

  return { loading, result, activeAction, runAction, clearResult };
};
