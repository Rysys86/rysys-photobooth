import React, { createContext, useContext, useEffect, useState } from 'react';
import { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  camera: {
    deviceId: '',
    resolution: '720p',
    countdown: 3,
  },
  capture: {
    defaultMode: 'single',
    filter: 'none',
    framePreset: 'none',
    customFrameDataUrl: null,
    stripLayout: 'vertical',
    burstCount: 5,
    timedInterval: 3,
    gifDuration: 4,
    gifFps: 10,
  },
  output: {
    pngQuality: 'high',
    pdfPageSize: '4x6',
    watermark: 'RYsys Photobooth',
    watermarkPosition: 'br',
  },
  print: {
    paperSize: '4x6',
    colorMode: 'color',
    copies: 1,
    autoPrint: false,
  },
  appearance: {
    theme: 'dark',
    showPreview: true,
    showCountdown: true,
  },
};

const STORAGE_KEY = 'rysys_photobooth_settings_v1';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updater: (prev: Settings) => Settings) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          camera: { ...DEFAULT_SETTINGS.camera, ...parsed.camera },
          capture: { ...DEFAULT_SETTINGS.capture, ...parsed.capture },
          output: { ...DEFAULT_SETTINGS.output, ...parsed.output },
          print: { ...DEFAULT_SETTINGS.print, ...parsed.print },
          appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
        };
      }
    } catch {
      // localStorage failed or corrupt
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore quota errors
    }

    // sync theme class on root
    const root = document.documentElement;
    if (settings.appearance.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.appearance.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    }
  }, [settings]);

  const updateSettings = (updater: (prev: Settings) => Settings) => {
    setSettings((prev) => updater(prev));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
