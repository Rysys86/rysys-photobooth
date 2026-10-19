import { FilterName, FramePreset, Mode, WatermarkPosition } from '../types';
import { CSS_FILTERS } from './filters';
import { drawFrame, drawPreset } from './frames';

export interface CompositeOptions {
  filter: FilterName;
  framePreset: FramePreset;
  customFrameUrl: string | null;
  watermark: string;
  watermarkPosition: WatermarkPosition;
  layout: string;
  colorMode?: 'color' | 'grayscale';
  mirrored?: boolean;
}

export const captureVideoFrame = (
  video: HTMLVideoElement,
  mirrored = true
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d')!;

  ctx.save();
  if (mirrored) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
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

const drawFullOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  url: string | null
): Promise<void> => {
  if (!url) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
};

export const compositeFinalImage = async (
  frames: HTMLCanvasElement[],
  mode: Mode,
  options: CompositeOptions
): Promise<HTMLCanvasElement> => {
  if (frames.length === 0) {
    throw new Error('No frames to composite');
  }

  const { filter, framePreset, customFrameUrl, watermark, watermarkPosition, layout, colorMode } = options;
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

  // --- MODE: SINGLE or TIMED ---
  if (mode === 'single' || mode === 'timed' || frames.length === 1) {
    const frame = frames[0];

    if (layout === 'square') {
      const side = Math.min(singleW, singleH);
      outputCanvas.width = side;
      outputCanvas.height = side;
      const sx = (singleW - side) / 2;
      const sy = (singleH - side) / 2;

      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frame, sx, sy, side, side, 0, 0, side, side);
      ctx.restore();

      await drawFrame(ctx, side, side, framePreset, customFrameUrl);
      drawWatermark(ctx, side, side, watermark, watermarkPosition);
      return outputCanvas;
    }

    if (layout === 'portrait') {
      const targetW = Math.round(singleH * (3 / 4));
      const targetH = singleH;
      outputCanvas.width = targetW;
      outputCanvas.height = targetH;
      const sx = Math.max(0, (singleW - targetW) / 2);

      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frame, sx, 0, targetW, targetH, 0, 0, targetW, targetH);
      ctx.restore();

      await drawFrame(ctx, targetW, targetH, framePreset, customFrameUrl);
      drawWatermark(ctx, targetW, targetH, watermark, watermarkPosition);
      return outputCanvas;
    }

    if (layout === 'polaroid') {
      const side = Math.round(singleW * 0.05);
      const bottom = Math.round(singleH * 0.22);
      const outW = singleW + side * 2;
      const outH = singleH + side + bottom;

      outputCanvas.width = outW;
      outputCanvas.height = outH;
      ctx.fillStyle = '#f8f8f6';
      ctx.fillRect(0, 0, outW, outH);

      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frame, side, side, singleW, singleH);
      ctx.restore();

      drawWatermark(ctx, outW, outH, watermark, 'bc');
      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    if (layout === 'film') {
      const barH = Math.round(singleH * 0.12);
      const outW = singleW;
      const outH = singleH + barH * 2;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, outW, outH);

      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frame, 0, barH, singleW, singleH);
      ctx.restore();

      drawPreset(ctx, outW, outH, 'film');
      drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    // Standard single
    outputCanvas.width = singleW;
    outputCanvas.height = singleH;

    ctx.save();
    applyFrameFilter(ctx);
    ctx.drawImage(frame, 0, 0, singleW, singleH);
    ctx.restore();

    await drawFrame(ctx, singleW, singleH, framePreset, customFrameUrl);
    drawWatermark(ctx, singleW, singleH, watermark, watermarkPosition);
    return outputCanvas;
  }

  // --- MODE: STRIP4 or BOOTH ---
  if (mode === 'strip4' || mode === 'booth') {
    const pad = Math.round(singleW * 0.03);
    const footerH = Math.round(singleH * 0.22);

    if (layout === 'horizontal') {
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

        if (framePreset !== 'none') {
          ctx.save();
          ctx.translate(x, pad);
          drawPreset(ctx, singleW, singleH, framePreset);
          ctx.restore();
        }
      }

      ctx.save();
      const fontSize = Math.max(18, Math.round(outH * 0.04));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(watermark || 'RYsys Photobooth', outW / 2, outH - Math.round(footerH * 0.4));
      ctx.restore();

      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    if (layout === '2-up') {
      const pad2 = Math.round(singleW * 0.025);
      const footer2 = Math.round(singleH * 0.16);
      const outW = singleW * 2 + pad2 * 3;
      const outH = singleH * 2 + pad2 * 3 + footer2;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      for (let i = 0; i < 4; i++) {
        const frame = frames[i] || frames[frames.length - 1];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = pad2 + col * (singleW + pad2);
        const y = pad2 + row * (singleH + pad2);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, x, y, singleW, singleH);
        ctx.restore();

        if (framePreset !== 'none') {
          ctx.save();
          ctx.translate(x, y);
          drawPreset(ctx, singleW, singleH, framePreset);
          ctx.restore();
        }
      }

      drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    if (layout === 'filmstrip') {
      const filmPad = Math.round(singleW * 0.08);
      const outW = singleW + filmPad * 2;
      const outH = singleH * 4 + filmPad * 5 + footerH;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, outW, outH);

      // Sprockets left and right
      ctx.fillStyle = '#ffffff';
      const holeW = Math.round(filmPad * 0.35);
      const holeH = Math.round(holeW * 1.4);
      const step = holeH * 1.8;
      const holeCount = Math.floor(outH / step);
      for (let j = 0; j < holeCount; j++) {
        const hy = j * step + 10;
        ctx.beginPath();
        ctx.roundRect((filmPad - holeW) / 2, hy, holeW, holeH, 3);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(outW - filmPad + (filmPad - holeW) / 2, hy, holeW, holeH, 3);
        ctx.fill();
      }

      for (let i = 0; i < 4; i++) {
        const frame = frames[i] || frames[frames.length - 1];
        const y = filmPad + i * (singleH + filmPad);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, filmPad, y, singleW, singleH);
        ctx.restore();
      }

      ctx.save();
      const fontSize = Math.max(18, Math.round(outW * 0.04));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(watermark || 'RYsys Photobooth', outW / 2, outH - Math.round(footerH * 0.4));
      ctx.restore();

      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    if (layout === 'postcard') {
      const padCard = Math.round(singleW * 0.03);
      const memoH = Math.round(singleH * 0.4);
      const outW = singleW * 2 + padCard * 3;
      const outH = singleH * 2 + padCard * 3 + memoH;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, outW, outH);

      for (let i = 0; i < 4; i++) {
        const frame = frames[i] || frames[frames.length - 1];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = padCard + col * (singleW + padCard);
        const y = padCard + row * (singleH + padCard);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, x, y, singleW, singleH);
        ctx.restore();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, singleW, singleH);
      }

      // Memo area
      const memoY = outH - memoH + 20;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let l = 0; l < 3; l++) {
        ctx.beginPath();
        ctx.moveTo(padCard * 2, memoY + l * 32);
        ctx.lineTo(outW - padCard * 2, memoY + l * 32);
        ctx.stroke();
      }

      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'right';
      ctx.fillText(watermark || 'RYsys Photobooth', outW - padCard * 2, outH - 24);

      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    // Default: Vertical Strip
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

      if (framePreset !== 'none') {
        ctx.save();
        ctx.translate(pad, y);
        drawPreset(ctx, singleW, singleH, framePreset);
        ctx.restore();
      }
    }

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

    await drawFullOverlay(ctx, outW, outH, customFrameUrl);
    return outputCanvas;
  }

  // --- MODE: GRID2X2 ---
  if (mode === 'grid2x2') {
    if (layout === 'hero-focus') {
      // 1 large hero shot on left, 3 stacked shots on right
      const pad = Math.round(singleW * 0.02);
      const smallH = Math.round((singleH * 2 - pad * 2) / 3);
      const smallW = Math.round(smallH * (singleW / singleH));
      const heroW = singleW * 1.5;
      const heroH = singleH * 2;
      const outW = heroW + smallW + pad * 3;
      const outH = heroH + pad * 2;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      // Hero
      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frames[0], pad, pad, heroW, heroH);
      ctx.restore();

      // 3 side photos
      for (let i = 1; i < 4; i++) {
        const frame = frames[i] || frames[0];
        const y = pad + (i - 1) * (smallH + pad);
        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, heroW + pad * 2, y, smallW, smallH);
        ctx.restore();
      }

      drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    if (layout === 'polaroid-quad') {
      const pad = Math.round(singleW * 0.04);
      const bottom = Math.round(singleH * 0.16);
      const quadW = singleW + pad * 2;
      const quadH = singleH + pad + bottom;
      const outW = quadW * 2 + pad;
      const outH = quadH * 2 + pad;
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, outW, outH);

      for (let i = 0; i < 4; i++) {
        const frame = frames[i] || frames[frames.length - 1];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const ox = col * (quadW + pad);
        const oy = row * (quadH + pad);

        ctx.fillStyle = '#f8f8f6';
        ctx.fillRect(ox, oy, quadW, quadH);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frame, ox + pad, oy + pad, singleW, singleH);
        ctx.restore();
      }

      drawWatermark(ctx, outW, outH, watermark, 'bc');
      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    // Classic 2x2 or bordered
    const pad = layout === 'bordered' ? Math.round(singleW * 0.05) : Math.round(singleW * 0.02);
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

      if (framePreset !== 'none') {
        ctx.save();
        ctx.translate(x, y);
        drawPreset(ctx, singleW, singleH, framePreset);
        ctx.restore();
      }
    }

    drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
    await drawFullOverlay(ctx, outW, outH, customFrameUrl);
    return outputCanvas;
  }

  // --- MODE: GRID3X3 ---
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

      if (framePreset !== 'none') {
        ctx.save();
        ctx.translate(x, y);
        drawPreset(ctx, singleW, singleH, framePreset);
        ctx.restore();
      }
    }

    drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
    await drawFullOverlay(ctx, outW, outH, customFrameUrl);
    return outputCanvas;
  }

  // --- MODE: BURST ---
  if (mode === 'burst') {
    const count = frames.length;
    const pad = Math.round(singleW * 0.02);

    if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const outW = singleW * cols + pad * (cols + 1);
      const outH = singleH * rows + pad * (rows + 1);
      outputCanvas.width = outW;
      outputCanvas.height = outH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = pad + col * (singleW + pad);
        const y = pad + row * (singleH + pad);

        ctx.save();
        applyFrameFilter(ctx);
        ctx.drawImage(frames[i], x, y, singleW, singleH);
        ctx.restore();
      }

      drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
      await drawFullOverlay(ctx, outW, outH, customFrameUrl);
      return outputCanvas;
    }

    // Default burst strip
    const outW = singleW * count + pad * (count + 1);
    const outH = singleH + pad * 2;
    outputCanvas.width = outW;
    outputCanvas.height = outH;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, outW, outH);

    for (let i = 0; i < count; i++) {
      const x = pad + i * (singleW + pad);
      ctx.save();
      applyFrameFilter(ctx);
      ctx.drawImage(frames[i], x, pad, singleW, singleH);
      ctx.restore();
    }

    drawWatermark(ctx, outW, outH, watermark, watermarkPosition);
    await drawFullOverlay(ctx, outW, outH, customFrameUrl);
    return outputCanvas;
  }

  // Fallback
  outputCanvas.width = singleW;
  outputCanvas.height = singleH;
  ctx.save();
  applyFrameFilter(ctx);
  ctx.drawImage(frames[0], 0, 0, singleW, singleH);
  ctx.restore();
  drawWatermark(ctx, singleW, singleH, watermark, watermarkPosition);
  await drawFullOverlay(ctx, singleW, singleH, customFrameUrl);

  return outputCanvas;
};
