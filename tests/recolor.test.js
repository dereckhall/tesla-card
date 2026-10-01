import { describe, it, expect } from 'vitest';
import { FACTORY_COLORS } from '../src/recolor.js';

describe('FACTORY_COLORS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(FACTORY_COLORS)).toBe(true);
    expect(FACTORY_COLORS.length).toBeGreaterThan(0);
  });

  it('each color has name, dir, and swatch', () => {
    for (const color of FACTORY_COLORS) {
      expect(color).toHaveProperty('name');
      expect(color).toHaveProperty('dir');
      expect(color).toHaveProperty('swatch');
      expect(typeof color.name).toBe('string');
      expect(typeof color.dir).toBe('string');
      expect(typeof color.swatch).toBe('string');
    }
  });

  it('swatch values look like hex colors', () => {
    for (const color of FACTORY_COLORS) {
      expect(color.swatch).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has no duplicate dir values', () => {
    const dirs = FACTORY_COLORS.map(c => c.dir);
    expect(new Set(dirs).size).toBe(dirs.length);
  });

  it('contains red_multi_coat', () => {
    const red = FACTORY_COLORS.find(c => c.dir === 'red_multi_coat');
    expect(red).toBeDefined();
    expect(red.name).toBe('Red Multi-Coat');
  });
});
