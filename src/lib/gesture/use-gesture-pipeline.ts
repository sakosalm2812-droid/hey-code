'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureEngine,
  type GestureActionExecutor,
  type EngineStatus as MediaPipeEngineStatus,
} from '@/lib/gesture/gesture-engine';
import {
  registerGestureController,
  unregisterGestureController,
  type GestureController,
} from '@/lib/terminal/command-router';
import { gestureLog } from '@/lib/terminal/logger';
import { useTerminalStore } from '@/lib/terminal/terminal-store';
import type { GestureSnapshot } from '@/lib/terminal/types';

/**
 * React lifecycle owner for the MediaPipe gesture engine.
 *
 * Owns the front-facing camera stream, binds the engine's action executor to the
 * centralized terminal store, and exposes itself to the command router so the
 * textual "gesture on|off" command drives the very same pipeline.
 */

export interface GesturePipelineState {
  enabled: boolean;
  status: MediaPipeEngineStatus;
  error: string | null;
  lastSnapshot: GestureSnapshot | null;
  /**
   * Permission errors carry a distinct flag so the UI can render guidance
   * instead of a raw exception message.
   */
  permissionDenied: boolean;
}

function cameraConstraints(): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };
}

export function useGesturePipeline(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<GesturePipelineState>({
    enabled: false,
    status: 'idle',
    error: null,
    lastSnapshot: null,
    permissionDenied: false,
  });

  const engineRef = useRef<GestureEngine | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const disposedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = useCallback((partial: Partial<GesturePipelineState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const getEngine = useCallback((): GestureEngine => {
    if (!engineRef.current) {
      engineRef.current = new GestureEngine();
    }
    return engineRef.current;
  }, []);

  const stopTracks = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  const executor = useMemo<GestureActionExecutor>(
    () => ({
      onOpenPalm: (snapshot) => {
        const store = useTerminalStore.getState();
        store.clear();
        store.append({
          level: 'success',
          source: 'gesture',
          text: `Open palm verified over ${snapshot.timestampMs} ms window -> terminalState.clear().`,
        });
      },
      onClosedFist: (snapshot) => {
        const store = useTerminalStore.getState();
        store.requestExit();
        store.append({
          level: 'warn',
          source: 'gesture',
          text: 'Closed fist confirmed -> OS application exit routine requested.',
        });
        try {
          if (typeof window !== 'undefined') window.close();
        } catch (error) {
          gestureLog.warn('window.close() was blocked by the browser', error);
        }
      },
      onScroll: (snapshot) => {
        useTerminalStore.getState().applyScrollDelta(snapshot.scrollDeltaPx);
      },
      onSnapshot: (snapshot) => {
        useTerminalStore.getState().setLastSnapshot(snapshot);
      },
      onNoHand: () => {
        // No hand in frame; the engine already resets its activation streaks.
      },
    }),
    []
  );

  const setEnabled = useCallback(
    async (enable: boolean) => {
      const engine = getEngine();
      if (disposedRef.current) return;

      if (!enable) {
        engine.stop();
        stopTracks();
        patch({ enabled: false, status: 'idle', permissionDenied: false, error: null });
        useTerminalStore.getState().setGestureStatus('idle');
        gestureLog.info('Gesture pipeline disabled via controller');
        return;
      }

      const videoRefValue = videoRef.current;
      if (!videoRefValue) {
        patch({ status: 'error', error: 'Camera preview element is not mounted.' });
        return;
      }

      patch({ status: 'loading', error: null, permissionDenied: false });

      try {
        if (!engine.isLoaded) {
          await engine.load();
        }

        if (disposedRef.current) return;

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(cameraConstraints());
        } catch (mediaError) {
          const name = mediaError instanceof DOMException ? mediaError.name : '';
          const denied =
            name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'NotFoundError';
          const message = denied
            ? 'Camera access is blocked. Grant permission and try "gesture on" again.'
            : mediaError instanceof Error
              ? mediaError.message
              : String(mediaError);
          patch({ status: 'error', error: message, permissionDenied: denied });
          useTerminalStore.getState().setGestureStatus('error', message);
          gestureLog.error('getUserMedia failed', { name, message });
          return;
        }

        if (disposedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRefValue.srcObject = stream;
        await videoRefValue.play();

        engine.setViewportHeight(
          videoRefValue.clientHeight || Math.floor(window.innerHeight * 0.4)
        );
        engine.start(videoRefValue, executor);

        patch({ enabled: true, status: engine.status, error: null, permissionDenied: false });
        useTerminalStore.getState().setGestureStatus(engine.status);
        gestureLog.info('Gesture pipeline active');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        engine.stop();
        stopTracks();
        patch({ enabled: false, status: 'error', error: message, permissionDenied: false });
        useTerminalStore.getState().setGestureStatus('error', message);
        gestureLog.error('Gesture pipeline start failed', error);
      }
    },
    [executor, getEngine, patch, stopTracks, videoRef]
  );

  const stop = useCallback(() => {
    getEngine().stop();
    stopTracks();
  }, [getEngine, stopTracks]);

  const syncViewportSize = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const size = video.clientHeight || Math.floor(window.innerHeight * 0.4);
    getEngine().setViewportHeight(size);
  }, [getEngine, videoRef]);

  // Wire this hook into the command router as the gesture controller so textual
  // commands ("gesture on|off|status") control the same camera pipeline.
  useEffect(() => {
    const controller: GestureController = {
      setEnabled: (enable: boolean) => setEnabled(enable),
      getStatus: () => ({
        enabled: stateRef.current.enabled,
        status: stateRef.current.status,
        error: stateRef.current.error,
      }),
      dispose: () => setEnabled(false),
    };
    registerGestureController(controller);
    return () => {
      unregisterGestureController(controller);
    };
  }, [setEnabled]);

  // Track engine status + enabled flag into the store so the terminal transcript
  // ("gesture status") reflects reality.
  useEffect(() => {
    useTerminalStore.getState().setGestureStatus(state.status, state.error);
    useTerminalStore.getState().setGestureEnabled(state.enabled);
  }, [state.status, state.error, state.enabled]);

  useEffect(() => {
    const onResize = () => syncViewportSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncViewportSize]);

  useEffect(() => {
    return () => {
      disposedRef.current = true;
      const engine = engineRef.current;
      if (engine) {
        engine.dispose();
        engineRef.current = null;
      }
      stopTracks();
    };
  }, [stopTracks]);

  return {
    ...state,
    setEnabled,
    stop,
    syncViewportSize,
  };
}