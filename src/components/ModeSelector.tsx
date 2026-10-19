import React from 'react';
import { Mode, MODE_LAYOUTS } from '../types';

interface ModeSelectorProps {
  currentMode: Mode;
  currentLayout: string;
  hasCustomFrame?: boolean;
  onSelectMode: (mode: Mode) => void;
  onSelectLayout: (layoutId: string) => void;
  disabled?: boolean;
}

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: 'single', label: 'Single', icon: '📷' },
  { id: 'strip4', label: 'Strip (4)', icon: '🎞️' },
  { id: 'booth', label: 'Booth Classic', icon: '🎪' },
  { id: 'grid2x2', label: '2x2 Grid', icon: '🪟' },
  { id: 'grid3x3', label: '3x3 Grid', icon: '▦' },
  { id: 'burst', label: 'Burst', icon: '⚡' },
  { id: 'gif', label: 'GIF', icon: '🎬' },
  { id: 'timed', label: 'Timed', icon: '⏱️' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  currentLayout,
  hasCustomFrame,
  onSelectMode,
  onSelectLayout,
  disabled,
}) => {
  const layouts = MODE_LAYOUTS[currentMode] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {/* Primary Mode Row */}
      <div className="mode-selector">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-pill ${currentMode === m.id ? 'active' : ''}`}
            onClick={() => onSelectMode(m.id)}
            disabled={disabled}
          >
            <span style={{ marginRight: 5 }}>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Secondary Layout Sub-bar for Current Mode */}
      {layouts.length > 0 && (
        <div className="layout-selector">
          <span className="layout-label">Layout:</span>
          {layouts.map((l) => (
            <button
              key={l.id}
              className={`layout-pill ${currentLayout === l.id ? 'active' : ''}`}
              onClick={() => onSelectLayout(l.id)}
              disabled={disabled}
              title={l.desc}
            >
              {l.label}
              {hasCustomFrame && currentLayout === l.id && (
                <span style={{ marginLeft: 4, fontSize: '0.7rem' }}>🖼️</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
