import { useState, useRef, useCallback } from 'react';
import { Mode, Settings, CapturedResult } from '../types';
import { captureVideoFrame, compositeFinalImage } from '../utils/canvasComposite';
import { canvasToBlob } from '../utils/exportPng';
import { createGifFromFrames } from '../utils/exportGif';
import { printCanvas } from '../utils/printJob';

interface UseCaptureEngineProps {
  settings: Settings;
  onResultReady: (result: CapturedResult) => void;
}

export const useCaptureEngine = ({ settings, onResultReady }: UseCaptureEngineProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [totalFrames, setTotalFrames] = useState(1);
  const [flash, setFlash] = useState(false);

  const abortRef = useRef(false);
  const timedIntervalRef = useRef<number | null>(null);

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
  };

  const waitCountdown = async (seconds: number): Promise<boolean> => {
    if (seconds <= 0) return true;
    for (let i = seconds; i > 0; i--) {
      if (abortRef.current) return false;
      setCountdown(i);
      await new Promise((res) => setTimeout(res, 1000));
    }
    setCountdown(null);
    return !abortRef.current;
  };

  const cancelCapture = useCallback(() => {
    abortRef.current = true;
    if (timedIntervalRef.current) {
      clearInterval(timedIntervalRef.current);
      timedIntervalRef.current = null;
    }
    setIsCapturing(false);
    setCountdown(null);
  }, []);

  const startCapture = useCallback(
    async (video: HTMLVideoElement, modeOverride?: Mode) => {
      const mode = modeOverride || settings.capture.defaultMode;
      abortRef.current = false;
      setIsCapturing(true);

      const count =
        mode === 'single'
          ? 1
          : mode === 'strip4' || mode === 'booth' || mode === 'grid2x2'
            ? 4
            : mode === 'grid3x3'
              ? 9
              : mode === 'burst'
                ? settings.capture.burstCount
                : 1;

      setTotalFrames(count);
      setCurrentFrameIndex(0);

      try {
        if (mode === 'gif') {
          // GIF capture sequence
          const ok = await waitCountdown(settings.camera.countdown);
          if (!ok) return;

          const fps = settings.capture.gifFps;
          const duration = settings.capture.gifDuration;
          const frameCount = fps * duration;
          const intervalMs = Math.round(1000 / fps);

          setTotalFrames(frameCount);
          const gifFrames: HTMLCanvasElement[] = [];

          for (let i = 0; i < frameCount; i++) {
            if (abortRef.current) return;
            setCurrentFrameIndex(i + 1);
            const frame = captureVideoFrame(video);
            gifFrames.push(frame);
            await new Promise((res) => setTimeout(res, intervalMs));
          }

          const gifBlob = createGifFromFrames(gifFrames, {
            fps: settings.capture.gifFps,
            width: 480,
          });

          const dataUrl = URL.createObjectURL(gifBlob);
          onResultReady({
            type: 'gif',
            dataUrl,
            blob: gifBlob,
            frames: gifFrames.slice(0, 4).map((c) => c.toDataURL('image/jpeg', 0.6)),
            mode,
            timestamp: Date.now(),
          });
          return;
        }

        if (mode === 'timed') {
          // Continuous timed shots until canceled
          const ok = await waitCountdown(settings.camera.countdown);
          if (!ok) return;

          const takeTimedShot = async () => {
            if (abortRef.current) return;
            triggerFlash();
            const frame = captureVideoFrame(video);
            const comp = await compositeFinalImage([frame], 'single', {
              filter: settings.capture.filter,
              framePreset: settings.capture.framePreset,
              customFrameUrl: settings.capture.customFrameDataUrl,
              watermark: settings.output.watermark,
              watermarkPosition: settings.output.watermarkPosition,
              stripLayout: settings.capture.stripLayout,
              colorMode: settings.print.colorMode,
            });
            const blob = await canvasToBlob(comp, settings.output.pngQuality);
            onResultReady({
              type: 'image',
              dataUrl: comp.toDataURL('image/png'),
              blob,
              frames: [frame.toDataURL('image/jpeg', 0.7)],
              mode,
              timestamp: Date.now(),
            });
          };

          await takeTimedShot();
          timedIntervalRef.current = window.setInterval(
            takeTimedShot,
            settings.capture.timedInterval * 1000
          );
          return;
        }

        // Single, Strip4, Booth, Grids, Burst
        const capturedFrames: HTMLCanvasElement[] = [];

        for (let i = 0; i < count; i++) {
          if (abortRef.current) return;
          setCurrentFrameIndex(i + 1);

          // For 'booth' mode: countdown before EVERY shot!
          // For other modes: countdown only before the FIRST shot.
          if (mode === 'booth' || i === 0) {
            const ok = await waitCountdown(settings.camera.countdown);
            if (!ok) return;
          } else if (mode === 'burst') {
            await new Promise((res) => setTimeout(res, 250));
          } else {
            // Strip / grid inter-frame interval
            await new Promise((res) => setTimeout(res, 800));
          }

          triggerFlash();
          const frame = captureVideoFrame(video);
          capturedFrames.push(frame);
        }

        // Composite final image
        const finalCanvas = await compositeFinalImage(capturedFrames, mode, {
          filter: settings.capture.filter,
          framePreset: settings.capture.framePreset,
          customFrameUrl: settings.capture.customFrameDataUrl,
          watermark: settings.output.watermark,
          watermarkPosition: settings.output.watermarkPosition,
          stripLayout: settings.capture.stripLayout,
          colorMode: settings.print.colorMode,
        });

        const blob = await canvasToBlob(finalCanvas, settings.output.pngQuality);
        const dataUrl = finalCanvas.toDataURL('image/png');

        onResultReady({
          type: 'image',
          dataUrl,
          blob,
          frames: capturedFrames.map((c) => c.toDataURL('image/jpeg', 0.7)),
          mode,
          layout: settings.capture.stripLayout,
          timestamp: Date.now(),
        });

        // Auto print if enabled
        if (settings.print.autoPrint) {
          await printCanvas(finalCanvas, {
            paperSize: settings.print.paperSize,
            colorMode: settings.print.colorMode,
            copies: settings.print.copies,
          });
        }
      } catch (err) {
        console.error('Capture engine error:', err);
      } finally {
        if (!timedIntervalRef.current) {
          setIsCapturing(false);
          setCountdown(null);
        }
      }
    },
    [settings, onResultReady]
  );

  return {
    isCapturing,
    countdown,
    currentFrameIndex,
    totalFrames,
    flash,
    startCapture,
    cancelCapture,
  };
};
