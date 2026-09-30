import { AMENITY_LABELS, type Cafe } from '../../types/coffee';

/** Lowercase, and "Wi-Fi" reads the same as "wifi". */
const normalize = (value: string) => value.toLowerCase().replace(/-/g, '');

/** Words that carry no meaning in a search like "quiet cafe in Digos". */
const FILLER = new Set(['in', 'at', 'near', 'the', 'a', 'with', 'and', 'cafe', 'cafes', 'coffee', 'spot', 'spots']);

const searchText = (cafe: Cafe) =>
  normalize(
    [
      cafe.name,
      cafe.district,
      cafe.city,
      cafe.signature,
      cafe.address,
      cafe.community?.tip ?? '',
      ...cafe.vibeTags,
      ...cafe.amenities.map((key) => AMENITY_LABELS[key]),
    ].join(' ')
  );

/**
 * True when every word of the query is found somewhere on the spot, so "digos wifi" finds Digos spots
 * with Wi-Fi. The whole phrase still matches on its own, so a name like "The Coffee Spot" is found.
 */
export function matchesSearch(cafe: Cafe, query: string): boolean {
  const phrase = normalize(query.trim());
  if (!phrase) return true;
  const text = searchText(cafe);
  if (text.includes(phrase)) return true;
  const words = phrase.split(/\s+/).filter((word) => !FILLER.has(word));
  return words.length > 0 && words.every((word) => text.includes(word));
}
