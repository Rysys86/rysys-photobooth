import React, { useState } from 'react';
import { CapturedResult } from '../types';
import { useSettings } from '../context/SettingsContext';
import { exportPng } from '../utils/exportPng';
import { exportPdf } from '../utils/exportPdf';
import { printCanvas } from '../utils/printJob';

interface OutputModalProps {
  result: CapturedResult | null;
  onClose: () => void;
}

export const OutputModal: React.FC<OutputModalProps> = ({ result, onClose }) => {
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!result) return null;

  // Create an in-memory HTMLCanvasElement from result image if needed
  const getCanvasFromImage = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      if (!result.dataUrl) return reject(new Error('No image URL'));
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(c);
      };
      img.onerror = reject;
      img.src = result.dataUrl;
    });
  };

  const handleDownloadPng = async () => {
    try {
      setIsProcessing(true);
      const canvas = await getCanvasFromImage();
      await exportPng(canvas, settings.output.pngQuality, `rysys-${Date.now()}.png`);
    } catch (err) {
      console.error('Download PNG failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsProcessing(true);
      const canvas = await getCanvasFromImage();
      exportPdf(canvas, settings.output.pdfPageSize, `rysys-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Download PDF failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadGif = () => {
    if (!result.blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(result.blob);
    a.download = `rysys-animation-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = async () => {
    try {
      setIsProcessing(true);
      const canvas = await getCanvasFromImage();
      await printCanvas(canvas, {
        paperSize: settings.print.paperSize,
        colorMode: settings.print.colorMode,
        copies: settings.print.copies,
      });
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="./icon.png" alt="Logo" style={{ width: 24, height: 24, borderRadius: 6 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {result.type === 'gif' ? 'Animated GIF Ready' : 'Photo Result'}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-preview">
          <img src={result.dataUrl} alt="Captured Result" />
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={isProcessing}>
            🔄 New Photo
          </button>

          {result.type === 'gif' ? (
            <button className="btn-primary" onClick={handleDownloadGif} disabled={isProcessing}>
              📥 Download GIF
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={handleDownloadPng} disabled={isProcessing}>
                🖼️ Download PNG
              </button>
              <button className="btn-secondary" onClick={handleDownloadPdf} disabled={isProcessing}>
                📄 Download PDF
              </button>
              <button className="btn-primary" onClick={handlePrint} disabled={isProcessing}>
                🖨️ Print Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
