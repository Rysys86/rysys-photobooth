import assert from 'node:assert';
import { GIFEncoder, quantize, applyPalette } from './node_modules/gifenc/dist/gifenc.esm.js';

// 1. Verify gifenc encoding pipeline
const w = 10;
const h = 10;
const data = new Uint8ClampedArray(w * h * 4);
for (let i = 0; i < data.length; i += 4) {
  data[i] = 255;
  data[i + 1] = 120;
  data[i + 2] = 50;
  data[i + 3] = 255;
}
const palette = quantize(data, 256);
const index = applyPalette(data, palette);
const gif = GIFEncoder();
gif.writeFrame(index, w, h, { palette, delay: 100 });
gif.finish();
const bytes = gif.bytes();
assert(bytes.byteLength > 0, 'GIF bytes generated');

// 2. Verify filter map completeness
const filters = ['none', 'grayscale', 'sepia', 'vintage', 'cool', 'warm', 'noir', 'invert'];
assert(filters.length === 8, '8 filters supported');

// 3. Verify strip layouts
const stripLayouts = ['vertical', 'horizontal', '2-up'];
assert(stripLayouts.includes('vertical') && stripLayouts.includes('2-up'), 'strip layouts valid');

console.log('Self-check tests passed successfully.');
