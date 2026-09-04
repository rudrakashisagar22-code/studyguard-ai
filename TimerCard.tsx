import { Play, Pause, Square, Smartphone, BookOpen, BookX, HelpCircle } from 'lucide-react';
import type { SessionStatus, PresenceState } from '@/types';
import { formatClock } from '@/lib/format';

interface TimerCardProps {
  totalSeconds: number;
  status: SessionStatus;
  presence: PresenceState;
}

export function TimerCard({ totalSeconds, status, presence }: TimerCardProps) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isStopped = status === 'stopped';

  const statusLabel =
    status === 'idle'
      ? 'Ready to study'
      : status === 'running'
      ? presence === 'focused'
        ? 'Studying — Focused'
        : presence === 'not_studying'
        ? 'Studying — Not Focused'
        : presence === 'away'
        ? 'Studying — Away'
        : presence === 'phone_distraction'
        ? 'Studying — Phone Distraction'
        : presence === 'uncertain'
        ? 'Studying — Uncertain'
        : 'Studying — Detecting…'
      : status === 'paused'
      ? 'Paused'
      : 'Session complete';

  const statusColor =
    isRunning && presence === 'focused'
      ? 'text-success-600 bg-success-50'
      : isRunning && presence === 'not_studying'
      ? 'text-error-600 bg-error-50'
      : isRunning && presence === 'away'
      ? 'text-warning-600 bg-warning-50'
      : isRunning && presence === 'phone_distraction'
      ? 'text-error-600 bg-error-50'
      : isRunning && presence === 'uncertain'
      ? 'text-slate-600 bg-slate-100'
      : isRunning
      ? 'text-brand-600 bg-brand-50'
      : isPaused
      ? 'text-warning-600 bg-warning-50'
      : isStopped
      ? 'text-accent-600 bg-accent-50'
      : 'text-slate-500 bg-slate-100';

  const ringColor = isRunning
    ? presence === 'focused'
      ? 'shadow-[0_0_0_4px_rgb(16_185_129_0.15)]'
      : presence === 'not_studying'
      ? 'shadow-[0_0_0_4px_rgb(239_68_68_0.15)]'
      : presence === 'away'
      ? 'shadow-[0_0_0_4px_rgb(245_158_11_0.15)]'
      : presence === 'phone_distraction'
      ? 'shadow-[0_0_0_4px_rgb(239_68_68_0.15)]'
      : presence === 'uncertain'
      ? 'shadow-[0_0_0_4px_rgb(100_116_139_0.15)]'
      : 'shadow-[0_0_0_4px_rgb(51_102_255_0.15)]'
    : 'shadow-none';

  return (
    <div className="card p-6 sm:p-8 relative overflow-hidden">
      {/* Subtle background glow when running */}
      {isRunning && (
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-brand-100/50 blur-3xl" />
      )}

      <div className="relative flex flex-col items-center text-center">
        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold ${statusColor} transition-colors duration-300`}>
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
          )}
          {isPaused && <Pause size={14} className="fill-current" />}
          {isStopped && <Square size={14} className="fill-current" />}
          {status === 'idle' && <Play size={14} className="fill-current" />}
          {isRunning && presence === 'phone_distraction' && <Smartphone size={14} className="fill-current" />}
          {isRunning && presence === 'focused' && <BookOpen size={14} className="fill-current" />}
          {isRunning && presence === 'not_studying' && <BookX size={14} className="fill-current" />}
          {isRunning && presence === 'uncertain' && <HelpCircle size={14} className="fill-current" />}
          {statusLabel}
        </div>

        {/* Timer display */}
        <div
          className={`mt-6 text-5xl sm:text-7xl font-extrabold tabular-nums tracking-tight text-slate-900 transition-all duration-300 rounded-2xl px-6 py-2 ${ringColor}`}
        >
          {formatClock(totalSeconds)}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {status === 'idle' && 'Press start to begin your study session'}
          {status === 'running' && 'Session in progress'}
          {status === 'paused' && 'Session is paused'}
          {status === 'stopped' && 'Your session has ended — see the report below'}
        </p>
      </div>
    </div>
  );
}
