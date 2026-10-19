import { FilterName, FramePreset, Mode, StripLayout, WatermarkPosition } from '../types';
import { CSS_FILTERS } from './filters';
import { drawFrame } from './frames';

export interface CompositeOptions {
  filter: FilterName;
  framePreset: FramePreset;
  customFrameUrl: string | null;
  watermark: string;
  watermarkPosition: WatermarkPosition;
  stripLayout: StripLayout;
  colorMode?: 'color' | 'grayscale';
}

export const captureVideoFrame = (video: HTMLVideoElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d')!;

  // Mirror horizontally if user-facing
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  return canvas;
};

const drawWatermark = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  pos: WatermarkPosition
) => {
  if (!text.trim()) return;

  ctx.save();
  const fontSize = Math.max(14, Math.round(width * 0.026));
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const margin = Math.round(width * 0.03);

  let x = width - margin;
  let y = height - margin;
  let align: CanvasTextAlign = 'right';

  if (pos === 'bc') {
    x = width / 2;
    align = 'center';
  } else if (pos === 'tr') {
    x = width - margin;
    y = margin + fontSize;
  } else if (pos === 'tc') {
    x = width / 2;
    y = margin + fontSize;
    align = 'center';
  }

  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
};

export const compositeFinalImage = async (
  frames: HTMLCanvasElement[],
  mode: Mode,
  options: CompositeOptions
): Promise<HTMLCanvasElement> => {
  if (frames.length === 0) {
    throw new Error('No frames to composite');
  }

  const { filter, framePreset, customFrameUrl, watermark, watermarkPosition, stripLayout, colorMode } = options;
  const singleW = frames[0].width;
  const singleH = frames[0].height;

  const outputCanvas = document.createElement('canvas');
  const ctx = outputCanvas.getContext('2d')!;

  const applyFrameFilter = (targetCtx: CanvasRenderingContext2D) => {
    let filterStr = CSS_FILTERS[filter] || 'none';
    if (colorMode === 'grayscale' && !filterStr.includes('grayscale')) {
      filterStr = filterStr === 'none' ? 'grayscale(100%)' : `${filterStr} grayscale(100%)`;
    }
    targetCtx.filter = filterStr;
  };

  if (mode === 'single' || frames.length === 1) {
    outputCanvas.width = singleW;
    outputCanvas.height = singleH;

    ctx.save();
    applyFrameFilter(ctx);
    ctx.drawImage(frames[0], 0, 0, singleW, singleH);
    ctx.restore();

    await drawFrame(ctx, singleW, singleH, framePreset, customFrameUrl);
    drawWatermark(ctx, singleW, singleH, watermark, watermarkPosition);
    return outputCanvas;
  }

  if (mode === 'strip4' || mode === 'booth') {
    const pad = Math.round(singleW * 0.03);
    const footerH = Math.round(singleH * 0.2);

    if (stripLayout === 'vertical') {
      const outW = singleW + pad * 2;
      const outH = singleH * 4 + pad * 5 + footerH;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      for (let i = 0; i < 4; i++) {
        const frame = frames[i] || frames[frames.length - 1];
        const y = pad + i * (singleH + pad);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, pad, y, singleW, singleH);
        ctx.restore();

        ctx.save();
        ctx.translate(pad, y);
        await drawFrame(ctx, singleW, singleH, framePreset, customFrameUrl);
        ctx.restore();
      }

      // Strip footer watermark / date
      ctx.save();
      const fontSize = Math.max(18, Math.round(outW * 0.04));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      const textY = outH - Math.round(footerH * 0.4);
      ctx.fillText(watermark || 'RYsys Photobooth', outW / 2, textY);

      ctx.font = `normal ${Math.round(fontSize * 0.6)}px sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }), outW / 2, textY + fontSize);
      ctx.restore();

      return outputCanvas;
    }

    if (stripLayout === 'horizontal') {
      const outW = singleW * 4 + pad * 5;
      const outH = singleH + pad * 2 + footerH;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      for (let i = 0; i < 4; i++) {
        const frame = frames[i] || frames[frames.length - 1];
        const x = pad + i * (singleW + pad);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, x, pad, singleW, singleH);
        ctx.restore();

        ctx.save();
        ctx.translate(x, pad);
        await drawFrame(ctx, singleW, singleH, framePreset, customFrameUrl);
        ctx.restore();
      }

      ctx.save();
      const fontSize = Math.max(18, Math.round(outH * 0.04));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(watermark || 'RYsys Photobooth', outW / 2, outH - Math.round(footerH * 0.4));
      ctx.restore();

      return outputCanvas;
    }

    if (stripLayout === '2-up') {
      // 2x2 layout suited for 4x6 print paper
      const pad = Math.round(singleW * 0.025);
      const footer = Math.round(singleH * 0.15);
      const outW = singleW * 2 + pad * 3;
      const outH = singleH * 2 + pad * 3 + footer;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      for (let i = 0; i < 4; i++) {
        const frame = frames[i] || frames[frames.length - 1];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = pad + col * (singleW + pad);
        const y = pad + row * (singleH + pad);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, x, y, singleW, singleH);
        ctx.restore();

        ctx.save();
        ctx.translate(x, y);
        await drawFrame(ctx, singleW, singleH, framePreset, customFrameUrl);
        ctx.restore();
      }

      drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
      return outputCanvas;
    }
  }

  if (mode === 'grid2x2') {
    const pad = Math.round(singleW * 0.02);
    const outW = singleW * 2 + pad * 3;
    const outH = singleH * 2 + pad * 3;
    outputCanvas.width = outW;
    outputCanvas.height = outH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);

    for (let i = 0; i < 4; i++) {
      const frame = frames[i] || frames[frames.length - 1];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = pad + col * (singleW + pad);
      const y = pad + row * (singleH + pad);

      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frame, x, y, singleW, singleH);
      ctx.restore();

      ctx.save();
      ctx.translate(x, y);
      await drawFrame(ctx, singleW, singleH, framePreset, customFrameUrl);
      ctx.restore();
    }

    drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
    return outputCanvas;
  }

  if (mode === 'grid3x3') {
    const pad = Math.round(singleW * 0.015);
    const outW = singleW * 3 + pad * 4;
    const outH = singleH * 3 + pad * 4;
    outputCanvas.width = outW;
    outputCanvas.height = outH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);

    for (let i = 0; i < 9; i++) {
      const frame = frames[i] || frames[frames.length - 1];
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = pad + col * (singleW + pad);
      const y = pad + row * (singleH + pad);

      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frame, x, y, singleW, singleH);
      ctx.restore();

      ctx.save();
      ctx.translate(x, y);
      await drawFrame(ctx, singleW, singleH, framePreset, customFrameUrl);
      ctx.restore();
    }

    drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
    return outputCanvas;
  }

  // Fallback for burst / timed - single montage or first frame
  outputCanvas.width = singleW;
  outputCanvas.height = singleH;
  ctx.save();
  applyFrameFilter(ctx);
  ctx.drawImage(frames[0], 0, 0, singleW, singleH);
  ctx.restore();
  drawWatermark(ctx, singleW, singleH, watermark, watermarkPosition);

  return outputCanvas;
};
