import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCameraOptions {
  enabled: boolean;
}

interface CameraState {
  stream: MediaStream | null;
  error: string | null;
  requesting: boolean;
  hasPermission: boolean | null;
}

export function useCamera({ enabled }: UseCameraOptions): CameraState & {
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
} {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const requestCamera = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
      setHasPermission(true);
    } catch (e) {
      setHasPermission(false);
      if (e instanceof DOMException) {
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
          setError('Camera permission was denied. Please allow camera access in your browser to use focus monitoring.');
        } else if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
          setError('No camera device was found. Please connect a camera and try again.');
        } else if (e.name === 'NotReadableError') {
          setError('Your camera is in use by another application. Please close it and try again.');
        } else {
          setError(e.message || 'Could not access the camera.');
        }
      } else {
        setError('Could not access the camera.');
      }
    } finally {
      setRequesting(false);
    }
  }, [requesting]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled && streamRef.current) {
      stopCamera();
    }
  }, [enabled, stopCamera]);

  return { stream, error, requesting, hasPermission, requestCamera, stopCamera };
}
