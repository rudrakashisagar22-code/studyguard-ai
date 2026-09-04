import { useMemo } from 'react';
import type { StoredSession, DateFilter, PersonalizedInsight, StudyGoal, StudyMode } from '@/types';
import { STUDY_MODE_LABELS } from '@/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MIN_SESSIONS_FOR_COMPARISON = 2;
const MIN_SESSIONS_FOR_MODE = 2;
const MIN_SESSIONS_FOR_PATTERN = 3;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d);
  const day = c.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  c.setDate(c.getDate() + diff);
  return c;
}

function startOfMonth(d: Date): Date {
  const c = startOfDay(d);
  c.setDate(1);
  return c;
}

function getPeriodBoundaries(filter: DateFilter, now: Date) {
  let currentStart: Date;
  let durationMs: number;

  if (filter === 'today') {
    currentStart = startOfDay(now);
    durationMs = 24 * 60 * 60 * 1000;
  } else if (filter === 'week') {
    currentStart = startOfWeek(now);
    durationMs = 7 * 24 * 60 * 60 * 1000;
  } else {
    currentStart = startOfMonth(now);
    // Previous month boundary: go to start of previous month
    const prevMonth = new Date(now);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevStart = startOfMonth(prevMonth);
    durationMs = currentStart.getTime() - prevStart.getTime();
  }

  const prevStart = new Date(currentStart.getTime() - durationMs);
  return { currentStart, prevStart, durationMs };
}

function avgFocus(sessions: StoredSession[]): number {
  if (sessions.length === 0) return 0;
  return sessions.reduce((sum, s) => sum + s.focusPercentage, 0) / sessions.length;
}

