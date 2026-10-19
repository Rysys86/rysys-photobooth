export type Mode = 'single' | 'strip4' | 'grid2x2' | 'grid3x3' | 'burst' | 'timed' | 'gif' | 'booth';
export type FilterName = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'cool' | 'warm' | 'noir' | 'invert';
export type FramePreset = 'none' | 'classic' | 'polaroid' | 'retro' | 'whiteBorder' | 'rounded' | 'film';
export type Resolution = '480p' | '720p' | '1080p';
export type CountdownTime = 0 | 3 | 5 | 10;
export type PngQuality = 'low' | 'medium' | 'high';
export type PageSize = 'a4' | 'letter' | '4x6' | 'square';
export type WatermarkPosition = 'br' | 'bc' | 'tr' | 'tc';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface LayoutOption {
  id: string;
  label: string;
  desc: string;
}

export const MODE_LAYOUTS: Record<Mode, LayoutOption[]> = {
  single: [
    { id: 'standard', label: 'Standard', desc: 'Native camera ratio (16:9 / 4:3)' },
    { id: 'portrait', label: 'Portrait', desc: 'Vertical 3:4 portrait crop' },
    { id: 'square', label: 'Square (1:1)', desc: 'Instagram style square crop' },
    { id: 'polaroid', label: 'Polaroid', desc: 'Instant print with bottom white memo' },
    { id: 'film', label: '35mm Film', desc: 'Analog 35mm film border' },
  ],
  strip4: [
    { id: 'vertical', label: 'Vertical Strip', desc: 'Classic 1x4 vertical photobooth strip' },
    { id: 'horizontal', label: 'Horizontal Strip', desc: '4x1 panorama horizontal row' },
    { id: '2-up', label: '2-Up (2x2)', desc: '2x2 double strip suited for 4x6 print' },
    { id: 'filmstrip', label: 'Cinema Reel', desc: 'Perforated 35mm motion strip' },
    { id: 'postcard', label: 'Postcard Memo', desc: '4-frame card with note / signature space' },
  ],
  booth: [
    { id: 'vertical', label: 'Vertical Strip', desc: 'Classic 1x4 vertical photobooth strip' },
    { id: 'horizontal', label: 'Horizontal Strip', desc: '4x1 panorama horizontal row' },
    { id: '2-up', label: '2-Up (2x2)', desc: '2x2 double strip suited for 4x6 print' },
    { id: 'filmstrip', label: 'Cinema Reel', desc: 'Perforated 35mm motion strip' },
    { id: 'postcard', label: 'Postcard Memo', desc: '4-frame card with note / signature space' },
  ],
  grid2x2: [
    { id: 'classic', label: 'Classic 2x2', desc: 'Even 4-frame photo collage' },
    { id: 'polaroid-quad', label: 'Polaroid Quad', desc: '4 mini polaroids on matte sheet' },
    { id: 'hero-focus', label: 'Hero Focus', desc: '1 prominent hero photo + 3 highlights' },
    { id: 'bordered', label: 'Gallery Frame', desc: 'Museum gallery wide margins' },
  ],
  grid3x3: [
    { id: 'classic', label: 'Classic 3x3', desc: 'Uniform 9-photo mosaic' },
    { id: 'center-stage', label: 'Center Stage', desc: 'Dominant center portrait + 8 border snapshots' },
    { id: 'masonry', label: 'Staggered', desc: 'Artistic alternating grid rows' },
  ],
  burst: [
    { id: 'strip', label: 'Motion Strip', desc: 'Horizontal high-speed sequence' },
    { id: 'grid', label: 'Action Grid', desc: 'Multi-frame action contact sheet' },
    { id: 'stack', label: 'Action Stack', desc: 'Motion cascade card layout' },
  ],
  gif: [
    { id: 'standard', label: 'Standard GIF', desc: 'Clean animated loop' },
    { id: 'polaroid', label: 'Polaroid GIF', desc: 'Animated frame in polaroid border' },
    { id: 'retro-tv', label: 'Retro TV', desc: 'Vintage CRT display frame' },
    { id: 'film-loop', label: 'Film Loop', desc: 'Animated cinema reel frame' },
  ],
  timed: [
    { id: 'standard', label: 'Standard', desc: 'Full interval captures' },
    { id: 'portrait', label: 'Portrait', desc: 'Timed portrait series' },
    { id: 'square', label: 'Square', desc: 'Timed square series' },
    { id: 'polaroid', label: 'Polaroid', desc: 'Timed instant prints' },
  ],
};

export interface Settings {
  camera: {
    deviceId: string;
    resolution: Resolution;
    countdown: CountdownTime;
    mirrored: boolean;
  };
  capture: {
    defaultMode: Mode;
    modeLayouts: Record<Mode, string>;
    filter: FilterName;
    framePreset: FramePreset;
    customFrames: Record<string, string>; // key: `${mode}:${layout}` or `${mode}`
    customFrameDataUrl: string | null;
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
  layout: string;
  timestamp: number;
}
