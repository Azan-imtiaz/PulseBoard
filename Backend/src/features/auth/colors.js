// Muted hues that stay legible on both light and dark backgrounds.
const PALETTE = [
  '#E5484D',
  '#F76B15',
  '#FFB224',
  '#46A758',
  '#12A594',
  '#0090FF',
  '#3E63DD',
  '#8E4EC6',
  '#D6409F',
  '#978365',
];

export function colorFor(seed) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
