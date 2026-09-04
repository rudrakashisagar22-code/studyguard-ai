import { Target, Pencil, RotateCcw, Check, Calendar, Clock, TrendingUp } from 'lucide-react';
import type { StudyGoal, GoalProgress } from '@/types';

interface StudyGoalCardProps {
  goal: StudyGoal | null;
  progress: GoalProgress | null;
  onEdit: () => void;
  onResetProgress: () => void;
}

function formatHm(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

export function StudyGoalCard({ goal, progress, onEdit, onResetProgress }: StudyGoalCardProps) {
  if (!goal || goal.dailyTargetSeconds <= 0) {
    return (
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-brand-50">
            <Target size={20} className="text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Study Goal</h3>
            <p className="text-xs text-slate-500">Set a daily target to track progress</p>
          </div>
        </div>
        <button onClick={onEdit} className="mt-4 btn-primary w-full py-2.5 text-sm">
          Set Study Goal
        </button>
      </div>
    );
  }

  const pct = progress ? Math.round(progress.percentage) : 0;
  const isComplete = progress?.isComplete ?? false;

  // Days until exam
  let examInfo: string | null = null;
  if (goal.examDate) {
    const exam = new Date(goal.examDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = exam.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      examInfo = `${diffDays} day${diffDays === 1 ? '' : 's'} until exam`;
    } else if (diffDays === 0) {
      examInfo = 'Exam is today';
    } else {
      examInfo = null;
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isComplete ? 'bg-success-50' : 'bg-brand-50'}`}>
            {isComplete ? (
              <Check size={20} className="text-success-600" />
            ) : (
              <Target size={20} className="text-brand-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{goal.subject}</h3>
            <p className="text-xs text-slate-500">Today's Study Goal</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Edit goal"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onResetProgress}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Reset progress"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Target size={11} />
            Target
          </div>
          <div className="mt-1 text-base font-bold text-slate-900 tabular-nums">
            {formatHm(goal.dailyTargetSeconds)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Check size={11} />
            Completed
          </div>
          <div className="mt-1 text-base font-bold text-success-600 tabular-nums">
            {formatHm(goal.completedSeconds)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Clock size={11} />
            Remaining
          </div>
          <div className="mt-1 text-base font-bold text-slate-900 tabular-nums">
            {progress ? formatHm(progress.remainingSeconds) : '0m'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500 flex items-center gap-1">
            <TrendingUp size={11} />
            Progress
          </span>
          <span className={`font-semibold ${isComplete ? 'text-success-600' : 'text-slate-700'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-success-500' : 'bg-brand-500'
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      {/* Exam date */}
      {examInfo && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} />
          {examInfo}
        </div>
      )}

      {/* Complete banner */}
      {isComplete && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50 text-sm text-success-700 font-medium animate-fade-in">
          <Check size={15} />
          Daily goal complete! Great work.
        </div>
      )}
    </div>
  );
}
