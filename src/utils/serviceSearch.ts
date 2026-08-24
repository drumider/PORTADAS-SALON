import { Service } from '../types';

/**
 * Normalizes text removing diacritics / accents and lowercasing
 */
export const normalizeSearchText = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Scores how closely a service matches a query.
 * Higher score = closer match (closer to start of words/string, exact prefixes, etc.)
 */
export const scoreServiceMatch = (service: Service, rawQuery: string): number => {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 100;

  const nameNorm = normalizeSearchText(service.name);
  const codeNorm = normalizeSearchText(service.code || service.id || '');
  const catNorm = normalizeSearchText(service.category || '');
  const descNorm = normalizeSearchText(service.description || '');

  // 1. Exact match on Code / ID
  if (codeNorm === query) return 1000;
  if (codeNorm.startsWith(query)) return 800;

  // 2. Exact match on Name
  if (nameNorm === query) return 900;

  // 3. Name starts with the query (e.g., query "k" -> "Keratina...", "c" -> "Corte...")
  if (nameNorm.startsWith(query)) return 700;

  // 4. Any word in the service name starts with the query (e.g., query "keratina" -> "Aplicacion Keratina")
  const words = nameNorm.split(/\s+/);
  const wordStartIndex = words.findIndex(w => w.startsWith(query));
  if (wordStartIndex !== -1) {
    return 600 - (wordStartIndex * 20); // earlier word in the name gets higher priority
  }

  // 5. Special phonetic/synonym alias boost (e.g., "keratina" vs "queratina", "blower" vs "secado")
  if ((query.startsWith('k') || query.startsWith('q')) && (nameNorm.includes('keratina') || nameNorm.includes('queratina') || nameNorm.includes('alisado') || nameNorm.includes('botox'))) {
    if (nameNorm.includes('keratina') || nameNorm.includes('queratina')) return 550;
  }

  // 6. Name contains query anywhere
  const nameIndex = nameNorm.indexOf(query);
  if (nameIndex !== -1) {
    return 400 - Math.min(nameIndex, 100);
  }

  // 7. Category starts with or contains query
  if (catNorm.startsWith(query)) return 300;
  if (catNorm.includes(query)) return 250;

  // 8. Description words match
  if (descNorm.includes(query)) return 150;

  // 9. Multi-token partial match (all query tokens found in name/category/desc)
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every(t => 
      nameNorm.includes(t) || codeNorm.includes(t) || catNorm.includes(t) || descNorm.includes(t)
    );
    if (allTokensMatch) return 350;
  }

  return 0; // No match
};

/**
 * Filter and sort services with closest matches at the very top.
 */
export const searchAndRankServices = (services: Service[], query: string, categoryFilter: string = 'Todos'): Service[] => {
  const trimmed = query.trim();

  // First filter by category if specified
  const pool = categoryFilter === 'Todos'
    ? services
    : services.filter(s => s.category === categoryFilter);

  if (!trimmed) {
    return pool;
  }

  const scored = pool
    .map(service => ({
      service,
      score: scoreServiceMatch(service, trimmed)
    }))
    .filter(item => item.score > 0);

  // Sort by highest score first, then alphabetically
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.service.name.localeCompare(b.service.name);
  });

  return scored.map(item => item.service);
};
