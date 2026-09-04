import { useEffect } from 'react';
import { Camera, Loader2, ShieldCheck, AlertCircle, Eye, EyeOff, Smartphone, BookOpen, BookX, HelpCircle, ScanLine } from 'lucide-react';
import type { DetectionResult, PresenceState } from '@/types';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  requesting: boolean;
  error: string | null;
  hasPermission: boolean | null;
  onRequest: () => void;
  presence: PresenceState;
  detection: DetectionResult | null;
  detecting: boolean;
  modelLoaded: boolean;
  loadingModel: boolean;
  detectionError: string | null;
  sessionActive: boolean;
}

export function CameraPreview({
  videoRef,
  stream,
  requesting,
  error,
  hasPermission,
  onRequest,
  presence,
  detection,
  detecting,
  modelLoaded,
  loadingModel,
  detectionError,
  sessionActive,
}: CameraPreviewProps) {
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      if (video.paused) {
        video.play().catch(() => {});
      }
    }
  }, [stream, videoRef]);

  const hasStream = !!stream;
  const showPermissionPrompt = !hasStream && !requesting && !error;
  const showFramingGuide = hasStream && !sessionActive;
  const presenceLabel =
    presence === 'focused' ? 'Focused'
    : presence === 'not_studying' ? 'Not Focused'
    : presence === 'away' ? 'Away'
    : presence === 'phone_distraction' ? 'Phone Distraction'
    : presence === 'uncertain' ? 'Uncertain'
    : detectionError ? 'Detection unavailable'
    : 'Detecting…';
  const presenceColor =
    presence === 'focused'
      ? 'bg-success-500'
      : presence === 'not_studying'
      ? 'bg-error-500'
      : presence === 'away'
      ? 'bg-warning-500'
      : presence === 'phone_distraction'
      ? 'bg-error-500'
      : presence === 'uncertain'
      ? 'bg-slate-400'
      : 'bg-slate-400';

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-brand-600" />
          <h3 className="font-semibold text-slate-900">Focus Monitor</h3>
        </div>
        {hasStream && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              {detecting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${presenceColor} ${sessionActive ? 'animate-pulse' : ''}`} />
              )}
              {presenceLabel}
            </span>
          </div>
        )}
      </div>

      {/* Video area */}
      <div className="relative aspect-video bg-slate-900">
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${hasStream ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />

        {/* Overlay: permission prompt */}
        {showPermissionPrompt && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-slate-900">
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Camera size={26} className="text-white" />
            </div>
            <p className="text-white font-medium">Enable your camera</p>
            <p className="text-sm text-slate-300 mt-1 max-w-xs">
              We use your camera to detect when you're at your desk. Footage never leaves your browser.
            </p>
            <button onClick={onRequest} className="mt-5 btn-primary px-5 py-2.5 text-sm">
              Allow Camera Access
            </button>
          </div>
        )}

        {/* Overlay: requesting */}
        {requesting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
            <Loader2 size={32} className="animate-spin text-white" />
            <p className="text-white text-sm mt-3">Requesting camera…</p>
          </div>
        )}

        {/* Overlay: error */}
        {error && !hasStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-slate-900">
            <div className="h-14 w-14 rounded-2xl bg-error-500/20 flex items-center justify-center mb-4">
              <AlertCircle size={26} className="text-error-400" />
            </div>
            <p className="text-white font-medium">Camera unavailable</p>
            <p className="text-sm text-slate-300 mt-1 max-w-xs">{error}</p>
            <button onClick={onRequest} className="mt-5 btn-ghost px-5 py-2.5 text-sm">
              Try Again
            </button>
          </div>
        )}

        {/* Overlay: framing guide (pre-session) */}
        {showFramingGuide && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute inset-8 sm:inset-12">
              <div className="absolute top-0 left-0 h-8 w-8 border-l-2 border-t-2 border-white/50 rounded-tl-lg" />
              <div className="absolute top-0 right-0 h-8 w-8 border-r-2 border-t-2 border-white/50 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-8 w-8 border-l-2 border-b-2 border-white/50 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-8 w-8 border-r-2 border-b-2 border-white/50 rounded-br-lg" />
            </div>
            <div className="relative flex flex-col items-center">
              <ScanLine size={28} className="text-white/80 mb-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Camera Setup</p>
              <p className="text-xs sm:text-sm text-slate-200/80 mt-1.5 max-w-xs leading-relaxed">
                Position yourself so you're visible in the frame. No specific posture is required — just make sure the camera can see you.
              </p>
            </div>
          </div>
        )}

        {/* Overlay: presence badge (live) */}
        {hasStream && sessionActive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 animate-fade-in">
            {presence === 'focused' ? (
              <BookOpen size={14} className="text-success-400" />
            ) : presence === 'not_studying' ? (
              <BookX size={14} className="text-error-400" />
            ) : presence === 'away' ? (
              <EyeOff size={14} className="text-warning-400" />
            ) : presence === 'phone_distraction' ? (
              <Smartphone size={14} className="text-error-400" />
            ) : presence === 'uncertain' ? (
              <HelpCircle size={14} className="text-slate-300" />
            ) : detectionError ? (
              <AlertCircle size={14} className="text-error-400" />
            ) : (
              <Loader2 size={14} className="text-slate-300 animate-spin" />
            )}
            <span className="text-xs font-semibold text-white">{presenceLabel}</span>
          </div>
        )}

        {/* Overlay: model loading */}
        {hasStream && loadingModel && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
            <Loader2 size={12} className="animate-spin text-white" />
            <span className="text-xs text-white">Loading detection models…</span>
          </div>
        )}

        {/* Overlay: detection error */}
        {hasStream && !loadingModel && detectionError && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-error-600/70 backdrop-blur-sm border border-white/10">
            <AlertCircle size={12} className="text-white" />
            <span className="text-xs text-white">Detection unavailable</span>
          </div>
        )}

        {/* Overlay: inference info */}
        {hasStream && modelLoaded && detection && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
            <span className="text-xs text-slate-300 tabular-nums">
              {detection.inferenceMs.toFixed(0)}ms
            </span>
          </div>
        )}
      </div>

      {/* Footer: privacy notice */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <ShieldCheck size={15} className="text-success-600 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Camera access is used only for real-time study monitoring. Camera footage is not stored.
          </p>
        </div>
      </div>
    </div>
  );
}
