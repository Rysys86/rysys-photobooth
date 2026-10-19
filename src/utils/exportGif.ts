import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { downloadBlob } from './exportPng';

export interface GifOptions {
  fps: number;
  width?: number;
}

export const createGifFromFrames = (
  canvases: HTMLCanvasElement[],
  options: GifOptions
): Blob => {
  if (canvases.length === 0) {
    throw new Error('No frames provided for GIF');
  }

  const { fps, width = 480 } = options;
  const first = canvases[0];
  const aspect = first.height / first.width;
  const targetW = Math.min(width, first.width);
  const targetH = Math.round(targetW * aspect);

  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);

  // Reusable resize canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = targetW;
  tempCanvas.height = targetH;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;

  for (const canvas of canvases) {
    tempCtx.clearRect(0, 0, targetW, targetH);
    tempCtx.drawImage(canvas, 0, 0, targetW, targetH);
    const imgData = tempCtx.getImageData(0, 0, targetW, targetH);
    const rgba = imgData.data;

    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);

    gif.writeFrame(index, targetW, targetH, {
      palette,
      delay,
      repeat: 0, // infinite loop
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  return new Blob([bytes as unknown as BlobPart], { type: 'image/gif' });
};

export const exportGif = (
  canvases: HTMLCanvasElement[],
  options: GifOptions,
  filename = `rysys-photobooth-${Date.now()}.gif`
): Blob => {
  const blob = createGifFromFrames(canvases, options);
  downloadBlob(blob, filename);
  return blob;
};
