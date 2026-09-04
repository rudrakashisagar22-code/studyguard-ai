import { useEffect, useRef, useState } from 'react';
import type { SessionStatus, PresenceState, StudyMode } from '@/types';
import { STUDY_MODE_LABELS } from '@/types';

export type CoachMessageType = 'start' | 'phone' | 'away' | 'return' | 'milestone' | 'end';

export interface CoachMessage {
  id: number;
  text: string;
  type: CoachMessageType;
}

interface UseStudyCoachOptions {
  status: SessionStatus;
  presence: PresenceState;
  focusedSeconds: number;
  phoneDistractionCount: number;
  totalSeconds: number;
  focusPercentage: number;
  studyMode: StudyMode;
}

const FOCUS_MILESTONE_SECONDS = 25 * 60;

export function useStudyCoach(options: UseStudyCoachOptions) {
  const {
    status,
    presence,
    focusedSeconds,
    phoneDistractionCount,
    totalSeconds,
    focusPercentage,
    studyMode,
  } = options;

  const [message, setMessage] = useState<CoachMessage | null>(null);

  const prevStatusRef = useRef<SessionStatus>('idle');
  const prevPresenceRef = useRef<PresenceState>('unknown');
  const prevPhoneCountRef = useRef(0);
  const milestoneReachedRef = useRef(false);
  const wasAwayRef = useRef(false);
  const focusStreakStartRef = useRef<number | null>(null);
  const messageIdRef = useRef(0);

  // Keep latest stats in a ref so the status-only effect can read them
  const statsRef = useRef({ totalSeconds, focusPercentage, phoneDistractionCount, studyMode });
  statsRef.current = { totalSeconds, focusPercentage, phoneDistractionCount, studyMode };

  const showMessage = (text: string, type: CoachMessageType) => {
    messageIdRef.current += 1;
    setMessage({ id: messageIdRef.current, text, type });
  };

  const dismiss = () => setMessage(null);

  // --- Session start / session end ---
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (status === 'running' && (prev === 'idle' || prev === 'stopped')) {
      // New session — reset all coaching state
      milestoneReachedRef.current = false;
      focusStreakStartRef.current = null;
      wasAwayRef.current = false;
      prevPhoneCountRef.current = 0;
      showMessage("Ready? Let's make this a focused session.", 'start');
    }

    if (status === 'stopped' && prev === 'running') {
      const s = statsRef.current;
      const modeLabel = STUDY_MODE_LABELS[s.studyMode];
      const totalMin = Math.round(s.totalSeconds / 60);
      const focusPct = Math.round(s.focusPercentage);
      const phoneCount = s.phoneDistractionCount;

      let summary = `You completed a ${totalMin}-minute ${modeLabel} session with ${focusPct}% focused time`;
      if (phoneCount > 0) {
        summary += ` and ${phoneCount} phone ${phoneCount === 1 ? 'distraction' : 'distractions'}`;
      }
      summary += '.';
      showMessage(summary, 'end');
    }
  }, [status]);

  // --- Phone distraction (new event) ---
  useEffect(() => {
    if (phoneDistractionCount > prevPhoneCountRef.current) {
      showMessage(
        'Your phone is distracting you. Put it aside and get back to your session.',
        'phone',
      );
    }
    prevPhoneCountRef.current = phoneDistractionCount;
  }, [phoneDistractionCount]);

  // --- Away / Return from away / Focus streak tracking ---
  useEffect(() => {
    const prev = prevPresenceRef.current;
    prevPresenceRef.current = presence;

    // Away threshold reached
    if (presence === 'away' && prev !== 'away') {
      wasAwayRef.current = true;
      showMessage(
        "You've been away for 20 seconds. Ready to get back to your session?",
        'away',
      );
    }

    // Return from away
    if (prev === 'away' && presence !== 'away' && wasAwayRef.current) {
      wasAwayRef.current = false;
      showMessage('Welcome back. Let\'s continue.', 'return');
    }

    // Focus streak: start when entering focused, reset when leaving
    if (presence === 'focused' && prev !== 'focused') {
      focusStreakStartRef.current = focusedSeconds;
    }
    if (presence !== 'focused') {
      focusStreakStartRef.current = null;
    }
  }, [presence, focusedSeconds]);

  // --- Focus milestone (25 continuous focused minutes) ---
  useEffect(() => {
    if (
      !milestoneReachedRef.current &&
      focusStreakStartRef.current !== null &&
      focusedSeconds - focusStreakStartRef.current >= FOCUS_MILESTONE_SECONDS
    ) {
      milestoneReachedRef.current = true;
      showMessage(
        'Great work! You\'ve maintained your focus for 25 minutes.',
        'milestone',
      );
    }
  }, [focusedSeconds]);

  return { message, dismiss };
}
