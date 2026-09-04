import { useCallback, useEffect, useRef, useState } from 'react';
import type { SessionReport, SessionStatus, PresenceState, StudyMode } from '@/types';

interface UseStudySessionOptions {
  studyMode: StudyMode;
  onReport?: (report: SessionReport) => void;
}

interface StudySessionState {
  status: SessionStatus;
  totalSeconds: number;
  focusedSeconds: number;
  awaySeconds: number;
  phoneDistractionSeconds: number;
  phoneDistractionCount: number;
  notStudyingSeconds: number;
  uncertainSeconds: number;
  startedAt: number | null;
  presence: PresenceState;
  studyMode: StudyMode;
}

const initial: StudySessionState = {
  status: 'idle',
  totalSeconds: 0,
  focusedSeconds: 0,
  awaySeconds: 0,
  phoneDistractionSeconds: 0,
  phoneDistractionCount: 0,
  notStudyingSeconds: 0,
  uncertainSeconds: 0,
  startedAt: null,
  presence: 'unknown',
  studyMode: 'desk',
};

export function useStudySession({ studyMode, onReport }: UseStudySessionOptions) {
  const [state, setState] = useState<StudySessionState>({ ...initial, studyMode });
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'running') return prev;
      const next = { ...prev, totalSeconds: prev.totalSeconds + 1 };
      if (prev.presence === 'focused') {
        next.focusedSeconds = prev.focusedSeconds + 1;
      } else if (prev.presence === 'away') {
        next.awaySeconds = prev.awaySeconds + 1;
      } else if (prev.presence === 'phone_distraction') {
        next.phoneDistractionSeconds = prev.phoneDistractionSeconds + 1;
      } else if (prev.presence === 'not_studying') {
        next.notStudyingSeconds = prev.notStudyingSeconds + 1;
      } else if (prev.presence === 'uncertain') {
        next.uncertainSeconds = prev.uncertainSeconds + 1;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(tick, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [tick]);

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'idle' || prev.status === 'stopped') {
        return { ...initial, studyMode: prev.studyMode, status: 'running', startedAt: Date.now(), presence: 'unknown' };
      }
      if (prev.status === 'paused') {
        return { ...prev, status: 'running' };
      }
      return prev;
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => (prev.status === 'running' ? { ...prev, status: 'paused' } : prev));
  }, []);

  const stop = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'idle') return prev;
      const endedAt = Date.now();
      const report: SessionReport = {
        totalSeconds: prev.totalSeconds,
        focusedSeconds: prev.focusedSeconds,
        awaySeconds: prev.awaySeconds,
        phoneDistractionSeconds: prev.phoneDistractionSeconds,
        phoneDistractionCount: prev.phoneDistractionCount,
        notStudyingSeconds: prev.notStudyingSeconds,
        uncertainSeconds: prev.uncertainSeconds,
        focusPercentage: prev.totalSeconds > 0
          ? (prev.focusedSeconds / prev.totalSeconds) * 100
          : 0,
        studyMode: prev.studyMode,
        startedAt: prev.startedAt ?? endedAt,
        endedAt,
      };
      onReportRef.current?.(report);
      return { ...prev, status: 'stopped' };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...initial, studyMode: prev.studyMode }));
  }, []);

  const setPresence = useCallback((presence: PresenceState) => {
    setState((prev) => {
      if (prev.status !== 'running') return { ...prev, presence };
      return { ...prev, presence };
    });
  }, []);

  const registerPhoneDistraction = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'running') return prev;
      return { ...prev, phoneDistractionCount: prev.phoneDistractionCount + 1 };
    });
  }, []);

  return {
    ...state,
    focusPercentage: state.totalSeconds > 0
      ? (state.focusedSeconds / state.totalSeconds) * 100
      : 0,
    start,
    pause,
    stop,
    reset,
    setPresence,
    registerPhoneDistraction,
  };
}
