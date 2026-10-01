import { describe, it, expect } from 'vitest';
import {
  TESLA_MODELS,
  getVariantColors,
  variantHasImages,
  getVariants,
} from '../src/models.js';

// ── TESLA_MODELS structure ──────────────────────────────────────────────────

describe('TESLA_MODELS', () => {
  it('is an array of models', () => {
    expect(Array.isArray(TESLA_MODELS)).toBe(true);
    expect(TESLA_MODELS.length).toBeGreaterThan(0);
  });

  it('each model has id, name, and variants', () => {
    for (const model of TESLA_MODELS) {
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('variants');
      expect(Array.isArray(model.variants)).toBe(true);
    }
  });

  it('each variant has id, label, and colors array', () => {
    for (const model of TESLA_MODELS) {
      for (const variant of model.variants) {
        expect(variant).toHaveProperty('id');
        expect(variant).toHaveProperty('label');
        expect(variant).toHaveProperty('colors');
        expect(Array.isArray(variant.colors)).toBe(true);
      }
    }
  });

  it('every variant colors array includes "neutral"', () => {
    for (const model of TESLA_MODELS) {
      for (const variant of model.variants) {
        expect(variant.colors).toContain('neutral');
      }
    }
  });

  it('contains Model 3', () => {
    const m3 = TESLA_MODELS.find(m => m.id === '3');
    expect(m3).toBeDefined();
    expect(m3.name).toBe('Model 3');
  });

  it('Model 3 has at least one variant', () => {
    const m3 = TESLA_MODELS.find(m => m.id === '3');
    expect(m3.variants.length).toBeGreaterThan(0);
  });
});

// ── getVariantColors() ─────────────────────────────────────────────────────

describe('getVariantColors', () => {
  it('returns colors for a known model+variant', () => {
    const colors = getVariantColors('3', '3.1');
    expect(Array.isArray(colors)).toBe(true);
    expect(colors).toContain('neutral');
  });

  it('includes non-neutral colors with images for Model 3 3.1', () => {
    const colors = getVariantColors('3', '3.1');
    expect(colors.length).toBeGreaterThan(1);
    expect(colors).toContain('red_multi_coat');
  });

  it('returns ["neutral"] for unknown model', () => {
    expect(getVariantColors('UNKNOWN', '1.0')).toEqual(['neutral']);
  });

  it('returns ["neutral"] for unknown variant of known model', () => {
    expect(getVariantColors('3', 'UNKNOWN')).toEqual(['neutral']);
  });
});

// ── variantHasImages() ──────────────────────────────────────────────────────

describe('variantHasImages', () => {
  it('returns true for a known variant', () => {
    expect(variantHasImages('3', '3.1')).toBe(true);
  });

  it('returns false for unknown model', () => {
    expect(variantHasImages('UNKNOWN', '1.0')).toBe(false);
  });

  it('returns false for unknown variant of known model', () => {
    expect(variantHasImages('3', 'UNKNOWN')).toBe(false);
  });
});

// ── getVariants() ───────────────────────────────────────────────────────────

describe('getVariants', () => {
  it('returns variants for a known model', () => {
    const variants = getVariants('3');
    expect(Array.isArray(variants)).toBe(true);
    expect(variants.length).toBeGreaterThan(0);
    expect(variants[0]).toHaveProperty('id');
    expect(variants[0]).toHaveProperty('label');
  });

  it('returns empty array for unknown model', () => {
    expect(getVariants('UNKNOWN')).toEqual([]);
  });
});
