import { PageSize } from '../types';

export interface PrintOptions {
  paperSize: PageSize;
  colorMode: 'color' | 'grayscale';
  copies: number;
}

export const printCanvas = (
  canvas: HTMLCanvasElement,
  options: PrintOptions
): Promise<boolean> => {
  return new Promise((resolve) => {
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      resolve(true);
      return;
    }

    const { paperSize, colorMode, copies } = options;

    let pageCssSize = 'auto';
    if (paperSize === '4x6') pageCssSize = '4in 6in';
    else if (paperSize === 'a4') pageCssSize = 'A4';
    else if (paperSize === 'letter') pageCssSize = 'letter';
    else if (paperSize === 'square') pageCssSize = '6in 6in';

    const filterCss = colorMode === 'grayscale' ? 'filter: grayscale(100%);' : '';

    let pagesHtml = '';
    for (let i = 0; i < Math.max(1, copies); i++) {
      pagesHtml += `
        <div class="print-page">
          <img src="${dataUrl}" class="print-img" alt="Photo" />
        </div>
      `;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RYsys Photobooth - Print</title>
          <style>
            @page {
              size: ${pageCssSize};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-page {
              page-break-after: always;
              break-after: page;
              width: 100vw;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 8mm;
              box-sizing: border-box;
            }
            .print-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              ${filterCss}
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print()', err);
        window.print();
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
        resolve(true);
      }, 2000);
    };

    // Give iframe time to parse and render images
    const imgEl = doc.querySelector('img');
    if (imgEl && !imgEl.complete) {
      imgEl.onload = () => setTimeout(triggerPrint, 300);
      imgEl.onerror = () => triggerPrint();
    } else {
      setTimeout(triggerPrint, 400);
    }
  });
};
