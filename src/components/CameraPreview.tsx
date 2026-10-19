import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { CSS_FILTERS } from '../utils/filters';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  error: string | null;
  countdown: number | null;
  flash: boolean;
  currentFrameIndex: number;
  totalFrames: number;
  isCapturing: boolean;
  onRetry: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  isStreaming,
  error,
  countdown,
  flash,
  currentFrameIndex,
  totalFrames,
  isCapturing,
  onRetry,
}) => {
  const { settings } = useSettings();
  const filterStyle = CSS_FILTERS[settings.capture.filter] || 'none';

  return (
    <div className="camera-container">
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
        className="camera-video"
        style={{ filter: filterStyle }}
      />

      {/* Live Frame Overlay Preview */}
      {settings.capture.customFrameDataUrl ? (
        <img
          src={settings.capture.customFrameDataUrl}
          alt="Frame Overlay"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
            zIndex: 10,
          }}
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
      ) : null}

      {/* Error / Offline state */}
      {(!isStreaming || error) && (
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
            {error || 'Starting camera stream...'}
          </div>
          <button className="btn-primary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
