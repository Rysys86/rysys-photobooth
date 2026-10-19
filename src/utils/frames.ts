import { FramePreset } from '../types';

export const drawFrame = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: FramePreset,
  customFrameUrl: string | null
): Promise<void> => {
  if (customFrameUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => {
        // Fallback to preset if custom frame fails to load
        drawPreset(ctx, width, height, preset);
        resolve();
      };
      img.src = customFrameUrl;
    });
  }

  drawPreset(ctx, width, height, preset);
};

const drawPreset = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: FramePreset
) => {
  ctx.save();
  switch (preset) {
    case 'classic': {
      const bw = Math.max(8, Math.round(width * 0.02));
      ctx.lineWidth = bw;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(bw / 2, bw / 2, width - bw, height - bw);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#222222';
      ctx.strokeRect(bw + 2, bw + 2, width - (bw * 2) - 4, height - (bw * 2) - 4);
      break;
    }
    case 'polaroid': {
      // Classic polaroid: thick borders on sides/top, extra deep at bottom
      const side = Math.round(width * 0.04);
      const bottom = Math.round(height * 0.16);
      ctx.fillStyle = '#f8f8f6';

      // Top
      ctx.fillRect(0, 0, width, side);
      // Left
      ctx.fillRect(0, 0, side, height);
      // Right
      ctx.fillRect(width - side, 0, side, height);
      // Bottom
      ctx.fillRect(0, height - bottom, width, bottom);
      break;
    }
    case 'retro': {
      const border = Math.round(width * 0.03);
      ctx.lineWidth = border;
      ctx.strokeStyle = '#e2c275'; // Gold-tint vintage border
      ctx.strokeRect(border / 2, border / 2, width - border, height - border);

      ctx.lineWidth = Math.max(2, border * 0.2);
      ctx.strokeStyle = '#5a3d10';
      ctx.strokeRect(border * 1.2, border * 1.2, width - border * 2.4, height - border * 2.4);
      break;
    }
    case 'whiteBorder': {
      const border = Math.round(Math.min(width, height) * 0.04);
      ctx.lineWidth = border * 2;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(0, 0, width, height);
      break;
    }
    case 'rounded': {
      // Soft rounded mask around edges
      const r = Math.round(Math.min(width, height) * 0.06);
      ctx.fillStyle = '#0f172a';
      // Cut outer corners
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.arc(r, r, r, Math.PI, 1.5 * Math.PI);
      ctx.arc(width - r, r, r, 1.5 * Math.PI, 2 * Math.PI);
      ctx.arc(width - r, height - r, r, 0, 0.5 * Math.PI);
      ctx.arc(r, height - r, r, 0.5 * Math.PI, Math.PI);
      ctx.closePath();
      // Draw border ring
      ctx.lineWidth = Math.max(4, Math.round(width * 0.015));
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(10, 10, width - 20, height - 20, r);
      ctx.stroke();
      break;
    }
    case 'none':
    default:
      break;
  }
  ctx.restore();
};
