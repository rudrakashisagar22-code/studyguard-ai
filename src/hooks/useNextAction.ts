import { useMemo } from 'react';
import type { StoredSession, DateFilter, StudyGoal, NextAction, StudyMode } from '@/types';
import { STUDY_MODE_LABELS } from '@/types';

const MIN_SESSIONS_FOR_COMPARISON = 2;
const MIN_SESSIONS_FOR_MODE = 2;
const MIN_SESSIONS_FOR_PATTERN = 3;
const MIN_SESSIONS_FOR_TIME_OF_DAY = 3;

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
    const prevMonth = new Date(now);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevStart = startOfMonth(prevMonth);
    durationMs = currentStart.getTime() - prevStart.getTime();
  }

  const prevStart = new Date(currentStart.getTime() - durationMs);
  return { currentStart, prevStart };
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

export function useNextAction(
  sessions: StoredSession[],
  filter: DateFilter,
  goal: StudyGoal | null,
): NextAction | null {
  return useMemo(() => {
    if (sessions.length === 0) return null;

    const now = new Date();
    const { currentStart, prevStart } = getPeriodBoundaries(filter, now);
    const currentCutoff = currentStart.getTime();
    const prevCutoff = prevStart.getTime();

    const currentSessions = sessions.filter((s) => s.endedAt >= currentCutoff);
    if (currentSessions.length === 0) return null;

    const previousSessions = sessions.filter(
      (s) => s.endedAt >= prevCutoff && s.endedAt < currentCutoff,
    );

    // --- Candidate 1: Best study mode ---
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
      const modeLabel = STUDY_MODE_LABELS[best.mode];
      return {
        title: `Try ${modeLabel} Mode`,
        statistic: `${Math.round(best.avgFocus)}% average focus`,
        action: `Your ${modeLabel} sessions have been your strongest. Try another ${modeLabel} session next.`,
        reason: 'best-mode',
      };
    }

    // --- Candidate 2: Phone distraction pattern ---
    const phoneByTimeOfDay = new Map<string, { seconds: number; count: number; sessionCount: number }>();
    for (const s of currentSessions) {
      if (s.phoneDistractionSeconds > 0) {
        const tod = getTimeOfDay(new Date(s.startedAt).getHours());
        const existing = phoneByTimeOfDay.get(tod) ?? { seconds: 0, count: 0, sessionCount: 0 };
        existing.seconds += s.phoneDistractionSeconds;
        existing.count += s.phoneDistractionCount;
        existing.sessionCount += 1;
        phoneByTimeOfDay.set(tod, existing);
      }
    }

    if (currentSessions.length >= MIN_SESSIONS_FOR_PATTERN && phoneByTimeOfDay.size > 0) {
      const worst = [...phoneByTimeOfDay.entries()].sort((a, b) => b[1].seconds - a[1].seconds)[0];
      if (worst[1].seconds > 0) {
        return {
          title: 'Keep your phone out of reach',
          statistic: formatHm(worst[1].seconds),
          action: `You had the most phone distraction during ${worst[0]} sessions. Keep your phone out of reach during your next session.`,
          reason: 'phone-pattern',
        };
      }
    }

    // --- Candidate 3: Away-time pattern ---
    if (currentSessions.length >= MIN_SESSIONS_FOR_PATTERN) {
      const sortedByDuration = [...currentSessions].sort((a, b) => b.totalSeconds - a.totalSeconds);
      const halfIdx = Math.ceil(sortedByDuration.length / 2);
      const longerSessions = sortedByDuration.slice(0, halfIdx);
      const shorterSessions = sortedByDuration.slice(halfIdx);

      if (longerSessions.length > 0 && shorterSessions.length > 0) {
        const longerAwayRatio =
          longerSessions.reduce((sum, s) => sum + (s.totalSeconds > 0 ? s.awaySeconds / s.totalSeconds : 0), 0) /
          longerSessions.length;
        const shorterAwayRatio =
          shorterSessions.reduce((sum, s) => sum + (s.totalSeconds > 0 ? s.awaySeconds / s.totalSeconds : 0), 0) /
          shorterSessions.length;

        if (longerAwayRatio > shorterAwayRatio + 0.05) {
          return {
            title: 'Try a shorter session',
            statistic: `${Math.round(longerAwayRatio * 100)}% away in longer sessions`,
            action: 'You tend to spend more Away time during longer sessions. Try a shorter session to reduce Away time.',
            reason: 'away-pattern',
          };
        }
      }
    }

    // --- Candidate 4: Focus trend (improving or declining) ---
    if (
      previousSessions.length >= MIN_SESSIONS_FOR_COMPARISON &&
      currentSessions.length >= MIN_SESSIONS_FOR_COMPARISON
    ) {
      const currentAvg = avgFocus(currentSessions);
      const prevAvg = avgFocus(previousSessions);
      const change = Math.round(currentAvg - prevAvg);

      if (change > 0) {
        return {
          title: 'Keep your current routine',
          statistic: `+${change}% focus`,
          action: 'Your focus is improving. Keep the same study routine.',
          reason: 'focus-improving',
        };
      }

      if (change < 0) {
        return {
          title: 'Switch to your strongest mode',
          statistic: `${Math.round(currentAvg)}% focus`,
          action: `Your focus decreased by ${Math.abs(change)}% compared with the previous period. Try switching to your strongest study mode.`,
          reason: 'focus-declining',
        };
      }
    }

    // --- Candidate 5: Best time of day ---
    const todGroups = new Map<string, { focusedSeconds: number; sessionCount: number }>();
    for (const s of currentSessions) {
      const tod = getTimeOfDay(new Date(s.startedAt).getHours());
      const existing = todGroups.get(tod) ?? { focusedSeconds: 0, sessionCount: 0 };
      existing.focusedSeconds += s.focusedSeconds;
      existing.sessionCount += 1;
      todGroups.set(tod, existing);
    }

    if (currentSessions.length >= MIN_SESSIONS_FOR_TIME_OF_DAY && todGroups.size >= 2) {
      const best = [...todGroups.entries()].sort((a, b) => b[1].focusedSeconds - a[1].focusedSeconds)[0];
      if (best[1].focusedSeconds > 0 && best[1].sessionCount >= MIN_SESSIONS_FOR_MODE) {
        return {
          title: `Study in the ${best[0]}`,
          statistic: formatHm(best[1].focusedSeconds),
          action: `Your strongest study period appears to be in the ${best[0]}. Consider scheduling your next session then.`,
          reason: 'time-of-day',
        };
      }
    }

    // --- Candidate 6: Goal completion ---
    if (goal && goal.dailyTargetSeconds > 0 && currentSessions.length > 0) {
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
        if (avgCompletion < 100) {
          return {
            title: 'Extend your next session',
            statistic: `${avgCompletion}% of daily goal`,
            action: `You're reaching ${avgCompletion}% of your daily goal on average. Try a slightly longer session to close the gap.`,
            reason: 'goal-behind',
          };
        }
        return {
          title: 'Keep up the great work',
          statistic: `${avgCompletion}% of daily goal`,
          action: 'You\'re consistently hitting your daily goal. Maintain your current routine.',
          reason: 'goal-on-track',
        };
      }
    }

    // No strong enough signal found
    return null;
  }, [sessions, filter, goal]);
}
