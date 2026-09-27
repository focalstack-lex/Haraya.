/** Distance and directions helpers for the coffee map and trails. */

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Great-circle distance in kilometers between two points. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Human "1.2 km" formatting. */
export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Total trail length across ordered stops. */
export function trailLengthKm(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceKm(points[i - 1], points[i]);
  return total;
}

/** Walking estimate at an easy 12 minutes per kilometer, rounded up to 5 minutes. */
export function walkMinutes(km: number): number {
  return Math.max(5, Math.ceil((km * 12) / 5) * 5);
}

/** Google Maps directions URL between a start and an optional ordered stop list. */
export function directionsUrl(stops: GeoPoint[]): string {
  const [first, ...rest] = stops;
  const params = new URLSearchParams();
  params.set('api', '1');
  params.set('destination', `${first.lat},${first.lng}`);
  if (rest.length > 0) {
    params.set('travelmode', 'walking');
    params.set('waypoints', rest.slice(0, -1).map((p) => `${p.lat},${p.lng}`).join('|'));
    params.set('destination', `${rest[rest.length - 1].lat},${rest[rest.length - 1].lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
