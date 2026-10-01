// Tesla model definitions — derived from models.json (single source of truth).
// `colors`: array of image directory names available for this variant (picker shows these).
// `factoryColors`: full catalog from models.json (used by uploader and color picker).

import modelsData from '../models.json';

export const TESLA_MODELS = modelsData.models.map(m => ({
  id: m.id,
  name: m.name,
  variants: m.variants.map(v => ({
    id: v.id,
    label: v.label,
    colors: ['neutral', ...v.colors.filter(c => c.hasImages).map(c => c.id)],
    factoryColors: v.colors,
  })),
}));

/**
 * Get the list of available color directories for a model + variant.
 */
export function getVariantColors(modelId, variantId) {
  const model = TESLA_MODELS.find(m => m.id === modelId);
  if (!model) return ['neutral'];
  const variant = model.variants.find(v => v.id === variantId);
  return variant?.colors ?? ['neutral'];
}

/**
 * Check if a variant has images (more than just neutral).
 */
export function variantHasImages(modelId, variantId) {
  const model = TESLA_MODELS.find(m => m.id === modelId);
  if (!model) return false;
  return model.variants.some(v => v.id === variantId);
}

/**
 * Get variants for a given model ID.
 */
export function getVariants(modelId) {
  const model = TESLA_MODELS.find(m => m.id === modelId);
  return model?.variants ?? [];
}
