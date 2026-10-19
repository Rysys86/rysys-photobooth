import React, { useRef, useState } from 'react';
import { useSettings, getCustomFrameFor } from '../context/SettingsContext';
import { FilterName, FramePreset, Mode, MODE_LAYOUTS, PageSize, Resolution, ThemeMode } from '../types';

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

  // Frame manager state
  const [frameManagerMode, setFrameManagerMode] = useState<Mode>(settings.capture.defaultMode);
  const [frameManagerLayout, setFrameManagerLayout] = useState<string>(
    settings.capture.modeLayouts[settings.capture.defaultMode] || 'standard'
  );

  if (!isOpen) return null;

  const currentLayouts = MODE_LAYOUTS[frameManagerMode] || [];
  const currentKey = `${frameManagerMode}:${frameManagerLayout}`;
  const activeCustomFrame = getCustomFrameFor(settings.capture, frameManagerMode, frameManagerLayout);
  const hasExactFrame = Boolean(settings.capture.customFrames?.[currentKey]);

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
          customFrames: {
            ...prev.capture.customFrames,
            [currentKey]: dataUrl,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearCurrentCustomFrame = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    updateSettings((prev) => {
      const nextCustomFrames = { ...prev.capture.customFrames };
      delete nextCustomFrames[currentKey];
      delete nextCustomFrames[frameManagerMode];
      return {
        ...prev,
        capture: {
          ...prev.capture,
          customFrames: nextCustomFrames,
          customFrameDataUrl: null,
        },
      };
    });
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="./icon.png" alt="Logo" style={{ width: 24, height: 24, borderRadius: 6 }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Settings</h2>
          </div>
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

            <div className="setting-row">
              <label>Mirror Camera View</label>
              <input
                type="checkbox"
                checked={settings.camera.mirrored}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    camera: { ...prev.camera, mirrored: e.target.checked },
                  }))
                }
              />
            </div>
          </div>

          {/* CUSTOM FRAMES PER MODE & LAYOUT */}
          <div className="setting-section">
            <div className="section-title">Custom Frames & Layouts</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure custom PNG border templates per capture mode and layout.
            </div>

            <div className="setting-row">
              <label>Target Mode</label>
              <select
                className="setting-select"
                value={frameManagerMode}
                onChange={(e) => {
                  const m = e.target.value as Mode;
                  setFrameManagerMode(m);
                  const firstLayout = MODE_LAYOUTS[m]?.[0]?.id || 'standard';
                  setFrameManagerLayout(firstLayout);
                }}
              >
                <option value="single">Single Photo</option>
                <option value="strip4">Strip (4 Photos)</option>
                <option value="booth">Booth Classic</option>
                <option value="grid2x2">2x2 Grid</option>
                <option value="grid3x3">3x3 Grid</option>
                <option value="burst">Burst Mode</option>
                <option value="gif">Animated GIF</option>
                <option value="timed">Timed Shutter</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Target Layout</label>
              <select
                className="setting-select"
                value={frameManagerLayout}
                onChange={(e) => setFrameManagerLayout(e.target.value)}
              >
                {currentLayouts.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Frame Status & Upload Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Frame for {frameManagerMode} ({frameManagerLayout})
                </span>
                {hasExactFrame && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    ✓ Custom Set
                  </span>
                )}
              </div>

              {activeCustomFrame ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={activeCustomFrame}
                    alt="Custom frame preview"
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: 'contain',
                      background: '#1e293b',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                      {hasExactFrame ? 'Custom PNG overlay active' : 'Inherited frame active'}
                    </span>
                    <button
                      onClick={clearCurrentCustomFrame}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: 0,
                      }}
                    >
                      Remove Custom Frame
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No custom frame set for this layout. Preset frame will apply.
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/webp"
                className="setting-input"
                style={{ fontSize: '0.75rem' }}
                onChange={handleCustomFrameUpload}
              />
            </div>

            <div className="setting-row">
              <label>Preset Frame Fallback</label>
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
                <option value="none">None (Clean)</option>
                <option value="classic">Classic Border</option>
                <option value="polaroid">Polaroid</option>
                <option value="retro">Vintage Gold</option>
                <option value="whiteBorder">White Border</option>
                <option value="rounded">Rounded Corners</option>
                <option value="film">35mm Film</option>
              </select>
            </div>
          </div>

          {/* CAPTURE FILTERS & GIF SETTINGS */}
          <div className="setting-section">
            <div className="section-title">Filters & Timing</div>
            <div className="setting-row">
              <label>Color Filter</label>
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
              <label>GIF Frame Rate</label>
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

            <div className="setting-row">
              <label>Burst Shot Count</label>
              <select
                className="setting-select"
                value={settings.capture.burstCount}
                onChange={(e) =>
                  updateSettings((prev) => ({
                    ...prev,
                    capture: { ...prev.capture, burstCount: Number(e.target.value) as 3 | 5 | 10 },
                  }))
                }
              >
                <option value={3}>3 shots</option>
                <option value={5}>5 shots</option>
                <option value={10}>10 shots</option>
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
