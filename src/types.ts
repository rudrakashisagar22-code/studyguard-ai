export type SessionStatus = 'idle' | 'running' | 'paused' | 'stopped';

export type PresenceState =
  | 'focused'
  | 'not_studying'
  | 'away'
  | 'phone_distraction'
  | 'uncertain'
  | 'unknown';

export type StudyMode = 'desk' | 'reading' | 'active' | 'lecture';

export interface StudyModeInfo {
  id: StudyMode;
  name: string;
  emoji: string;
  description: string;
}

export const STUDY_MODES: StudyModeInfo[] = [
  {
    id: 'desk',
    name: 'Desk Mode',
    emoji: '💻',
    description: 'Laptop, computer, or desk-based studying',
  },
  {
    id: 'reading',
    name: 'Reading Mode',
    emoji: '📖',
    description: 'Books, textbooks, notes, or reading',
  },
  {
    id: 'active',
    name: 'Active Mode',
    emoji: '🚶',
    description: 'Walking, standing, or moving while revising',
  },
  {
    id: 'lecture',
    name: 'Lecture Mode',
    emoji: '🎧',
    description: 'Video lectures, audio lessons, or listening-based study',
  },
];

export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  desk: 'Desk',
  reading: 'Reading',
  active: 'Active',
  lecture: 'Lecture',
};

export interface SessionReport {
  totalSeconds: number;
  focusedSeconds: number;
  awaySeconds: number;
  phoneDistractionSeconds: number;
  phoneDistractionCount: number;
  notStudyingSeconds: number;
  uncertainSeconds: number;
  focusPercentage: number;
  studyMode: StudyMode;
  startedAt: number;
  endedAt: number;
}

export interface StudyGoal {
  subject: string;
  dailyTargetSeconds: number;
  examDate: string | null;
  date: string;
  completedSeconds: number;
}

export interface GoalProgress {
  completedSeconds: number;
  remainingSeconds: number;
  percentage: number;
  isComplete: boolean;
}

export interface StoredSession {
  id: string;
  totalSeconds: number;
  focusedSeconds: number;
  awaySeconds: number;
  phoneDistractionSeconds: number;
  phoneDistractionCount: number;
  notStudyingSeconds: number;
  uncertainSeconds: number;
  focusPercentage: number;
  studyMode: StudyMode;
  subject: string | null;
  startedAt: number;
  endedAt: number;
}

export type DateFilter = 'today' | 'week' | 'month';

export interface AnalyticsOverview {
  totalStudySeconds: number;
  totalFocusedSeconds: number;
  totalPhoneDistractionSeconds: number;
  totalAwaySeconds: number;
  averageFocusPercentage: number;
  sessionCount: number;
}

export interface DailyMetric {
  date: string;
  dayName: string;
  focusedSeconds: number;
  averageFocusPercentage: number;
  sessionCount: number;
}

export interface ModeMetric {
  mode: StudyMode;
  focusedSeconds: number;
  sessionCount: number;
}

export interface SubjectMetric {
  subject: string;
  focusedSeconds: number;
  sessionCount: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  dailyMetrics: DailyMetric[];
  modeMetrics: ModeMetric[];
  subjectMetrics: SubjectMetric[];
  insights: string[];
  hasData: boolean;
}

export interface PersonalizedInsight {
  id: string;
  title: string;
  statistic: string;
  explanation: string;
  recommendation?: string;
  icon: 'trending-up' | 'target' | 'calendar' | 'smartphone' | 'eye-off' | 'book-text' | 'flag' | 'sparkles';
}

export interface NextAction {
  title: string;
  statistic: string;
  action: string;
  reason: string;
}

export interface DetectionResult {
  personDetected: boolean;
  phoneDetected: boolean;
  faceDetected: boolean;
  headYaw: number;
  studyPosition: boolean;
  studyConfidence: number;
  confidence: number;
  inferenceMs: number;
}
