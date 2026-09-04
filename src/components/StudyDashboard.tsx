import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TimerCard } from '@/components/TimerCard';
import { StatsGrid } from '@/components/StatsGrid';
import { SessionControls } from '@/components/SessionControls';
import { CameraPreview } from '@/components/CameraPreview';
import { SessionReportModal } from '@/components/SessionReportModal';
import { StudyCoachCard } from '@/components/StudyCoachCard';
import { StudyGoalCard } from '@/components/StudyGoalCard';
import { StudyGoalModal } from '@/components/StudyGoalModal';
import { useStudySession } from '@/hooks/useStudySession';
import { useStudyCoach } from '@/hooks/useStudyCoach';
import { useStudyGoal } from '@/hooks/useStudyGoal';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useCamera } from '@/hooks/useCamera';
import { usePresenceDetection } from '@/hooks/usePresenceDetection';
import type { SessionReport, PresenceState, StudyMode } from '@/types';
import { STUDY_MODE_LABELS } from '@/types';

interface StudyDashboardProps {
  studyMode: StudyMode;
  onBack: () => void;
}

const MODE_EMOJI: Record<StudyMode, string> = {
  desk: '💻',
  reading: '📖',
  active: '🚶',
  lecture: '🎧',
};

export function StudyDashboard({ studyMode, onBack }: StudyDashboardProps) {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastReportRef = useRef<SessionReport | null>(null);

  const goalManager = useStudyGoal();
  const history = useSessionHistory();

  const session = useStudySession({
    studyMode,
    onReport: (r) => {
      setReport(r);
      setShowReport(true);
      // Add focused seconds to today's goal progress and save to history (only once per report)
      if (lastReportRef.current !== r) {
        lastReportRef.current = r;
        if (r.focusedSeconds > 0) {
          goalManager.addFocusedSeconds(r.focusedSeconds);
        }
        history.saveSession(r, goalManager.goal);
      }
    },
  });

  // Camera is enabled as soon as the dashboard loads so the user can set up framing
  const camera = useCamera({ enabled: true });

  const handlePresenceChange = useCallback(
    (p: PresenceState) => {
      session.setPresence(p);
    },
    [session],
  );

  const handlePhoneDistraction = useCallback(() => {
    session.registerPhoneDistraction();
  }, [session]);

  const detection = usePresenceDetection({
    videoRef,
    enabled: !!camera.stream && session.status === 'running',
    studyMode,
    intervalMs: 1500,
    onPresenceChange: handlePresenceChange,
    onPhoneDistraction: handlePhoneDistraction,
  });

  const presence: PresenceState =
    session.status === 'running'
      ? detection.error
        ? 'unknown'
        : detection.presence
      : session.presence;

  const handleStart = () => {
    session.start();
    if (!camera.stream) {
      camera.requestCamera();
    }
  };

  const handleStop = () => {
    session.stop();
  };

  const handleReset = () => {
    session.reset();
    setReport(null);
    setShowReport(false);
  };

  const handleCloseReport = () => {
    setShowReport(false);
  };

  const handleNewSessionFromReport = () => {
    session.reset();
    setReport(null);
    setShowReport(false);
  };

  const handleResetGoalProgress = () => {
    goalManager.resetProgress();
  };

  const coach = useStudyCoach({
    status: session.status,
    presence,
    focusedSeconds: session.focusedSeconds,
    phoneDistractionCount: session.phoneDistractionCount,
    totalSeconds: session.totalSeconds,
    focusPercentage: session.focusPercentage,
    studyMode,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="btn-ghost px-3 py-2 text-sm"
              aria-label="Back to study mode selection"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="hidden sm:block">
              <Logo size="sm" />
            </div>
            {/* Study mode badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100">
              <span className="text-base">{MODE_EMOJI[studyMode]}</span>
              <span className="text-xs font-semibold text-brand-700">{STUDY_MODE_LABELS[studyMode]} Mode</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <ShieldCheck size={15} className="text-success-600" />
            <span className="hidden sm:inline">Private — footage never leaves your browser</span>
            <span className="sm:hidden">Private</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Timer + Stats + Controls */}
          <div className="lg:col-span-3 space-y-6">
            <TimerCard
              totalSeconds={session.totalSeconds}
              status={session.status}
              presence={presence}
            />

            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Session Controls</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {session.status === 'idle' && 'Start a session to begin tracking your focus.'}
                    {session.status === 'running' && 'Session is running. Stay focused!'}
                    {session.status === 'paused' && 'Session is paused. Resume when ready.'}
                    {session.status === 'stopped' && 'Session ended. Start a new one anytime.'}
                  </p>
                </div>
                <SessionControls
                  status={session.status}
                  onStart={handleStart}
                  onPause={session.pause}
                  onStop={handleStop}
                  onReset={handleReset}
                />
              </div>
            </div>

            <StatsGrid
              totalSeconds={session.totalSeconds}
              focusedSeconds={session.focusedSeconds}
              awaySeconds={session.awaySeconds}
              phoneDistractionSeconds={session.phoneDistractionSeconds}
              phoneDistractionCount={session.phoneDistractionCount}
              notStudyingSeconds={session.notStudyingSeconds}
              uncertainSeconds={session.uncertainSeconds}
              focusPercentage={session.focusPercentage}
            />

            {/* Study Coach */}
            <StudyCoachCard message={coach.message} onDismiss={coach.dismiss} />

            {/* Info note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-50 border border-brand-100">
              <Info size={18} className="text-brand-600 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">How it works:</span> You're studying in{' '}
                <span className="font-medium text-brand-700">{STUDY_MODE_LABELS[studyMode]} Mode</span>.
                StudyGuard checks your camera every couple of seconds and counts time as{' '}
                <span className="font-medium text-success-700">Focused</span> when you're present without a phone,
                <span className="font-medium text-error-700">Phone Distraction</span> when a phone is visible for more than 3 seconds,
                and <span className="font-medium text-warning-700">Away</span> when you're absent for more than 20 seconds.
                {studyMode === 'desk' && ' No specific head angle or posture is required — just stay at your desk.'}
                {studyMode === 'reading' && ' Looking down at books or notes is never penalized — reading positions are expected.'}
                {studyMode === 'active' && ' Movement while studying is never penalized — face detection is skipped to avoid false negatives on a moving subject.'}
                {studyMode === 'lecture' && ' Normal head movement while watching or listening is never penalized.'}
                {' '}Detection is approximate — it's a helpful nudge, not a perfect measurement.
              </p>
            </div>
          </div>

          {/* Right: Camera + Goal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <CameraPreview
                videoRef={videoRef}
                stream={camera.stream}
                requesting={camera.requesting}
                error={camera.error}
                hasPermission={camera.hasPermission}
                onRequest={camera.requestCamera}
                presence={presence}
                detection={detection.lastResult}
                detecting={detection.detecting}
                modelLoaded={detection.modelLoaded}
                loadingModel={detection.loadingModel}
                detectionError={detection.error}
                sessionActive={session.status === 'running'}
              />
              <StudyGoalCard
                goal={goalManager.goal}
                progress={goalManager.progress}
                onEdit={() => setShowGoalModal(true)}
                onResetProgress={handleResetGoalProgress}
              />
            </div>
          </div>
        </div>
      </main>

      <SessionReportModal
        report={showReport ? report : null}
        goal={goalManager.goal}
        goalProgress={goalManager.progress}
        onClose={handleCloseReport}
        onNewSession={handleNewSessionFromReport}
      />

      {showGoalModal && (
        <StudyGoalModal
          goal={goalManager.goal}
          onSave={goalManager.saveGoal}
          onDelete={goalManager.deleteGoal}
          onClose={() => setShowGoalModal(false)}
        />
      )}
    </div>
  );
}
