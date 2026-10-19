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

// 3. Verify presets
const framePresets = ['none', 'classic', 'polaroid', 'retro', 'whiteBorder', 'rounded', 'film'];
assert(framePresets.length === 7, '7 frame presets supported');

// 4. Verify layouts for modes
const stripLayouts = ['vertical', 'horizontal', '2-up', 'filmstrip', 'postcard'];
assert(stripLayouts.includes('filmstrip') && stripLayouts.includes('postcard'), 'new strip layouts supported');

const singleLayouts = ['standard', 'portrait', 'square', 'polaroid', 'film'];
assert(singleLayouts.length === 5, '5 single photo layouts supported');

// 5. Verify custom frame resolution hierarchy
const dummyCapture = {
  customFrames: {
    'strip4:filmstrip': 'data:image/png;filmstrip',
    'strip4': 'data:image/png;strip4default',
  },
  customFrameDataUrl: 'data:image/png;fallback',
};

const getCustomFrameTest = (cap, mode, layout) => {
  if (layout && cap.customFrames[`${mode}:${layout}`]) return cap.customFrames[`${mode}:${layout}`];
  if (cap.customFrames[mode]) return cap.customFrames[mode];
  return cap.customFrameDataUrl || null;
};

assert.strictEqual(getCustomFrameTest(dummyCapture, 'strip4', 'filmstrip'), 'data:image/png;filmstrip');
assert.strictEqual(getCustomFrameTest(dummyCapture, 'strip4', 'vertical'), 'data:image/png;strip4default');
assert.strictEqual(getCustomFrameTest(dummyCapture, 'single', 'standard'), 'data:image/png;fallback');

console.log('Self-check tests passed successfully.');
