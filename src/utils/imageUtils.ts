/// <reference types="vite/client" />

// Image helper utility for Vite / Vercel compatibility
// Eagerly imports all images in src/assets/images so Vite bundles them cleanly into dist/assets/

const imageModules = (import.meta as unknown as { glob: Function }).glob('/src/assets/images/*', { eager: true }) as Record<string, { default: string }>;

export function getImageUrl(pathOrFilename: string): string {
  if (!pathOrFilename) return '';

  // Extract pure filename e.g. "biotop_101_spray_clean_1786048941070.jpg"
  const filename = pathOrFilename.split('/').pop();
  if (!filename) return pathOrFilename;

  // Find matching file in Vite bundled image modules
  for (const key in imageModules) {
    if (key.endsWith('/' + filename)) {
      return imageModules[key].default;
    }
  }

  // Fallback to provided path
  return pathOrFilename;
}
