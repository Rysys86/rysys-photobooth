import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider, useSettings, getCustomFrameFor } from './context/SettingsContext';
import { useCamera } from './hooks/useCamera';
import { useCaptureEngine } from './hooks/useCaptureEngine';
import { CameraPreview } from './components/CameraPreview';
import { ModeSelector } from './components/ModeSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { OutputModal } from './components/OutputModal';
import { CapturedResult, Mode, MODE_LAYOUTS } from './types';

const AppContent: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [capturedResult, setCapturedResult] = useState<CapturedResult | null>(null);

  const activeMode = settings.capture.defaultMode;
  const activeLayout = settings.capture.modeLayouts[activeMode] || MODE_LAYOUTS[activeMode]?.[0]?.id || 'standard';
  const hasCustomFrame = Boolean(getCustomFrameFor(settings.capture, activeMode, activeLayout));

  const {
    videoRef,
    devices,
    activeDeviceId,
    isStreaming,
    isAutoplayBlocked,
    error,
    switchDevice,
    restartStream,
    resumePlayback,
  } = useCamera({
    deviceId: settings.camera.deviceId,
    resolution: settings.camera.resolution,
    mirrored: settings.camera.mirrored,
    onDeviceSelect: (id) => {
      updateSettings((prev) => ({
        ...prev,
        camera: { ...prev.camera, deviceId: id },
      }));
    },
  });

  const {
    isCapturing,
    countdown,
    currentFrameIndex,
    totalFrames,
    flash,
    startCapture,
    cancelCapture,
  } = useCaptureEngine({
    settings,
    onResultReady: (result) => {
      if (settings.appearance.showPreview) {
        setCapturedResult(result);
      }
    },
  });

  const handleShutter = useCallback(() => {
    if (isCapturing) {
      cancelCapture();
      return;
    }
    if (videoRef.current) {
      startCapture(videoRef.current);
    }
  }, [isCapturing, cancelCapture, startCapture, videoRef]);

  const handleSwitchToNextCamera = () => {
    if (devices.length <= 1) return;
    const curIdx = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIdx = (curIdx + 1) % devices.length;
    switchDevice(devices[nextIdx].deviceId);
  };

  const handleSelectMode = useCallback((mode: Mode) => {
    updateSettings((prev) => ({
      ...prev,
      capture: { ...prev.capture, defaultMode: mode },
    }));
  }, [updateSettings]);

  const handleSelectLayout = useCallback((layoutId: string) => {
    updateSettings((prev) => ({
      ...prev,
      capture: {
        ...prev.capture,
        modeLayouts: {
          ...prev.capture.modeLayouts,
          [activeMode]: layoutId,
        },
      },
    }));
  }, [updateSettings, activeMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleShutter();
      } else if (e.key === 'Escape') {
        if (isCapturing) cancelCapture();
        else if (capturedResult) setCapturedResult(null);
        else if (isSettingsOpen) setIsSettingsOpen(false);
      } else if (e.key.toLowerCase() === 's') {
        setIsSettingsOpen((prev) => !prev);
      } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const modes: Mode[] = ['single', 'strip4', 'booth', 'grid2x2', 'grid3x3', 'burst', 'gif', 'timed'];
        const target = modes[Number(e.key) - 1];
        if (target) handleSelectMode(target);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing, capturedResult, isSettingsOpen, handleShutter, cancelCapture, handleSelectMode]);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <img src="./icon.png" alt="RYsys Photobooth" className="brand-icon" />
          <h1 className="brand-title">RYsys Photobooth</h1>
        </div>

        <div className="header-actions">
          {devices.length > 1 && (
            <button
              className="btn-icon"
              onClick={handleSwitchToNextCamera}
              title="Switch Camera"
              aria-label="Switch Camera"
            >
              🔄
            </button>
          )}

          <button
            className="btn-icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings (S)"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="app-main">
        <CameraPreview
          videoRef={videoRef}
          isStreaming={isStreaming}
          isAutoplayBlocked={isAutoplayBlocked}
          error={error}
          countdown={countdown}
          flash={flash}
          currentFrameIndex={currentFrameIndex}
          totalFrames={totalFrames}
          isCapturing={isCapturing}
          activeMode={activeMode}
          activeLayout={activeLayout}
          onRetry={restartStream}
          onResumePlayback={resumePlayback}
        />
      </main>

      <footer className="app-controls">
        <ModeSelector
          currentMode={activeMode}
          currentLayout={activeLayout}
          hasCustomFrame={hasCustomFrame}
          onSelectMode={handleSelectMode}
          onSelectLayout={handleSelectLayout}
          disabled={isCapturing}
        />

        <div className="shutter-bar">
          <button
            className={`shutter-btn ${isCapturing ? 'capturing' : ''}`}
            onClick={handleShutter}
            title={isCapturing ? 'Stop / Cancel' : 'Capture (Space)'}
            aria-label="Capture photo"
          >
            <div className="shutter-btn-inner" />
          </button>
        </div>
      </footer>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        activeDeviceId={activeDeviceId}
        onSwitchDevice={switchDevice}
      />

      <OutputModal
        result={capturedResult}
        onClose={() => setCapturedResult(null)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
