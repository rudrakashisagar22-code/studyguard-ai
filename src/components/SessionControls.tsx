import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import type { SessionStatus } from '@/types';

interface SessionControlsProps {
  status: SessionStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function SessionControls({ status, onStart, onPause, onStop, onReset }: SessionControlsProps) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle' || status === 'stopped';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {(isIdle) && (
        <button onClick={onStart} className="btn-success px-5 py-3 group">
          <Play size={18} className="fill-current" />
          Start Session
        </button>
      )}
      {isRunning && (
        <button onClick={onPause} className="btn-warning px-5 py-3">
          <Pause size={18} className="fill-current" />
          Pause Session
        </button>
      )}
      {isPaused && (
        <button onClick={onStart} className="btn-success px-5 py-3">
          <Play size={18} className="fill-current" />
          Resume Session
        </button>
      )}
      {(isRunning || isPaused) && (
        <button onClick={onStop} className="btn-danger px-5 py-3">
          <Square size={18} className="fill-current" />
          Stop Session
        </button>
      )}
      {status === 'stopped' && (
        <button onClick={onReset} className="btn-ghost px-5 py-3">
          <RotateCcw size={18} />
          New Session
        </button>
      )}
    </div>
  );
}
