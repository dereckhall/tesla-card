// Factory Tesla colors for the color picker — derived from models.json.
// `dir` maps to the image directory name under {model}/{variant}/.

import modelsData from '../models.json';

const colorMap = new Map();
for (const m of modelsData.models)
  for (const v of m.variants)
    for (const c of v.colors)
      if (!colorMap.has(c.id))
        colorMap.set(c.id, { name: c.name, dir: c.id, swatch: c.swatch });

export const FACTORY_COLORS = Array.from(colorMap.values());
