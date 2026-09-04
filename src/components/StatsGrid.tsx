import { Clock, TrendingUp, Eye, EyeOff, Smartphone, BookX, HelpCircle } from 'lucide-react';
import { formatClock, formatDuration, formatPercentage } from '@/lib/format';

interface StatsGridProps {
  totalSeconds: number;
  focusedSeconds: number;
  awaySeconds: number;
  phoneDistractionSeconds: number;
  phoneDistractionCount: number;
  notStudyingSeconds: number;
  uncertainSeconds: number;
  focusPercentage: number;
}

export function StatsGrid({
  totalSeconds,
  focusedSeconds,
  awaySeconds,
  phoneDistractionSeconds,
  phoneDistractionCount,
  notStudyingSeconds,
  uncertainSeconds,
  focusPercentage,
}: StatsGridProps) {
  const cards = [
    {
      label: "Today's Study Time",
      value: formatClock(totalSeconds),
      sub: formatDuration(totalSeconds) + ' total',
      icon: Clock,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'Focused Time',
      value: formatClock(focusedSeconds),
      sub: formatPercentage(focusedSeconds / Math.max(totalSeconds, 1) * 100) + ' of session',
      icon: Eye,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      label: 'Not Focused',
      value: formatClock(notStudyingSeconds),
      sub: formatPercentage(notStudyingSeconds / Math.max(totalSeconds, 1) * 100) + ' of session',
      icon: BookX,
      color: 'text-error-600',
      bg: 'bg-error-50',
    },
    {
      label: 'Away Time',
      value: formatClock(awaySeconds),
      sub: formatPercentage(awaySeconds / Math.max(totalSeconds, 1) * 100) + ' of session',
      icon: EyeOff,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: 'Focus Percentage',
      value: formatPercentage(focusPercentage),
      sub: focusPercentage >= 75 ? 'Great focus' : focusPercentage >= 50 ? 'Keep going' : 'Stay focused',
      icon: TrendingUp,
      color: 'text-accent-600',
      bg: 'bg-accent-50',
    },
    {
      label: 'Phone Distraction',
      value: formatClock(phoneDistractionSeconds),
      sub: phoneDistractionCount === 0
        ? 'No distractions'
        : `${phoneDistractionCount} ${phoneDistractionCount === 1 ? 'distraction' : 'distractions'}`,
      icon: Smartphone,
      color: 'text-error-600',
      bg: 'bg-error-50',
    },
    {
      label: 'Uncertain',
      value: formatClock(uncertainSeconds),
      sub: uncertainSeconds === 0
        ? 'No uncertain time'
        : formatPercentage(uncertainSeconds / Math.max(totalSeconds, 1) * 100) + ' of session',
      icon: HelpCircle,
      color: 'text-slate-500',
      bg: 'bg-slate-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="card p-5 hover:shadow-card-hover transition-all duration-300 animate-scale-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {c.label}
            </span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.bg}`}>
              <c.icon size={16} className={c.color} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {c.value}
          </div>
          <div className="mt-1 text-xs text-slate-500">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
