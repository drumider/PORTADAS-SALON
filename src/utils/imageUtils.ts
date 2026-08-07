/// <reference types="vite/client" />

// Eagerly glob all images in src/assets/images/ so Vite bundles them cleanly for production builds
const modules1 = (import.meta as unknown as { glob: Function }).glob('/src/assets/images/*', { eager: true }) as Record<string, any>;
const modules2 = (import.meta as unknown as { glob: Function }).glob('../assets/images/*', { eager: true }) as Record<string, any>;

const allModules: Record<string, any> = { ...modules1, ...modules2 };

export function getImageUrl(pathOrFilename: string): string {
  if (!pathOrFilename) return '';

  // Extract pure filename e.g. "biotop_101_spray_clean_1786048941070.jpg"
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

  // Fallback to static public folder URL
  return `/assets/images/${filename}`;
}

