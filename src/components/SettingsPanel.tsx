import React, { useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { FilterName, FramePreset, PageSize, Resolution, StripLayout, ThemeMode } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MediaDeviceInfo[];
  activeDeviceId: string;
  onSwitchDevice: (deviceId: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  devices,
  activeDeviceId,
  onSwitchDevice,
}) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCustomFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateSettings((prev) => ({
        ...prev,
        capture: {
          ...prev.capture,
          customFrameDataUrl: dataUrl,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearCustomFrame = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    updateSettings((prev) => ({
      ...prev,
      capture: {
        ...prev.capture,
        customFrameDataUrl: null,
      },
    }));
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Settings</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {/* CAMERA SECTION */}
          <div className="setting-section">
            <div className="section-title">Camera</div>
            <div className="setting-row">
              <label>Device</label>
              <select
                className="setting-select"
                value={activeDeviceId}
                onChange={(e) => onSwitchDevice(e.target.value)}
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <label>Resolution</label>
              <select
                className="setting-select"
                value={settings.camera.resolution}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, resolution: e.target.value as Resolution },
                  }))
                }
              >
                <option value="480p">480p (SD)</option>
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Countdown</label>
              <select
                className="setting-select"
                value={settings.camera.countdown}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, countdown: Number(e.target.value) as 0 | 3 | 5 | 10 },
                  }))
                }
              >
                <option value={0}>Off (0s)</option>
                <option value={3}>3 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>
          </div>

          {/* CAPTURE SECTION */}
          <div className="setting-section">
            <div className="section-title">Capture & Effects</div>
            <div className="setting-row">
              <label>Filter</label>
              <select
                className="setting-select"
                value={settings.capture.filter}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    capture: { ...prev.capture, filter: e.target.value as FilterName },
                  }))
                }
              >
                <option value="none">Normal</option>
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
                <option value="vintage">Vintage</option>
                <option value="cool">Cool Blue</option>
                <option value="warm">Warm</option>
                <option value="noir">Noir High Contrast</option>
                <option value="invert">Invert</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Frame Preset</label>
              <select
                className="setting-select"
                value={settings.capture.framePreset}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    capture: { ...prev.capture, framePreset: e.target.value as FramePreset },
                  }))
                }
              >
                <option value="none">None</option>
                <option value="classic">Classic Border</option>
                <option value="polaroid">Polaroid</option>
                <option value="retro">Vintage Gold</option>
                <option value="whiteBorder">White Border</option>
                <option value="rounded">Rounded Corners</option>
              </select>
            </div>

            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label>Custom Frame</label>
                {settings.capture.customFrameDataUrl && (
                  <button
                    onClick={clearCustomFrame}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Clear Custom Frame
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="setting-input"
                onChange={handleCustomFrameUpload}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {settings.capture.customFrameDataUrl ? '✓ Custom frame active (overrides preset)' : 'Presets apply when no custom frame uploaded'}
              </span>
            </div>

            <div className="setting-row">
              <label>Strip Layout</label>
              <select
                className="setting-select"
                value={settings.capture.stripLayout}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    capture: { ...prev.capture, stripLayout: e.target.value as StripLayout },
                  }))
                }
              >
                <option value="vertical">Vertical Strip</option>
                <option value="horizontal">Horizontal Strip</option>
                <option value="2-up">2-Up Grid</option>
              </select>
            </div>

            <div className="setting-row">
              <label>GIF FPS</label>
              <select
                className="setting-select"
                value={settings.capture.gifFps}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    capture: { ...prev.capture, gifFps: Number(e.target.value) as 5 | 10 | 15 },
                  }))
                }
              >
                <option value={5}>5 FPS (Small file)</option>
                <option value={10}>10 FPS (Standard)</option>
                <option value={15}>15 FPS (Smooth)</option>
              </select>
            </div>

            <div className="setting-row">
              <label>GIF Duration</label>
              <select
                className="setting-select"
                value={settings.capture.gifDuration}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    capture: { ...prev.capture, gifDuration: Number(e.target.value) as 2 | 4 | 6 | 8 },
                  }))
                }
              >
                <option value={2}>2 seconds</option>
                <option value={4}>4 seconds</option>
                <option value={6}>6 seconds</option>
                <option value={8}>8 seconds</option>
              </select>
            </div>
          </div>

          {/* OUTPUT SECTION */}
          <div className="setting-section">
            <div className="section-title">Output & Watermark</div>
            <div className="setting-row">
              <label>Watermark</label>
              <input
                type="text"
                className="setting-input"
                style={{ width: 160 }}
                value={settings.output.watermark}
                placeholder="Watermark text"
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    output: { ...prev.output, watermark: e.target.value },
                  }))
                }
              />
            </div>

            <div className="setting-row">
              <label>PDF Page Size</label>
              <select
                className="setting-select"
                value={settings.output.pdfPageSize}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    output: { ...prev.output, pdfPageSize: e.target.value as PageSize },
                    print: { ...prev.print, paperSize: e.target.value as PageSize },
                  }))
                }
              >
                <option value="4x6">4 x 6 Photo Paper</option>
                <option value="a4">A4 Document</option>
                <option value="letter">Letter</option>
                <option value="square">Square (6x6)</option>
              </select>
            </div>
          </div>

          {/* PRINT SECTION */}
          <div className="setting-section">
            <div className="section-title">Printer</div>
            <div className="setting-row">
              <label>Color Mode</label>
              <select
                className="setting-select"
                value={settings.print.colorMode}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    print: { ...prev.print, colorMode: e.target.value as 'color' | 'grayscale' },
                  }))
                }
              >
                <option value="color">Full Color</option>
                <option value="grayscale">Grayscale / Black & White</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Copies</label>
              <input
                type="number"
                min={1}
                max={10}
                className="setting-input"
                style={{ width: 80 }}
                value={settings.print.copies}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    print: { ...prev.print, copies: Math.max(1, Math.min(10, Number(e.target.value))) },
                  }))
                }
              />
            </div>

            <div className="setting-row">
              <label>Auto-Print After Capture</label>
              <input
                type="checkbox"
                checked={settings.print.autoPrint}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    print: { ...prev.print, autoPrint: e.target.checked },
                  }))
                }
              />
            </div>
          </div>

          {/* APPEARANCE SECTION */}
          <div className="setting-section">
            <div className="section-title">Appearance</div>
            <div className="setting-row">
              <label>Theme</label>
              <select
                className="setting-select"
                value={settings.appearance.theme}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    appearance: { ...prev.appearance, theme: e.target.value as ThemeMode },
                  }))
                }
              >
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="auto">System Default</option>
              </select>
            </div>
          </div>

          <button className="btn-secondary" style={{ marginTop: 12, justifyContent: 'center' }} onClick={resetSettings}>
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  );
};
