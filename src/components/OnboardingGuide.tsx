import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderGit2,
  LayoutGrid,
  Columns3,
  CalendarDays,
  CheckCircle2,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ListChecks,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingGuideProps {
  onComplete: () => void;
  onSeedSampleData: () => void;
}

const steps = [
  {
    id: 'welcome',
    icon: Rocket,
    title: 'Welcome to Project Management',
    description:
      'Your central hub for tracking projects, deadlines, and team assignments. Let\'s walk you through the key features.',
    illustration: (
      <div className="flex items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <FolderGit2 className="h-7 w-7 text-foreground" />
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <ListChecks className="h-7 w-7 text-foreground" />
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <CheckCircle2 className="h-7 w-7 text-foreground" />
        </div>
      </div>
    ),
  },
  {
    id: 'views',
    icon: LayoutGrid,
    title: 'Multiple Dashboard Views',
    description:
      'Switch between Grid, Kanban, and Calendar views to manage your projects the way you prefer.',
    illustration: (
      <div className="flex items-center gap-2">
        {[
          { icon: LayoutGrid, label: 'Grid' },
          { icon: Columns3, label: 'Kanban' },
          { icon: CalendarDays, label: 'Calendar' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-5 py-4 shadow-sm"
          >
            <Icon className="h-6 w-6 text-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'features',
    icon: Sparkles,
    title: 'Powerful Features',
    description:
      'Subtasks with drag & drop, file attachments, comments, activity timeline, templates, and team assignments — all in one place.',
    illustration: (
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: ListChecks, label: 'Subtasks' },
          { icon: FileText, label: 'Templates' },
          { icon: FolderGit2, label: 'Attachments' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
          >
            <Icon className="h-5 w-5 text-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'start',
    icon: CheckCircle2,
    title: 'Ready to Go!',
    description:
      'You can start with sample projects to explore, or jump straight in and create your own.',
    illustration: null,
  },
];

export const OnboardingGuide = ({ onComplete, onSeedSampleData }: OnboardingGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-lg flex-col items-center rounded-xl border border-border bg-card p-8 shadow-sm"
    >
      {/* Progress dots */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === currentStep
                ? 'w-6 bg-foreground'
                : i < currentStep
                  ? 'w-1.5 bg-foreground/40'
                  : 'w-1.5 bg-border'
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary">
            <StepIcon className="h-6 w-6 text-foreground" />
          </div>

          <h2 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h2>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {step.illustration && <div className="mb-6">{step.illustration}</div>}

          {/* Last step: action buttons */}
          {isLastStep && (
            <div className="mb-4 flex w-full flex-col gap-2">
              <Button
                onClick={() => {
                  onSeedSampleData();
                  onComplete();
                }}
                className="w-full gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Start with Sample Projects
              </Button>
              <Button variant="outline" onClick={onComplete} className="w-full">
                Start from Scratch
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {!isLastStep && (
        <div className="mt-2 flex w-full items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="text-muted-foreground"
            >
              Skip
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentStep((s) => s + 1)}
              className="gap-1"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
