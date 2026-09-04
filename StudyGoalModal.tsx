import { useEffect, useState } from 'react';
import { Target, X, Trash2 } from 'lucide-react';
import type { StudyGoal } from '@/types';

interface StudyGoalModalProps {
  goal: StudyGoal | null;
  onSave: (subject: string, dailyTargetSeconds: number, examDate: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function StudyGoalModal({ goal, onSave, onDelete, onClose }: StudyGoalModalProps) {
  const [subject, setSubject] = useState(goal?.subject ?? '');
  const [hours, setHours] = useState(() => {
    if (!goal || goal.dailyTargetSeconds <= 0) return 2;
    return Math.floor(goal.dailyTargetSeconds / 3600);
  });
  const [minutes, setMinutes] = useState(() => {
    if (!goal || goal.dailyTargetSeconds <= 0) return 0;
    return Math.floor((goal.dailyTargetSeconds % 3600) / 60);
  });
  const [examDate, setExamDate] = useState(goal?.examDate ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSave = () => {
    if (!subject.trim()) {
      setError('Please enter a subject.');
      return;
    }
    const totalSeconds = hours * 3600 + minutes * 60;
    if (totalSeconds <= 0) {
      setError('Daily goal must be greater than zero.');
      return;
    }
    onSave(subject.trim(), totalSeconds, examDate || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-fast">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card w-full max-w-md p-6 sm:p-8 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-50 flex items-center justify-center">
            <Target size={22} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {goal ? 'Edit Study Goal' : 'Set Study Goal'}
            </h2>
            <p className="text-sm text-slate-500">Define your daily study target</p>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-5">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Python, Calculus, History"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-colors"
              maxLength={50}
            />
          </div>

          {/* Daily target */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Daily Target
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">Hours</div>
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-colors"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                    <option key={h} value={h}>{h}h</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">Minutes</div>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-colors"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m}m</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Exam date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Exam Date <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-error-600">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} className="btn-primary flex-1 py-3">
            Save Goal
          </button>
          {goal && (
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="btn-ghost py-3 px-4 text-error-600 hover:bg-error-50"
              aria-label="Delete goal"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button onClick={onClose} className="btn-ghost py-3 px-5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
