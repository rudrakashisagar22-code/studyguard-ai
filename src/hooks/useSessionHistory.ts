import { useCallback, useEffect, useState } from 'react';
import type { StoredSession, SessionReport, StudyGoal } from '@/types';

const STORAGE_KEY = 'studyguard_sessions';
const MAX_SESSIONS = 500;

function readStorage(): StoredSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) => s && typeof s.id === 'string' && typeof s.endedAt === 'number',
    );
  } catch {
    return [];
  }
}

function writeStorage(sessions: StoredSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-MAX_SESSIONS)));
  } catch {
    /* localStorage may be unavailable */
  }
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<StoredSession[]>(() => readStorage());

  useEffect(() => {
    writeStorage(sessions);
  }, [sessions]);

  const saveSession = useCallback(
    (report: SessionReport, goal: StudyGoal | null) => {
      const session: StoredSession = {
        id: `${report.endedAt}-${Math.random().toString(36).slice(2, 9)}`,
        totalSeconds: report.totalSeconds,
        focusedSeconds: report.focusedSeconds,
        awaySeconds: report.awaySeconds,
        phoneDistractionSeconds: report.phoneDistractionSeconds,
        phoneDistractionCount: report.phoneDistractionCount,
        notStudyingSeconds: report.notStudyingSeconds,
        uncertainSeconds: report.uncertainSeconds,
        focusPercentage: report.focusPercentage,
        studyMode: report.studyMode,
        subject: goal?.subject || null,
        startedAt: report.startedAt,
        endedAt: report.endedAt,
      };
      setSessions((prev) => [...prev, session]);
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setSessions([]);
  }, []);

  return { sessions, saveSession, clearHistory };
}
