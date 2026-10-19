import React from 'react';
import { Mode } from '../types';

interface ModeSelectorProps {
  currentMode: Mode;
  onSelectMode: (mode: Mode) => void;
  disabled?: boolean;
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'single', label: 'Single' },
  { id: 'strip4', label: 'Strip (4)' },
  { id: 'booth', label: 'Booth Classic' },
  { id: 'grid2x2', label: '2x2 Grid' },
  { id: 'grid3x3', label: '3x3 Grid' },
  { id: 'burst', label: 'Burst' },
  { id: 'gif', label: 'GIF' },
  { id: 'timed', label: 'Timed' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled,
}) => {
  return (
    <div className="mode-selector">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`mode-pill ${currentMode === m.id ? 'active' : ''}`}
          onClick={() => onSelectMode(m.id)}
          disabled={disabled}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};
