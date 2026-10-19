import { PngQuality } from '../types';

const QUALITY_MAP: Record<PngQuality, number> = {
  low: 0.75,
  medium: 0.9,
  high: 1.0,
};

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: PngQuality = 'high'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob from canvas'));
      },
      'image/png',
      QUALITY_MAP[quality]
    );
  });
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportPng = async (
  canvas: HTMLCanvasElement,
  quality: PngQuality = 'high',
  filename = `rysys-photobooth-${Date.now()}.png`
): Promise<Blob> => {
  const blob = await canvasToBlob(canvas, quality);
  downloadBlob(blob, filename);
  return blob;
};
