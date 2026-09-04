import { useMemo } from 'react';
import type {
  StoredSession,
  DateFilter,
  AnalyticsData,
  AnalyticsOverview,
  DailyMetric,
  ModeMetric,
  SubjectMetric,
  StudyMode,
} from '@/types';
import { STUDY_MODE_LABELS } from '@/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d);
  const day = c.getDay();
  // Week starts Monday
  const diff = day === 0 ? -6 : 1 - day;
  c.setDate(c.getDate() + diff);
  return c;
}

function startOfMonth(d: Date): Date {
  const c = startOfDay(d);
  c.setDate(1);
  return c;
}

function filterSessions(sessions: StoredSession[], filter: DateFilter): StoredSession[] {
  const now = new Date();
  let boundary: Date;
  if (filter === 'today') {
    boundary = startOfDay(now);
  } else if (filter === 'week') {
    boundary = startOfWeek(now);
  } else {
    boundary = startOfMonth(now);
  }
  const cutoff = boundary.getTime();
  return sessions.filter((s) => s.endedAt >= cutoff);
}

function computeOverview(sessions: StoredSession[]): AnalyticsOverview {
  let totalStudySeconds = 0;
  let totalFocusedSeconds = 0;
  let totalPhoneDistractionSeconds = 0;
  let totalAwaySeconds = 0;
  let focusPctSum = 0;

  for (const s of sessions) {
    totalStudySeconds += s.totalSeconds;
    totalFocusedSeconds += s.focusedSeconds;
    totalPhoneDistractionSeconds += s.phoneDistractionSeconds;
    totalAwaySeconds += s.awaySeconds;
    focusPctSum += s.focusPercentage;
  }

  return {
    totalStudySeconds,
    totalFocusedSeconds,
    totalPhoneDistractionSeconds,
    totalAwaySeconds,
    averageFocusPercentage: sessions.length > 0 ? focusPctSum / sessions.length : 0,
    sessionCount: sessions.length,
  };
}

function computeDailyMetrics(sessions: StoredSession[], filter: DateFilter): DailyMetric[] {
  const now = new Date();

  if (filter === 'today') {
    // Show the last 7 days ending today for context
    const days: DailyMetric[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const daySessions = sessions.filter(
        (s) => s.endedAt >= d.getTime() && s.endedAt < next.getTime(),
      );
      days.push({
        date: d.toISOString().slice(0, 10),
        dayName: DAY_NAMES[d.getDay()].slice(0, 3),
        focusedSeconds: daySessions.reduce((sum, s) => sum + s.focusedSeconds, 0),
        averageFocusPercentage:
          daySessions.length > 0
            ? daySessions.reduce((sum, s) => sum + s.focusPercentage, 0) / daySessions.length
            : 0,
        sessionCount: daySessions.length,
      });
    }
    return days;
  }

  if (filter === 'week') {
    // Show Mon–Sun of current week
    const weekStart = startOfWeek(now);
    const days: DailyMetric[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const daySessions = sessions.filter(
        (s) => s.endedAt >= d.getTime() && s.endedAt < next.getTime(),
      );
      days.push({
        date: d.toISOString().slice(0, 10),
        dayName: DAY_NAMES[d.getDay()].slice(0, 3),
        focusedSeconds: daySessions.reduce((sum, s) => sum + s.focusedSeconds, 0),
        averageFocusPercentage:
          daySessions.length > 0
            ? daySessions.reduce((sum, s) => sum + s.focusPercentage, 0) / daySessions.length
            : 0,
        sessionCount: daySessions.length,
      });
    }
    return days;
  }

  // month: show each day of the current month
  const monthStart = startOfMonth(now);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days: DailyMetric[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(monthStart);
    d.setDate(d.getDate() + i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const daySessions = sessions.filter(
      (s) => s.endedAt >= d.getTime() && s.endedAt < next.getTime(),
    );
    days.push({
      date: d.toISOString().slice(0, 10),
      dayName: `${d.getDate()}`,
      focusedSeconds: daySessions.reduce((sum, s) => sum + s.focusedSeconds, 0),
      averageFocusPercentage:
        daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.focusPercentage, 0) / daySessions.length
          : 0,
      sessionCount: daySessions.length,
    });
  }
  return days;
}

