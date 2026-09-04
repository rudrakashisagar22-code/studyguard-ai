import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StudyGoal, GoalProgress } from '@/types';

const STORAGE_KEY = 'studyguard_goal';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readStorage(): StudyGoal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudyGoal;
    if (!parsed.subject || typeof parsed.dailyTargetSeconds !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(goal: StudyGoal | null) {
  try {
    if (goal) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* localStorage may be unavailable in private browsing */
  }
}

function createEmptyGoal(): StudyGoal {
  return {
    subject: '',
    dailyTargetSeconds: 0,
    examDate: null,
    date: todayKey(),
    completedSeconds: 0,
  };
}

export function useStudyGoal() {
  const [goal, setGoal] = useState<StudyGoal | null>(() => {
    const stored = readStorage();
    if (!stored) return null;
    // If the stored goal is from a previous day, reset completed time but keep settings
    if (stored.date !== todayKey()) {
      return { ...stored, date: todayKey(), completedSeconds: 0 };
    }
    return stored;
  });

  // Persist to localStorage whenever goal changes
  useEffect(() => {
    writeStorage(goal);
  }, [goal]);

  const saveGoal = useCallback(
    (subject: string, dailyTargetSeconds: number, examDate: string | null) => {
      setGoal((prev) => {
        const completedSeconds = prev && prev.date === todayKey() ? prev.completedSeconds : 0;
        return {
          subject: subject.trim(),
          dailyTargetSeconds: Math.max(0, Math.floor(dailyTargetSeconds)),
          examDate: examDate || null,
          date: todayKey(),
          completedSeconds,
        };
      });
    },
    [],
  );

  const addFocusedSeconds = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setGoal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        completedSeconds: prev.completedSeconds + Math.floor(seconds),
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setGoal((prev) => (prev ? { ...prev, completedSeconds: 0 } : prev));
  }, []);

  const deleteGoal = useCallback(() => {
    setGoal(null);
  }, []);

  const progress: GoalProgress | null = useMemo(() => {
    if (!goal || goal.dailyTargetSeconds <= 0) return null;
    const completed = goal.completedSeconds;
    const target = goal.dailyTargetSeconds;
    const remaining = Math.max(0, target - completed);
    const percentage = target > 0 ? Math.min(100, (completed / target) * 100) : 0;
    return {
      completedSeconds: completed,
      remainingSeconds: remaining,
      percentage,
      isComplete: completed >= target,
    };
  }, [goal]);

  return {
    goal,
    progress,
    saveGoal,
    addFocusedSeconds,
    resetProgress,
    deleteGoal,
  };
}
