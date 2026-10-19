import { FilterName } from '../types';

export const CSS_FILTERS: Record<FilterName, string> = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(100%)',
  vintage: 'sepia(50%) contrast(120%) brightness(90%)',
  cool: 'hue-rotate(180deg) saturate(80%)',
  warm: 'sepia(30%) saturate(140%)',
  noir: 'grayscale(100%) contrast(160%)',
  invert: 'invert(100%)',
};