function computeModeMetrics(sessions: StoredSession[]): ModeMetric[] {
  const modes: StudyMode[] = ['desk', 'reading', 'active', 'lecture'];
  return modes
    .map((mode) => {
      const modeSessions = sessions.filter((s) => s.studyMode === mode);
      return {
        mode,
        focusedSeconds: modeSessions.reduce((sum, s) => sum + s.focusedSeconds, 0),
        sessionCount: modeSessions.length,
      };
    })
    .filter((m) => m.sessionCount > 0);
}

function computeSubjectMetrics(sessions: StoredSession[]): SubjectMetric[] {
  const subjectMap = new Map<string, { focusedSeconds: number; sessionCount: number }>();
  for (const s of sessions) {
    if (!s.subject) continue;
    const existing = subjectMap.get(s.subject) ?? { focusedSeconds: 0, sessionCount: 0 };
    existing.focusedSeconds += s.focusedSeconds;
    existing.sessionCount += 1;
    subjectMap.set(s.subject, existing);
  }
  return Array.from(subjectMap.entries())
    .map(([subject, data]) => ({
      subject,
      focusedSeconds: data.focusedSeconds,
      sessionCount: data.sessionCount,
    }))
    .sort((a, b) => b.focusedSeconds - a.focusedSeconds);
}

function computeInsights(
  sessions: StoredSession[],
  overview: AnalyticsOverview,
  dailyMetrics: DailyMetric[],
  modeMetrics: ModeMetric[],
): string[] {
  const insights: string[] = [];

  if (sessions.length === 0) {
    return ['Not enough data yet.'];
  }

  // Average focus this week/period
  if (overview.averageFocusPercentage > 0) {
    insights.push(
      `Your average focus across ${overview.sessionCount} ${overview.sessionCount === 1 ? 'session' : 'sessions'} is ${Math.round(overview.averageFocusPercentage)}%.`,
    );
  }

  // Most productive mode
  if (modeMetrics.length > 0) {
    const top = [...modeMetrics].sort((a, b) => b.focusedSeconds - a.focusedSeconds)[0];
    if (top.focusedSeconds > 0) {
      insights.push(
        `${STUDY_MODE_LABELS[top.mode]} Mode has been your most productive mode with ${Math.round(top.focusedSeconds / 60)} minutes of focused time.`,
      );
    }
  }

  // Day with most phone distraction
  const dailyPhone = dailyMetrics
    .map((d) => ({
      dayName: d.dayName,
      phoneSeconds: sessions
        .filter((s) => {
          const sd = new Date(s.endedAt);
          const dd = new Date(d.date + 'T00:00:00');
          return (
            sd.toISOString().slice(0, 10) === d.date && s.phoneDistractionSeconds > 0
          );
        })
        .reduce((sum, s) => sum + s.phoneDistractionSeconds, 0),
    }))
    .filter((d) => d.phoneSeconds > 0);

  if (dailyPhone.length > 0) {
    const worst = [...dailyPhone].sort((a, b) => b.phoneSeconds - a.phoneSeconds)[0];
    insights.push(`You had the most phone distraction time on ${worst.dayName}.`);
  }

  // Sessions with no phone distraction
  const noPhoneSessions = sessions.filter((s) => s.phoneDistractionCount === 0).length;
  if (sessions.length > 0 && noPhoneSessions > 0) {
    const pct = Math.round((noPhoneSessions / sessions.length) * 100);
    insights.push(
      `You completed ${pct}% of your ${overview.sessionCount} ${overview.sessionCount === 1 ? 'session' : 'sessions'} with no phone distraction.`,
    );
  }

  return insights;
}

export function useStudyAnalytics(sessions: StoredSession[], filter: DateFilter): AnalyticsData {
  return useMemo(() => {
    const filtered = filterSessions(sessions, filter);
    const overview = computeOverview(filtered);
    const dailyMetrics = computeDailyMetrics(filtered, filter);
    const modeMetrics = computeModeMetrics(filtered);
    const subjectMetrics = computeSubjectMetrics(filtered);
    const insights = computeInsights(filtered, overview, dailyMetrics, modeMetrics);

    return {
      overview,
      dailyMetrics,
      modeMetrics,
      subjectMetrics,
      insights,
      hasData: filtered.length > 0,
    };
  }, [sessions, filter]);
}
