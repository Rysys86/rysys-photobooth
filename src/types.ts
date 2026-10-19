export type Mode = 'single' | 'strip4' | 'grid2x2' | 'grid3x3' | 'burst' | 'timed' | 'gif' | 'booth';
export type FilterName = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'cool' | 'warm' | 'noir' | 'invert';
export type FramePreset = 'none' | 'classic' | 'polaroid' | 'retro' | 'whiteBorder' | 'rounded';
export type StripLayout = 'vertical' | 'horizontal' | '2-up';
export type Resolution = '480p' | '720p' | '1080p';
export type CountdownTime = 0 | 3 | 5 | 10;
export type PngQuality = 'low' | 'medium' | 'high';
export type PageSize = 'a4' | 'letter' | '4x6' | 'square';
export type WatermarkPosition = 'br' | 'bc' | 'tr' | 'tc';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Settings {
  camera: {
    deviceId: string;
    resolution: Resolution;
    countdown: CountdownTime;
  };
  capture: {
    defaultMode: Mode;
    filter: FilterName;
    framePreset: FramePreset;
    customFrameDataUrl: string | null;
    stripLayout: StripLayout;
    burstCount: 3 | 5 | 10;
    timedInterval: 2 | 3 | 5;
    gifDuration: 2 | 4 | 6 | 8;
    gifFps: 5 | 10 | 15;
  };
  output: {
    pngQuality: PngQuality;
    pdfPageSize: PageSize;
    watermark: string;
    watermarkPosition: WatermarkPosition;
  };
  print: {
    paperSize: PageSize;
    colorMode: 'color' | 'grayscale';
    copies: number;
    autoPrint: boolean;
  };
  appearance: {
    theme: ThemeMode;
    showPreview: boolean;
    showCountdown: boolean;
  };
}

export interface CapturedResult {
  type: 'image' | 'gif';
  dataUrl?: string;
  blob: Blob;
  frames: string[]; // individual frame dataUrls
  mode: Mode;
  layout?: StripLayout;
  timestamp: number;
}
