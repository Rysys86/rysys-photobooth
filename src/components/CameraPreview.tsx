import React from 'react';
import { Mode } from '../types';
import { useSettings, getCustomFrameFor } from '../context/SettingsContext';
import { CSS_FILTERS } from '../utils/filters';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  isAutoplayBlocked: boolean;
  error: string | null;
  countdown: number | null;
  flash: boolean;
  currentFrameIndex: number;
  totalFrames: number;
  isCapturing: boolean;
  activeMode: Mode;
  activeLayout: string;
  onRetry: () => void;
  onResumePlayback: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  isStreaming,
  isAutoplayBlocked,
  error,
  countdown,
  flash,
  currentFrameIndex,
  totalFrames,
  isCapturing,
  activeMode,
  activeLayout,
  onRetry,
  onResumePlayback,
}) => {
  const { settings } = useSettings();
  const filterStyle = CSS_FILTERS[settings.capture.filter] || 'none';
  const customFrameUrl = getCustomFrameFor(settings.capture, activeMode, activeLayout);
  const isMirrored = settings.camera.mirrored;

  return (
    <div className="camera-container" onClick={isAutoplayBlocked ? onResumePlayback : undefined}>
      {/* Flash overlay */}
      {flash && <div className="flash-overlay" />}

      {/* Countdown overlay */}
      {countdown !== null && settings.appearance.showCountdown && (
        <div className="countdown-overlay">
          <div className="countdown-bubble">{countdown}</div>
        </div>
      )}

      {/* Capture progress */}
      {isCapturing && totalFrames > 1 && (
        <div className="progress-badge">
          Shot {currentFrameIndex} of {totalFrames}
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className={`camera-video ${isMirrored ? 'mirrored' : ''}`}
        style={{ filter: filterStyle }}
      />

      {/* Live Frame Overlay Preview */}
      {customFrameUrl ? (
        <img
          src={customFrameUrl}
          alt="Frame Overlay"
          className="live-frame-overlay"
        />
      ) : settings.capture.framePreset === 'classic' ? (
        <div
          style={{
            position: 'absolute',
            inset: '16px',
            border: '8px solid rgba(255,255,255,0.9)',
            outline: '2px solid rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      ) : settings.capture.framePreset === 'polaroid' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderTop: '24px solid #f8f8f6',
            borderLeft: '24px solid #f8f8f6',
            borderRight: '24px solid #f8f8f6',
            borderBottom: '72px solid #f8f8f6',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      ) : settings.capture.framePreset === 'whiteBorder' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '20px solid #ffffff',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      ) : settings.capture.framePreset === 'retro' ? (
        <div
          style={{
            position: 'absolute',
            inset: '16px',
            border: '6px double #e2c275',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      ) : settings.capture.framePreset === 'film' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderTop: '28px solid #111111',
            borderBottom: '28px solid #111111',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      ) : null}

      {/* Autoplay Blocked Banner */}
      {isAutoplayBlocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            zIndex: 30,
            cursor: 'pointer',
          }}
          onClick={onResumePlayback}
        >
          <div style={{ fontSize: '3rem' }}>▶️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
            Tap to Start Camera Preview
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Browser paused video playback until user interaction
          </div>
        </div>
      )}

      {/* Error / Offline state */}
      {(!isStreaming && !isAutoplayBlocked) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
            zIndex: 25,
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>📷</div>
          <div style={{ maxWidth: 360, lineHeight: 1.5, color: '#e2e8f0' }}>
            {error || 'Starting camera stream... If video does not appear, click retry below.'}
          </div>
          <button className="btn-primary" onClick={onRetry}>
            🔄 Start Camera
          </button>
        </div>
      )}
    </div>
  );
};
