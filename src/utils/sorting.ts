// Roman numeral to number mapping
const ROMAN_MAP: Record<string, number> = {
  'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
  'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
  'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15,
};

// Extract Roman numeral from the start of an area name (e.g. "IX. Physical Plant")
function parseRomanPrefix(name: string): number {
  const cleaned = (name || '').trim();
  // Match leading Roman numeral followed by dot or space (e.g. "IX." or "IX ")
  const match = cleaned.match(/^([IVXLC]+)\./i);
  if (match) {
    return ROMAN_MAP[match[1].toLowerCase()] ?? 999;
  }
  // Fallback: try digit prefix
  const digitMatch = cleaned.match(/^(\d+)/);
  if (digitMatch) {
    return parseInt(digitMatch[1], 10);
  }
  return 999;
}

// Get the sort index for an area name
export function getAreaSortIndex(name: string): number {
  return parseRomanPrefix(name);
}

// Sort comparator for area objects with an `area` name field
export function sortAreasByNumber<T extends { area: string }>(a: T, b: T): number {
  return getAreaSortIndex(a.area) - getAreaSortIndex(b.area);
}