function formatHm(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function usePersonalizedInsights(
  sessions: StoredSession[],
  filter: DateFilter,
  goal: StudyGoal | null,
): PersonalizedInsight[] {
  return useMemo(() => {
    if (sessions.length === 0) {
      return [{
        id: 'no-data',
        title: 'Not enough data yet',
        statistic: '',
        explanation: 'Complete a few more study sessions to unlock personalized insights.',
        icon: 'sparkles',
      }];
    }

    const now = new Date();
    const { currentStart, prevStart, durationMs } = getPeriodBoundaries(filter, now);
    const currentCutoff = currentStart.getTime();
    const prevCutoff = prevStart.getTime();

    const currentSessions = sessions.filter((s) => s.endedAt >= currentCutoff);
    const previousSessions = sessions.filter(
      (s) => s.endedAt >= prevCutoff && s.endedAt < currentCutoff,
    );

    if (currentSessions.length === 0) {
      return [{
        id: 'no-current-data',
        title: 'Not enough data yet',
        statistic: '',
        explanation: 'Complete a few more study sessions to unlock personalized insights.',
        icon: 'sparkles',
      }];
    }

    const insights: PersonalizedInsight[] = [];

    // --- 1. FOCUS PERFORMANCE (week-over-week comparison) ---
    const currentAvgFocus = avgFocus(currentSessions);
    const prevAvgFocus = avgFocus(previousSessions);

    if (previousSessions.length >= MIN_SESSIONS_FOR_COMPARISON && currentSessions.length >= MIN_SESSIONS_FOR_COMPARISON) {
      const change = Math.round(currentAvgFocus - prevAvgFocus);
      if (change > 0) {
        insights.push({
          id: 'focus-performance',
          title: 'Focus Performance',
          statistic: `${Math.round(currentAvgFocus)}% this period`,
          explanation: `Your average focus improved by ${change}% compared with the previous ${filter === 'today' ? 'day' : filter === 'week' ? 'week' : 'month'}.`,
          recommendation: 'Keep up the momentum — your focus is trending in the right direction.',
          icon: 'trending-up',
        });
      } else if (change < 0) {
        insights.push({
          id: 'focus-performance',
          title: 'Focus Performance',
          statistic: `${Math.round(currentAvgFocus)}% this period`,
          explanation: `Your average focus decreased by ${Math.abs(change)}% compared with the previous ${filter === 'today' ? 'day' : filter === 'week' ? 'week' : 'month'}.`,
          recommendation: 'Try a shorter session or switch to your strongest study mode.',
          icon: 'trending-up',
        });
      } else {
        insights.push({
          id: 'focus-performance',
          title: 'Focus Performance',
          statistic: `${Math.round(currentAvgFocus)}% this period`,
          explanation: `Your average focus is stable compared with the previous ${filter === 'today' ? 'day' : filter === 'week' ? 'week' : 'month'}.`,
          icon: 'trending-up',
        });
      }
    } else {
      insights.push({
        id: 'focus-performance',
        title: 'Focus Performance',
        statistic: `${Math.round(currentAvgFocus)}% average focus`,
        explanation: 'Not enough data to compare with the previous period yet.',
        icon: 'trending-up',
      });
    }

    // --- 2. BEST STUDY MODE ---
    const modeGroups = new Map<StudyMode, StoredSession[]>();
    for (const s of currentSessions) {
      const arr = modeGroups.get(s.studyMode) ?? [];
      arr.push(s);
      modeGroups.set(s.studyMode, arr);
    }

    const modeAvgFocus: { mode: StudyMode; avgFocus: number; sessionCount: number }[] = [];
    for (const [mode, sess] of modeGroups) {
      if (sess.length >= MIN_SESSIONS_FOR_MODE) {
        modeAvgFocus.push({ mode, avgFocus: avgFocus(sess), sessionCount: sess.length });
      }
    }

    if (modeAvgFocus.length >= 2) {
      const best = [...modeAvgFocus].sort((a, b) => b.avgFocus - a.avgFocus)[0];
      insights.push({
        id: 'best-mode',
        title: 'Best Study Mode',
        statistic: `${Math.round(best.avgFocus)}% average focus`,
        explanation: `${STUDY_MODE_LABELS[best.mode]} Mode is currently your strongest mode with an average focus of ${Math.round(best.avgFocus)}% across ${best.sessionCount} ${best.sessionCount === 1 ? 'session' : 'sessions'}.`,
        recommendation: `Try ${STUDY_MODE_LABELS[best.mode]} Mode for your next session.`,
        icon: 'target',
      });
    }

    // --- 3. MOST PRODUCTIVE DAY ---
    const dayGroups = new Map<number, { focusedSeconds: number; sessionCount: number }>();
    for (const s of currentSessions) {
      const day = new Date(s.endedAt).getDay();
      const existing = dayGroups.get(day) ?? { focusedSeconds: 0, sessionCount: 0 };
      existing.focusedSeconds += s.focusedSeconds;
      existing.sessionCount += 1;
      dayGroups.set(day, existing);
    }

    if (dayGroups.size > 0) {
      let bestDay = -1;
      let bestFocused = 0;
      for (const [day, data] of dayGroups) {
        if (data.focusedSeconds > bestFocused) {
          bestFocused = data.focusedSeconds;
          bestDay = day;
        }
      }
      if (bestDay >= 0 && bestFocused > 0) {
        insights.push({
          id: 'productive-day',
          title: 'Most Productive Day',
          statistic: formatHm(bestFocused),
          explanation: `${DAY_NAMES[bestDay]} is your most productive study day with ${formatHm(bestFocused)} of focused study.`,
          icon: 'calendar',
        });
      }
    }

    // --- 4. PHONE DISTRACTION PATTERN ---
    const phoneByTimeOfDay = new Map<string, { seconds: number; count: number }>();
    let totalPhoneSeconds = 0;
    let totalPhoneCount = 0;
    for (const s of currentSessions) {
      if (s.phoneDistractionSeconds > 0) {
        const tod = getTimeOfDay(new Date(s.startedAt).getHours());
        const existing = phoneByTimeOfDay.get(tod) ?? { seconds: 0, count: 0 };
        existing.seconds += s.phoneDistractionSeconds;
        existing.count += s.phoneDistractionCount;
        phoneByTimeOfDay.set(tod, existing);
        totalPhoneSeconds += s.phoneDistractionSeconds;
        totalPhoneCount += s.phoneDistractionCount;
      }
    }

    if (currentSessions.length >= MIN_SESSIONS_FOR_PATTERN && phoneByTimeOfDay.size > 0) {
      const worst = [...phoneByTimeOfDay.entries()].sort((a, b) => b[1].seconds - a[1].seconds)[0];
      if (worst[1].seconds > 0) {
        insights.push({
          id: 'phone-pattern',
          title: 'Phone Distraction Pattern',
          statistic: formatHm(worst[1].seconds),
          explanation: `You had the most phone distraction time in ${worst[0]} sessions.`,
          recommendation: 'Keep your phone out of reach during your next session.',
          icon: 'smartphone',
        });
      }
    }

    // --- 5. AWAY PATTERN ---
    // Compare away time ratio in longer vs shorter sessions
    if (currentSessions.length >= MIN_SESSIONS_FOR_PATTERN) {
      const sortedByDuration = [...currentSessions].sort((a, b) => b.totalSeconds - a.totalSeconds);
      const halfIdx = Math.ceil(sortedByDuration.length / 2);
      const longerSessions = sortedByDuration.slice(0, halfIdx);
      const shorterSessions = sortedByDuration.slice(halfIdx);

      if (longerSessions.length > 0 && shorterSessions.length > 0) {
        const longerAwayRatio = longerSessions.reduce((sum, s) => sum + (s.totalSeconds > 0 ? s.awaySeconds / s.totalSeconds : 0), 0) / longerSessions.length;
        const shorterAwayRatio = shorterSessions.reduce((sum, s) => sum + (s.totalSeconds > 0 ? s.awaySeconds / s.totalSeconds : 0), 0) / shorterSessions.length;

        if (longerAwayRatio > shorterAwayRatio + 0.05) {
          insights.push({
            id: 'away-pattern',
            title: 'Away Pattern',
            statistic: `${Math.round(longerAwayRatio * 100)}% away in longer sessions`,
            explanation: 'You tend to spend more Away time during longer sessions.',
            recommendation: 'Consider a shorter session to reduce Away time.',
            icon: 'eye-off',
          });
        }
      }
    }

    // --- 6. SUBJECT PERFORMANCE ---
    const subjectGroups = new Map<string, StoredSession[]>();
    for (const s of currentSessions) {
      if (!s.subject) continue;
      const arr = subjectGroups.get(s.subject) ?? [];
      arr.push(s);
      subjectGroups.set(s.subject, arr);
    }

    const subjectStats: { subject: string; avgFocus: number; focusedSeconds: number; sessionCount: number }[] = [];
    for (const [subject, sess] of subjectGroups) {
      if (sess.length >= MIN_SESSIONS_FOR_MODE) {
        subjectStats.push({
          subject,
          avgFocus: avgFocus(sess),
          focusedSeconds: sess.reduce((sum, s) => sum + s.focusedSeconds, 0),
          sessionCount: sess.length,
        });
      }
    }

    if (subjectStats.length > 0) {
      const best = [...subjectStats].sort((a, b) => b.avgFocus - a.avgFocus)[0];
      insights.push({
        id: 'subject-performance',
        title: 'Subject Performance',
        statistic: `${Math.round(best.avgFocus)}% average focus`,
        explanation: `${best.subject} has your highest average focus at ${Math.round(best.avgFocus)}% across ${best.sessionCount} ${best.sessionCount === 1 ? 'session' : 'sessions'}.`,
        icon: 'book-text',
      });
    }

    // --- 7. STUDY GOAL PERFORMANCE ---
    if (goal && goal.dailyTargetSeconds > 0 && currentSessions.length > 0) {
      // Calculate total focused time per day in the current period, then average the daily completion ratio
      const dailyFocused = new Map<string, number>();
      for (const s of currentSessions) {
        const dayKey = new Date(s.endedAt).toISOString().slice(0, 10);
        dailyFocused.set(dayKey, (dailyFocused.get(dayKey) ?? 0) + s.focusedSeconds);
      }

      let totalCompletionRatio = 0;
      let daysWithSessions = 0;
      for (const focused of dailyFocused.values()) {
        totalCompletionRatio += Math.min(1, focused / goal.dailyTargetSeconds);
        daysWithSessions++;
      }

      if (daysWithSessions > 0) {
        const avgCompletion = Math.round((totalCompletionRatio / daysWithSessions) * 100);
        insights.push({
          id: 'goal-performance',
          title: 'Study Goal Performance',
          statistic: `${avgCompletion}% of daily goal`,
          explanation: `You achieved ${avgCompletion}% of your daily study goal on average across ${daysWithSessions} ${daysWithSessions === 1 ? 'day' : 'days'} with sessions this period.`,
          recommendation: avgCompletion < 100 ? 'Try a slightly longer session to reach your daily goal.' : 'Great work — you\'re consistently hitting your daily goal!',
          icon: 'flag',
        });
      }
    }

    // Limit to 4 most useful insights (no generic recommendation — that lives in the Next Action card)
    return insights.slice(0, 4);
  }, [sessions, filter, goal]);
}
