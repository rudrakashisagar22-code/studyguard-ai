import { useCallback, useEffect, useRef, useState } from 'react';
import type { DetectionResult, PresenceState, StudyMode } from '@/types';

type ObjectDetectorType = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => {
    detections: Array<{
      categories: Array<{ score: number; categoryName: string }>;
    }>;
  };
  close: () => void;
};

type FaceLandmarkerType = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => {
    faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  };
  close: () => void;
};

const WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const OBJECT_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite';
const FACE_MODEL_URL =
  'https://storage.googleapis.com//mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const MODEL_LOAD_TIMEOUT_MS = 30_000;
const AWAY_THRESHOLD_MS = 20_000;
const PHONE_DISTRACTION_THRESHOLD_MS = 3_000;
const PHONE_ABSENCE_FRAMES = 2;

// Person-presence confirmation: need 2 consecutive frames to confirm presence
const PRESENCE_CONFIRM_FRAMES = 2;

// Per-mode monitoring configuration.
// All modes use presence + phone detection for the Focused decision.
// The differences are in which supplementary signals are collected.
interface ModeConfig {
  useFaceDetection: boolean;
  description: string;
}

const MODE_CONFIGS: Record<StudyMode, ModeConfig> = {
  desk: {
    useFaceDetection: true,
    description: 'Desk: presence + phone detection, face detection for supplementary info',
  },
  reading: {
    useFaceDetection: true,
    description: 'Reading: presence + phone detection, downward head never penalized',
  },
  active: {
    useFaceDetection: false,
    description: 'Active: presence + phone detection only, face detection skipped for moving subjects',
  },
  lecture: {
    useFaceDetection: true,
    description: 'Lecture: presence + phone detection, head movement never penalized',
  },
};

interface UsePresenceDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  studyMode: StudyMode;
  intervalMs?: number;
  onPresenceChange?: (presence: PresenceState) => void;
  onPhoneDistraction?: () => void;
}

