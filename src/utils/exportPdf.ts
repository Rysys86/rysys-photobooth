import { jsPDF } from 'jspdf';
import { PageSize } from '../types';

interface PageDimensions {
  width: number;
  height: number;
}

const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
  '4x6': { width: 101.6, height: 152.4 },
  square: { width: 150, height: 150 },
};

export const createPdfFromCanvas = (
  canvas: HTMLCanvasElement,
  pageSize: PageSize = '4x6'
): jsPDF => {
  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const isLandscape = canvasW > canvasH;

  const baseDim = PAGE_SIZES[pageSize] || PAGE_SIZES['4x6'];
  const pdfW = isLandscape ? Math.max(baseDim.width, baseDim.height) : Math.min(baseDim.width, baseDim.height);
  const pdfH = isLandscape ? Math.min(baseDim.width, baseDim.height) : Math.max(baseDim.width, baseDim.height);

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfW, pdfH],
  });

  const margin = 5; // 5mm margin
  const availW = pdfW - margin * 2;
  const availH = pdfH - margin * 2;

  const canvasRatio = canvasW / canvasH;
  const pageRatio = availW / availH;

  let imgW: number;
  let imgH: number;

  if (canvasRatio > pageRatio) {
    imgW = availW;
    imgH = availW / canvasRatio;
  } else {
    imgH = availH;
    imgW = availH * canvasRatio;
  }

  const posX = margin + (availW - imgW) / 2;
  const posY = margin + (availH - imgH) / 2;

  const imgData = canvas.toDataURL('image/png', 0.95);
  doc.addImage(imgData, 'PNG', posX, posY, imgW, imgH);

  return doc;
};

export const exportPdf = (
  canvas: HTMLCanvasElement,
  pageSize: PageSize = '4x6',
  filename = `rysys-photobooth-${Date.now()}.pdf`
): Blob => {
  const doc = createPdfFromCanvas(canvas, pageSize);
  doc.save(filename);
  return doc.output('blob');
};
