/// <reference types="vite/client" />

// Eagerly glob all images in src/assets/images/ so Vite bundles them cleanly for production builds
const modules1 = import.meta.glob('/src/assets/images/*', { eager: true }) as Record<string, any>;
const modules2 = import.meta.glob('../assets/images/*', { eager: true }) as Record<string, any>;

const allModules: Record<string, any> = { ...modules1, ...modules2 };

export function getImageUrl(pathOrFilename: string): string {
  if (!pathOrFilename) return '';

  // Extract pure filename e.g. "hero.png"
  const filename = pathOrFilename.split('/').pop() || pathOrFilename;

  // Search in bundled Vite modules
  for (const key in allModules) {
    if (key.endsWith('/' + filename)) {
      const mod = allModules[key];
      if (typeof mod === 'string' && mod.length > 0) {
        return mod;
      }
      if (mod && typeof mod === 'object' && typeof mod.default === 'string' && mod.default.length > 0) {
        return mod.default;
      }
    }
  }

  // Fallback to static public folder URL using base URL so it works on GitHub Pages subpaths
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}assets/images/${filename}`;
}

