import { useState, useEffect, useRef, useCallback } from 'react';
import { Resolution } from '../types';

interface UseCameraProps {
  deviceId: string;
  resolution: Resolution;
  mirrored?: boolean;
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
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
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
      console.warn('Failed to enumerate devices:', err);
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

  const attachStreamToVideo = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('autoplay', 'true');

    const handlePlaySuccess = () => {
      setIsStreaming(true);
      setIsAutoplayBlocked(false);
    };

    const handlePlayError = (err: unknown) => {
      console.warn('Camera video play error:', err);
      // Browser blocked autoplay without user gesture
      setIsAutoplayBlocked(true);
    };

    video.onloadedmetadata = () => {
      video.play().then(handlePlaySuccess).catch(handlePlayError);
    };

    video.onplaying = () => {
      setIsStreaming(true);
      setIsAutoplayBlocked(false);
    };

    video.play().then(handlePlaySuccess).catch(handlePlayError);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);
    setIsAutoplayBlocked(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera API is not supported on this browser or platform');
      return;
    }

    const { width, height } = RES_MAP[resolution] || RES_MAP['720p'];

    // Flexible constraints with ideal values to prevent OverconstrainedError
    const primaryConstraints: MediaStreamConstraints = {
      audio: false,
      video: {
        ...(activeDeviceId ? { deviceId: { ideal: activeDeviceId } } : { facingMode: 'user' }),
        width: { ideal: width },
        height: { ideal: height },
      },
    };

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
    } catch (primaryErr: unknown) {
      console.warn('High-res constraints failed, falling back to basic camera:', primaryErr);
      try {
        // Fallback to basic unconstrained camera request
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: activeDeviceId ? { deviceId: { ideal: activeDeviceId } } : true,
        });
      } catch (fallbackErr: unknown) {
        const e = fallbackErr as Error;
        console.error('All camera attempts failed:', e);
        setError(
          e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError'
            ? 'Camera permission denied. Please allow camera access in browser / OS settings.'
            : e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError'
              ? 'No camera found on this device.'
              : `Camera error: ${e.message || 'Unable to start camera feed'}`
        );
        setIsStreaming(false);
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      attachStreamToVideo();
      await refreshDevices();
    }
  }, [activeDeviceId, resolution, refreshDevices, stopStream, attachStreamToVideo]);

  // Keep video element attached to stream whenever ref changes or re-renders
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      attachStreamToVideo();
    }
  });

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

  const resumePlayback = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsStreaming(true);
        setIsAutoplayBlocked(false);
      }).catch((err) => {
        console.warn('Manual resume playback error:', err);
      });
    }
  }, []);

  return {
    videoRef,
    devices,
    activeDeviceId,
    isStreaming,
    isAutoplayBlocked,
    error,
    refreshDevices,
    switchDevice,
    restartStream: startStream,
    resumePlayback,
  };
};
