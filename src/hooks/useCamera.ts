import { useState, useEffect, useRef, useCallback } from 'react';
import { Resolution } from '../types';

interface UseCameraProps {
  deviceId: string;
  resolution: Resolution;
  onDeviceSelect?: (deviceId: string) => void;
}

const RES_MAP: Record<Resolution, { width: number; height: number }> = {
  '480p': { width: 640, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

export const useCamera = ({ deviceId, resolution, onDeviceSelect }: UseCameraProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(deviceId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setError('Camera enumeration not supported');
        return;
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !activeDeviceId) {
        const firstId = videoDevs[0].deviceId;
        setActiveDeviceId(firstId);
        onDeviceSelect?.(firstId);
      }
    } catch (err: unknown) {
      console.error('Failed to enumerate devices:', err);
    }
  }, [activeDeviceId, onDeviceSelect]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('getUserMedia is not supported on this browser or platform');
      return;
    }

    const { width, height } = RES_MAP[resolution] || RES_MAP['720p'];

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: activeDeviceId
        ? {
            deviceId: { exact: activeDeviceId },
            width: { ideal: width },
            height: { ideal: height },
          }
        : {
            width: { ideal: width },
            height: { ideal: height },
            facingMode: 'user',
          },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsStreaming(true);

      // Refresh devices after permission granted to obtain valid labels
      await refreshDevices();
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Camera access error:', e);
      setError(
        e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access.'
          : e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError'
            ? 'No camera found on this device.'
            : `Camera error: ${e.message || 'Unable to open camera'}`
      );
      setIsStreaming(false);
    }
  }, [activeDeviceId, resolution, refreshDevices, stopStream]);

  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
  }, [startStream, stopStream]);

  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices();
    };
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  const switchDevice = useCallback(
    (newDeviceId: string) => {
      setActiveDeviceId(newDeviceId);
      onDeviceSelect?.(newDeviceId);
    },
    [onDeviceSelect]
  );

  return {
    videoRef,
    devices,
    activeDeviceId,
    isStreaming,
    error,
    refreshDevices,
    switchDevice,
    restartStream: startStream,
  };
};
