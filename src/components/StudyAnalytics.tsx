import { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  Smartphone,
  TrendingUp,
  Target,
  Lightbulb,
  Calendar,
  Monitor,
  BookOpen,
  Footprints,
  Headphones,
  BookText,
  Sparkles,
  Flag,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useStudyAnalytics } from '@/hooks/useStudyAnalytics';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { usePersonalizedInsights } from '@/hooks/usePersonalizedInsights';
import { useNextAction } from '@/hooks/useNextAction';
import type { DateFilter, StudyMode, StudyGoal, PersonalizedInsight } from '@/types';
import { STUDY_MODE_LABELS } from '@/types';
import { formatClock, formatPercentage } from '@/lib/format';

interface StudyAnalyticsProps {
  onBack: () => void;
}

const FILTERS: { id: DateFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

const MODE_META: Record<StudyMode, { emoji: string; icon: typeof Monitor; color: string; bg: string }> = {
  desk: { emoji: '💻', icon: Monitor, color: 'text-brand-600', bg: 'bg-brand-50' },
  reading: { emoji: '📖', icon: BookOpen, color: 'text-accent-600', bg: 'bg-accent-50' },
  active: { emoji: '🚶', icon: Footprints, color: 'text-success-600', bg: 'bg-success-50' },
  lecture: { emoji: '🎧', icon: Headphones, color: 'text-warning-600', bg: 'bg-warning-50' },
};

function formatHm(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

function readGoal(): StudyGoal | null {
  try {
    const raw = localStorage.getItem('studyguard_goal');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudyGoal;
    if (!parsed.subject || typeof parsed.dailyTargetSeconds !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

const INSIGHT_ICONS: Record<PersonalizedInsight['icon'], typeof TrendingUp> = {
  'trending-up': TrendingUp,
  'target': Target,
  'calendar': Calendar,
  'smartphone': Smartphone,
  'eye-off': EyeOff,
  'book-text': BookText,
  'flag': Flag,
  'sparkles': Sparkles,
};

const INSIGHT_COLORS: Record<PersonalizedInsight['icon'], string> = {
  'trending-up': 'text-brand-600 bg-brand-50',
  'target': 'text-accent-600 bg-accent-50',
  'calendar': 'text-brand-600 bg-brand-50',
  'smartphone': 'text-error-600 bg-error-50',
  'eye-off': 'text-warning-600 bg-warning-50',
  'book-text': 'text-accent-600 bg-accent-50',
  'flag': 'text-success-600 bg-success-50',
  'sparkles': 'text-brand-600 bg-brand-50',
};

export function StudyAnalytics({ onBack }: StudyAnalyticsProps) {
  const [filter, setFilter] = useState<DateFilter>('week');
  const { sessions } = useSessionHistory();
  const analytics = useStudyAnalytics(sessions, filter);
  const [goal] = useState<StudyGoal | null>(() => readGoal());
  const personalizedInsights = usePersonalizedInsights(sessions, filter, goal);
  const nextAction = useNextAction(sessions, filter, goal);

  const maxDailyFocused = Math.max(1, ...analytics.dailyMetrics.map((d) => d.focusedSeconds));
  const maxModeFocused = Math.max(1, ...analytics.modeMetrics.map((m) => m.focusedSeconds));
  const maxSubjectFocused = Math.max(1, ...analytics.subjectMetrics.map((s) => s.focusedSeconds));

  const overviewCards = [
    { label: 'Total Study Time', value: formatClock(analytics.overview.totalStudySeconds), icon: Clock, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Total Focused Time', value: formatClock(analytics.overview.totalFocusedSeconds), icon: Eye, color: 'text-success-600', bg: 'bg-success-50' },
    { label: 'Phone Distraction', value: formatClock(analytics.overview.totalPhoneDistractionSeconds), icon: Smartphone, color: 'text-error-600', bg: 'bg-error-50' },
    { label: 'Away Time', value: formatClock(analytics.overview.totalAwaySeconds), icon: EyeOff, color: 'text-warning-600', bg: 'bg-warning-50' },
    { label: 'Avg Focus', value: formatPercentage(analytics.overview.averageFocusPercentage), icon: TrendingUp, color: 'text-accent-600', bg: 'bg-accent-50' },
    { label: 'Sessions', value: String(analytics.overview.sessionCount), icon: Target, color: 'text-brand-600', bg: 'bg-brand-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="btn-ghost px-3 py-2 text-sm"
              aria-label="Back to home"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="hidden sm:block">
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100">
              <BarChart3 size={14} className="text-accent-600" />
              <span className="text-xs font-semibold text-accent-700">Analytics</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">All data stays in your browser</p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Title + Date filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Study Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Insights from your completed study sessions
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!analytics.hasData ? (
          /* Empty state */
          <div className="card p-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <BarChart3 size={28} className="text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Not enough data yet</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Complete a few study sessions to see your analytics here. Your session data is stored
              locally in your browser and never uploaded.
            </p>
            <button onClick={onBack} className="mt-6 btn-primary px-6 py-3 text-sm">
              Start Studying
            </button>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Overview
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {overviewCards.map((c) => (
                  <div key={c.label} className="card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">
                        {c.label}
                      </span>
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${c.bg}`}>
                        <c.icon size={14} className={c.color} />
                      </div>
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900 tabular-nums">
                      {c.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily study chart + Focus trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Study Chart */}
              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={18} className="text-brand-600" />
                  <h3 className="font-semibold text-slate-900">
                    {filter === 'month' ? 'Daily Study Time' : 'Daily Study Time'}
                  </h3>
                </div>
                <div className="flex items-end gap-1.5 sm:gap-2 h-40">
                  {analytics.dailyMetrics.map((d) => {
                    const heightPct = (d.focusedSeconds / maxDailyFocused) * 100;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-t-md bg-brand-400 hover:bg-brand-500 transition-colors min-h-[2px] relative"
                            style={{ height: `${Math.max(heightPct, d.focusedSeconds > 0 ? 4 : 0)}%` }}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {formatHm(d.focusedSeconds)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium leading-none">
                          {d.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Focus Trend */}
              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-accent-600" />
                  <h3 className="font-semibold text-slate-900">Focus Trend</h3>
                </div>
                <div className="flex items-end gap-1.5 sm:gap-2 h-40">
                  {analytics.dailyMetrics.map((d) => {
                    const heightPct = d.averageFocusPercentage;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className={`w-full rounded-t-md transition-colors min-h-[2px] relative ${
                              heightPct >= 75 ? 'bg-success-400 hover:bg-success-500'
                                : heightPct >= 50 ? 'bg-accent-400 hover:bg-accent-500'
                                : heightPct > 0 ? 'bg-warning-400 hover:bg-warning-500'
                                : 'bg-slate-100'
                            }`}
                            style={{ height: `${Math.max(heightPct, d.averageFocusPercentage > 0 ? 4 : 0)}%` }}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {Math.round(d.averageFocusPercentage)}%
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium leading-none">
                          {d.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mode Analysis + Subject Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mode Analysis */}
              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={18} className="text-brand-600" />
                  <h3 className="font-semibold text-slate-900">Mode Analysis</h3>
                </div>
                {analytics.modeMetrics.length === 0 ? (
                  <p className="text-sm text-slate-400">No mode data for this period.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.modeMetrics.map((m) => {
                      const meta = MODE_META[m.mode];
                      const ModeIcon = meta.icon;
                      const widthPct = (m.focusedSeconds / maxModeFocused) * 100;
                      return (
                        <div key={m.mode}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{meta.emoji}</span>
                              <ModeIcon size={14} className={meta.color} />
                              <span className="text-sm font-medium text-slate-700">
                                {STUDY_MODE_LABELS[m.mode]}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({m.sessionCount} {m.sessionCount === 1 ? 'session' : 'sessions'})
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatHm(m.focusedSeconds)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meta.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Subject Analysis */}
              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookText size={18} className="text-accent-600" />
                  <h3 className="font-semibold text-slate-900">Subject Analysis</h3>
                </div>
                {analytics.subjectMetrics.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No subject data yet. Set a study goal with a subject to track per-subject time.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.subjectMetrics.map((s) => {
                      const widthPct = (s.focusedSeconds / maxSubjectFocused) * 100;
                      return (
                        <div key={s.subject}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">{s.subject}</span>
                              <span className="text-xs text-slate-400">
                                ({s.sessionCount} {s.sessionCount === 1 ? 'session' : 'sessions'})
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatHm(s.focusedSeconds)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent-400"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Insights */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-warning-500" />
                <h3 className="font-semibold text-slate-900">Insights</h3>
              </div>
              <div className="space-y-2.5">
                {analytics.insights.map((insight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What should I do next? */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                What should I do next?
              </h2>
              {nextAction ? (
                <div className="card p-5 sm:p-6 bg-gradient-to-br from-brand-50 to-white border-brand-100">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0">
                      <Sparkles size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900">{nextAction.title}</h3>
                      <p className="mt-1 text-2xl font-bold text-brand-600 tabular-nums">
                        {nextAction.statistic}
                      </p>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {nextAction.action}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Sparkles size={22} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900">Complete a few more sessions</h3>
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                        Complete a few more sessions to unlock a personalized recommendation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Personalized Insights */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Personalized Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalizedInsights.map((insight) => {
                  const InsightIcon = INSIGHT_ICONS[insight.icon];
                  const colorBg = INSIGHT_COLORS[insight.icon];
                  return (
                    <div key={insight.id} className="card p-5">
                      <div className="flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${colorBg}`}>
                          <InsightIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900">{insight.title}</h4>
                          {insight.statistic && (
                            <p className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
                              {insight.statistic}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                            {insight.explanation}
                          </p>
                          {insight.recommendation && (
                            <div className="mt-2.5 flex items-start gap-1.5 p-2.5 rounded-lg bg-brand-50 border border-brand-100">
                              <Sparkles size={13} className="text-brand-600 mt-0.5 shrink-0" />
                              <p className="text-xs text-brand-700 font-medium leading-relaxed">
                                {insight.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