interface PresenceDetectionState {
  modelLoaded: boolean;
  loadingModel: boolean;
  error: string | null;
  detecting: boolean;
  lastResult: DetectionResult | null;
  presence: PresenceState;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// Compute head yaw (left-right rotation) in degrees from MediaPipe face landmarks.
// Kept for supplementary face-detection evidence, NOT used as the Focused condition.
function computeHeadYaw(landmarks: Array<{ x: number; y: number; z: number }>): number {
  const nose = landmarks[1];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  if (!nose || !leftCheek || !rightCheek) return 0;

  const cheekMidX = (leftCheek.x + rightCheek.x) / 2;
  const dx = nose.x - cheekMidX;
  const cheekWidth = Math.abs(rightCheek.x - leftCheek.x);
  if (cheekWidth < 1e-6) return 0;

  const normalized = dx / cheekWidth;
  return normalized * 90;
}

export function usePresenceDetection({
  videoRef,
  enabled,
  studyMode,
  intervalMs = 1500,
  onPresenceChange,
  onPhoneDistraction,
}: UsePresenceDetectionOptions): PresenceDetectionState {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  const [presence, setPresence] = useState<PresenceState>('unknown');

  const modelRef = useRef<ObjectDetectorType | null>(null);
  const faceModelRef = useRef<FaceLandmarkerType | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPresenceChangeRef = useRef(onPresenceChange);
  onPresenceChangeRef.current = onPresenceChange;
  const onPhoneDistractionRef = useRef(onPhoneDistraction);
  onPhoneDistractionRef.current = onPhoneDistraction;
  const runningRef = useRef(false);
  const lastSeenRef = useRef<number | null>(null);
  const presenceRef = useRef<PresenceState>('unknown');
  const videoTimeRef = useRef(0);
  const faceVideoTimeRef = useRef(0);
  const studyModeRef = useRef(studyMode);
  studyModeRef.current = studyMode;

  // Phone tracking refs
  const phoneFirstSeenRef = useRef<number | null>(null);
  const phoneDistractionActiveRef = useRef(false);
  const phoneAbsenceCountRef = useRef(0);

  // Presence confirmation refs
  const presenceConfirmCountRef = useRef(0);

  const updatePresence = useCallback((p: PresenceState) => {
    if (presenceRef.current !== p) {
      presenceRef.current = p;
      setPresence(p);
      onPresenceChangeRef.current?.(p);
    }
  }, []);

  // Load models when enabled
  useEffect(() => {
    let cancelled = false;
    if (!enabled) return;

    setLoadingModel(true);
    setError(null);

    (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const { FilesetResolver, ObjectDetector, FaceLandmarker } = vision;

        console.log('[StudyGuard] Loading MediaPipe WASM runtime…');
        const fileset = await withTimeout(
          FilesetResolver.forVisionTasks(WASM_PATH),
          MODEL_LOAD_TIMEOUT_MS,
          'WASM runtime load',
        );

        // --- Object Detector (person + phone) ---
        const detectorOptions = {
          runningMode: 'VIDEO' as const,
          maxResults: 10,
          scoreThreshold: 0.4,
          categoryAllowlist: ['person', 'cell phone'],
        };

        let detector = null;
        try {
          console.log('[StudyGuard] Loading object detection model (EfficientDet-Lite0, GPU)…');
          detector = await withTimeout(
            ObjectDetector.createFromOptions(fileset, {
              ...detectorOptions,
              baseOptions: { modelAssetPath: OBJECT_MODEL_URL, delegate: 'GPU' },
            }),
            MODEL_LOAD_TIMEOUT_MS,
            'Object detector model load (GPU)',
          );
        } catch (gpuErr) {
          if (cancelled) return;
          console.warn('[StudyGuard] GPU delegate failed for object detector, retrying with CPU…', gpuErr);
          try {
            detector = await withTimeout(
              ObjectDetector.createFromOptions(fileset, {
                ...detectorOptions,
                baseOptions: { modelAssetPath: OBJECT_MODEL_URL, delegate: 'CPU' },
              }),
              MODEL_LOAD_TIMEOUT_MS,
              'Object detector model load (CPU)',
            );
            console.log('[StudyGuard] Object detector loaded with CPU fallback.');
          } catch (cpuErr) {
            throw cpuErr;
          }
        }

        // --- Face Landmarker (face detection — supplementary signal) ---
        let faceLandmarker = null;
        try {
          console.log('[StudyGuard] Loading face landmarker model (GPU)…');
          faceLandmarker = await withTimeout(
            FaceLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
              runningMode: 'VIDEO',
              numFaces: 1,
              outputFaceBlendshapes: false,
              outputFacialTransformationMatrixes: false,
            }),
            MODEL_LOAD_TIMEOUT_MS,
            'Face landmarker model load (GPU)',
          );
        } catch (gpuErr) {
          if (cancelled) return;
          console.warn('[StudyGuard] GPU delegate failed for face landmarker, retrying with CPU…', gpuErr);
          try {
            faceLandmarker = await withTimeout(
              FaceLandmarker.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'CPU' },
                runningMode: 'VIDEO',
                numFaces: 1,
                outputFaceBlendshapes: false,
                outputFacialTransformationMatrixes: false,
              }),
              MODEL_LOAD_TIMEOUT_MS,
              'Face landmarker model load (CPU)',
            );
            console.log('[StudyGuard] Face landmarker loaded with CPU fallback.');
          } catch (cpuErr) {
            console.warn('[StudyGuard] Face landmarker unavailable — face detection will be limited.', cpuErr);
          }
        }

        if (cancelled) {
          detector.close();
          if (faceLandmarker) faceLandmarker.close();
          return;
        }
        modelRef.current = detector as unknown as ObjectDetectorType;
        faceModelRef.current = faceLandmarker as unknown as FaceLandmarkerType | null;
        setModelLoaded(true);
        console.log('[StudyGuard] Models loaded successfully.');
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[StudyGuard] Model loading failed:', msg, e);
        setError(`Detection unavailable (${msg})`);
      } finally {
        if (!cancelled) setLoadingModel(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const model = modelRef.current;
    if (!video || !model) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;
    if (runningRef.current) return;

    runningRef.current = true;
    setDetecting(true);
    try {
      const start = performance.now();

      // --- Object detection (person + phone) ---
      videoTimeRef.current += 1;
      const result = model.detectForVideo(video, videoTimeRef.current);

      const detections = result.detections ?? [];
      let personDetected = false;
      let phoneDetected = false;
      let personConfidence = 0;
      let phoneConfidence = 0;

      for (const det of detections) {
        for (const cat of det.categories) {
          if (cat.categoryName === 'person' && cat.score > personConfidence) {
            personDetected = true;
            personConfidence = cat.score;
          }
          if (cat.categoryName === 'cell phone' && cat.score > phoneConfidence) {
            phoneDetected = true;
            phoneConfidence = cat.score;
          }
        }
      }

      // --- Face detection (supplementary — not used for Focused decision) ---
      // Only run face detection for modes that use it. Active Mode skips it
      // entirely since face detection on a moving subject is unreliable and
      // wastes compute. Other modes collect face data as supplementary info.
      const modeConfig = MODE_CONFIGS[studyModeRef.current];
      let faceDetected = false;
      let headYaw = 0;
      const faceModel = modeConfig.useFaceDetection ? faceModelRef.current : null;

      if (faceModel && personDetected) {
        faceVideoTimeRef.current += 1;
        try {
          const faceResult = faceModel.detectForVideo(video, faceVideoTimeRef.current);
          const faceLandmarks = faceResult.faceLandmarks ?? [];
          if (faceLandmarks.length > 0) {
            faceDetected = true;
            headYaw = computeHeadYaw(faceLandmarks[0]);
          }
        } catch (e) {
          console.error('[StudyGuard] Face detection error:', e);
        }
      }

      const inferenceMs = performance.now() - start;

      // studyPosition is true whenever the person is present and no phone is detected.
      // No head-yaw or posture requirement in any mode — the selected Study Mode
      // defines the expected study context, and monitoring is presence + distraction based.
      const studyPosition = personDetected && !phoneDetected;
      const studyConfidence = personDetected ? personConfidence : 0;

      const confidence = Math.max(personConfidence, phoneConfidence);
      const det: DetectionResult = {
        personDetected,
        phoneDetected,
        faceDetected,
        headYaw,
        studyPosition,
        studyConfidence,
        confidence,
        inferenceMs,
      };
      setLastResult(det);

      const now = performance.now();

      if (personDetected) {
        lastSeenRef.current = now;
      }

      // --- Determine presence state ---
      // All modes use the same presence-based Focused logic:
      //   Person present + no phone = Focused
      //   Person present + phone = Phone Distraction (after 3s confirmation)
      //   Person absent for 20s = Away
      //   Detection unreliable = Uncertain
      // The mode-specific difference is in supplementary signal collection
      // (face detection on/off), not in the Focused threshold itself.
      if (!personDetected) {
        // Person absent — check away threshold (20s)
        phoneFirstSeenRef.current = null;
        phoneDistractionActiveRef.current = false;
        phoneAbsenceCountRef.current = 0;
        presenceConfirmCountRef.current = 0;
        const last = lastSeenRef.current;
        if (last !== null && now - last >= AWAY_THRESHOLD_MS) {
          updatePresence('away');
        }
        // While not yet "away", keep previous state
      } else if (phoneDetected) {
        // Person present + phone detected — reset presence confirmation
        presenceConfirmCountRef.current = 0;
        phoneAbsenceCountRef.current = 0;
        if (phoneFirstSeenRef.current === null) {
          phoneFirstSeenRef.current = now;
        }

        const phoneDuration = now - phoneFirstSeenRef.current;

        if (phoneDuration >= PHONE_DISTRACTION_THRESHOLD_MS) {
          if (!phoneDistractionActiveRef.current) {
            phoneDistractionActiveRef.current = true;
            onPhoneDistractionRef.current?.();
          }
          updatePresence('phone_distraction');
        }
        // While phone seen but < 3s, keep as previous state
      } else {
        // Person present, no phone — debounce phone absence
        phoneAbsenceCountRef.current += 1;
        if (phoneAbsenceCountRef.current >= PHONE_ABSENCE_FRAMES) {
          phoneFirstSeenRef.current = null;
          phoneDistractionActiveRef.current = false;
        }

        // Person present and no phone — confirm presence over 2 frames, then Focused
        presenceConfirmCountRef.current += 1;
        if (presenceConfirmCountRef.current >= PRESENCE_CONFIRM_FRAMES) {
          updatePresence('focused');
        }
        // While not yet confirmed, keep previous state
      }
    } catch (e) {
      console.error('[StudyGuard] Detection error:', e);
    } finally {
      runningRef.current = false;
      setDetecting(false);
    }
  }, [videoRef, updatePresence]);

  // Log mode-specific monitoring configuration when the session starts running
  useEffect(() => {
    if (enabled) {
      const config = MODE_CONFIGS[studyMode];
      console.log(`[StudyGuard] Monitoring: ${config.description}`);
    }
  }, [enabled, studyMode]);

  // Run detection on an interval once model is loaded
  useEffect(() => {
    if (!enabled || !modelLoaded) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    runDetection();
    intervalRef.current = setInterval(runDetection, intervalMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, modelLoaded, intervalMs, runDetection]);

  // Reset state when disabled
  useEffect(() => {
    if (!enabled) {
      lastSeenRef.current = null;
      phoneFirstSeenRef.current = null;
      phoneDistractionActiveRef.current = false;
      phoneAbsenceCountRef.current = 0;
      presenceConfirmCountRef.current = 0;
      updatePresence('unknown');
    }
  }, [enabled, updatePresence]);

  // Cleanup models on unmount
  useEffect(() => {
    return () => {
      if (modelRef.current) {
        try {
          modelRef.current.close();
        } catch {
          /* ignore */
        }
        modelRef.current = null;
      }
      if (faceModelRef.current) {
        try {
          faceModelRef.current.close();
        } catch {
          /* ignore */
        }
        faceModelRef.current = null;
      }
    };
  }, []);

  return {
    modelLoaded,
    loadingModel,
    error,
    detecting,
    lastResult,
    presence,
  };
}
