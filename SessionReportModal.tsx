import { useEffect } from 'react';
import { BarChart3, Clock, Eye, EyeOff, Award, TrendingUp, Smartphone, BookX, HelpCircle, X, Monitor, BookOpen, Footprints, Headphones } from 'lucide-react';
import type { SessionReport, StudyMode, StudyGoal, GoalProgress } from '@/types';
import { STUDY_MODE_LABELS } from '@/types';
import { formatClock, formatPercentage } from '@/lib/format';

interface SessionReportModalProps {
  report: SessionReport | null;
  goal: StudyGoal | null;
  goalProgress: GoalProgress | null;
  onClose: () => void;
  onNewSession: () => void;
}

const STUDY_MODE_META: Record<StudyMode, { emoji: string; icon: typeof Monitor; label: string }> = {
  desk: { emoji: '💻', icon: Monitor, label: 'Desk Mode' },
  reading: { emoji: '📖', icon: BookOpen, label: 'Reading Mode' },
  active: { emoji: '🚶', icon: Footprints, label: 'Active Mode' },
  lecture: { emoji: '🎧', icon: Headphones, label: 'Lecture Mode' },
};

export function SessionReportModal({ report, goal, goalProgress, onClose, onNewSession }: SessionReportModalProps) {
  useEffect(() => {
    if (!report) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [report, onClose]);

  if (!report) return null;

  const focusPct = report.focusPercentage;
  const grade =
    focusPct >= 85 ? { label: 'Excellent', color: 'text-success-600', bg: 'bg-success-50' }
    : focusPct >= 65 ? { label: 'Good', color: 'text-brand-600', bg: 'bg-brand-50' }
    : focusPct >= 40 ? { label: 'Fair', color: 'text-warning-600', bg: 'bg-warning-50' }
    : { label: 'Needs focus', color: 'text-error-600', bg: 'bg-error-50' };

  const modeMeta = STUDY_MODE_META[report.studyMode];
  const ModeIcon = modeMeta.icon;

  const stats = [
    { label: 'Total Study Time', value: formatClock(report.totalSeconds), icon: Clock, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Focused Time', value: formatClock(report.focusedSeconds), icon: Eye, color: 'text-success-600', bg: 'bg-success-50' },
    { label: 'Not Focused', value: formatClock(report.notStudyingSeconds), icon: BookX, color: 'text-error-600', bg: 'bg-error-50' },
    { label: 'Away Time', value: formatClock(report.awaySeconds), icon: EyeOff, color: 'text-warning-600', bg: 'bg-warning-50' },
    { label: 'Phone Distraction', value: formatClock(report.phoneDistractionSeconds), icon: Smartphone, color: 'text-error-600', bg: 'bg-error-50' },
    { label: 'Uncertain', value: formatClock(report.uncertainSeconds), icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-100' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative card w-full max-w-lg p-6 sm:p-8 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-accent-50 flex items-center justify-center">
            <BarChart3 size={22} className="text-accent-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Session Report</h2>
            <p className="text-sm text-slate-500">Here's how your study session went</p>
          </div>
        </div>

        {/* Study mode badge */}
        <div className="mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-xl">{modeMeta.emoji}</span>
          <div className="flex items-center gap-1.5">
            <ModeIcon size={15} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">{modeMeta.label}</span>
          </div>
          <span className="text-xs text-slate-400 ml-auto">Study Mode</span>
        </div>

        {/* Focus percentage hero */}
        <div className={`mt-5 rounded-2xl p-6 text-center ${grade.bg}`}>
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600">
            <TrendingUp size={15} />
            Focus Percentage
          </div>
          <div className="mt-2 text-5xl sm:text-6xl font-extrabold tabular-nums text-slate-900">
            {formatPercentage(focusPct)}
          </div>
          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${grade.color} bg-white/70`}>
            <Award size={14} />
            {grade.label}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 p-4 text-center">
              <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center mx-auto`}>
                <s.icon size={17} className={s.color} />
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900 tabular-nums">{s.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Phone distraction count */}
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">
          <Smartphone size={15} className="text-error-500" />
          <span>
            <span className="font-semibold text-slate-800">{report.phoneDistractionCount}</span>
            {' '}{report.phoneDistractionCount === 1 ? 'phone distraction' : 'phone distractions'} detected
          </span>
        </div>

        {/* Formula explanation */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            <span className="font-semibold text-slate-700">Focus %</span> = Focused Time ÷ Total Study Time × 100
          </p>
        </div>

        {/* Goal progress */}
        {goal && goal.dailyTargetSeconds > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">
                {goal.subject} — Today's Goal
              </span>
              <span className="text-sm font-bold text-brand-700">
                {goalProgress ? Math.round(goalProgress.percentage) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  goalProgress?.isComplete ? 'bg-success-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, goalProgress ? goalProgress.percentage : 0)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {goalProgress && goalProgress.isComplete
                ? 'Daily goal complete! '
                : ''}
              {formatClock(goal.completedSeconds)} completed of {formatClock(goal.dailyTargetSeconds)} target
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button onClick={onNewSession} className="btn-primary flex-1 py-3">
            Start New Session
          </button>
          <button onClick={onClose} className="btn-ghost py-3 px-5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
