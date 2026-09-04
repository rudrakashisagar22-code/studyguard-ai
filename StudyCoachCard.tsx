import { GraduationCap, X, Sparkles, AlertCircle, Footprints, BookOpen, Trophy, Volume2, VolumeX, Volume1 } from 'lucide-react';
import type { CoachMessage } from '@/hooks/useStudyCoach';
import { useSpeech } from '@/hooks/useSpeech';

interface StudyCoachCardProps {
  message: CoachMessage | null;
  onDismiss: () => void;
}

const TYPE_CONFIG: Record<
  CoachMessage['type'],
  { icon: typeof GraduationCap; color: string; bg: string }
> = {
  start: { icon: Sparkles, color: 'text-brand-600', bg: 'bg-brand-50' },
  phone: { icon: AlertCircle, color: 'text-error-600', bg: 'bg-error-50' },
  away: { icon: Footprints, color: 'text-warning-600', bg: 'bg-warning-50' },
  return: { icon: BookOpen, color: 'text-success-600', bg: 'bg-success-50' },
  milestone: { icon: Trophy, color: 'text-accent-600', bg: 'bg-accent-50' },
  end: { icon: GraduationCap, color: 'text-brand-600', bg: 'bg-brand-50' },
};

export function StudyCoachCard({ message, onDismiss }: StudyCoachCardProps) {
  const config = message ? TYPE_CONFIG[message.type] : TYPE_CONFIG.start;
  const Icon = config.icon;

  const speech = useSpeech({ message });

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${config.bg}`}>
            <GraduationCap size={20} className="text-brand-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Study Coach</h3>
            <p className="text-xs text-slate-500">
              {message ? 'Tips based on your session' : 'Start a session for guidance'}
            </p>
          </div>
        </div>

        {/* Voice controls */}
        <div className="flex items-center gap-1.5">
          {speech.supported ? (
            <>
              {/* Volume slider */}
              {speech.voiceEnabled && (
                <div className="flex items-center gap-1.5 mr-0.5">
                  <Volume1 size={14} className="text-slate-400" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={speech.volume}
                    onChange={(e) => speech.setVolume(Number(e.target.value))}
                    className="w-14 h-1.5 accent-brand-500 cursor-pointer"
                    aria-label="Voice volume"
                  />
                </div>
              )}
              {/* Voice toggle */}
              <button
                onClick={speech.toggleVoice}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                  speech.voiceEnabled
                    ? 'text-brand-600 hover:bg-brand-50'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
                aria-label={speech.voiceEnabled ? 'Turn voice off' : 'Turn voice on'}
                title={speech.voiceEnabled ? 'Voice on' : 'Voice off'}
              >
                {speech.voiceEnabled ? (
                  <Volume2 size={15} className={speech.isSpeaking ? 'animate-pulse' : ''} />
                ) : (
                  <VolumeX size={15} />
                )}
              </button>
            </>
          ) : (
            <span className="text-[11px] text-slate-400 max-w-[120px] text-right leading-tight">
              Voice is not supported in this browser.
            </span>
          )}
        </div>
      </div>

      {/* Message area */}
      <div className="mt-4 min-h-[56px] flex items-center">
        {message ? (
          <div className="flex items-start gap-3 w-full animate-fade-in">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
              <Icon size={15} className={config.color} />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed flex-1">
              {message.text}
            </p>
            <button
              onClick={onDismiss}
              className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 leading-relaxed">
            Your coach will appear here with tips and encouragement during your study session.
          </p>
        )}
      </div>
    </div>
  );
}
