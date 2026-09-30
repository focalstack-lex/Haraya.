import { AMENITY_LABELS, DAVAO_CITIES, DAVAO_DISTRICTS, type AmenityKey, type District } from '../types/coffee';
import { WEEKDAY_ORDER } from '../utils/weekdays';
import { emptyListing, validateListing, type City, type ListingInput } from './placeMapping';

/**
 * Bulk import for the Control Room: a sheet saved as CSV becomes a list of listings to review before they
 * are added. Nothing is guessed: an unknown city or area, a missing pin or a bad time is reported against
 * its row and the row is left out.
 */

export const IMPORT_COLUMNS = [
  'name',
  'city',
  'district',
  'address',
  'lat',
  'lng',
  'description',
  'signature',
  'price_level',
  'amenities',
  'opens',
  'closes',
  'wifi_mbps',
] as const;

export const IMPORT_LIMIT = 200;

export const IMPORT_TEMPLATE = `${IMPORT_COLUMNS.join(',')}
Example Cafe,Davao City,Poblacion,"123 Example Street, Davao City",7.0700,125.6100,Short description,House latte,2,fastWifi;plugs;aircon,08:00,22:00,50`;

export interface ImportResult {
  listings: ListingInput[];
  /** One line per row that was left out, with the sheet's row number. */
  problems: string[];
}

/** Splits CSV text into rows of cells. Handles quoted cells, doubled quotes and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^﻿/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''));
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const isCity = (value: string): value is City => value !== 'All Davao Region' && (DAVAO_CITIES as readonly string[]).includes(value);
const isDistrict = (value: string): value is District => (DAVAO_DISTRICTS as readonly string[]).includes(value);
const isAmenity = (value: string): value is AmenityKey => value in AMENITY_LABELS;

/** Turns the pasted sheet into listings. The first row must be the column names; their order is free. */
export function parseImport(text: string): ImportResult {
  const rows = parseCsv(text);
  if (rows.length === 0) return { listings: [], problems: ['The sheet is empty.'] };

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const missing = ['name', 'city', 'district', 'lat', 'lng'].filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return { listings: [], problems: [`The first row must name the columns. Missing: ${missing.join(', ')}.`] };
  }
  const body = rows.slice(1);
  if (body.length > IMPORT_LIMIT) {
    return { listings: [], problems: [`Import up to ${IMPORT_LIMIT} places at a time. This sheet has ${body.length}.`] };
  }

  const listings: ListingInput[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();

  body.forEach((cells, offset) => {
    const rowNumber = offset + 2;
    const get = (column: string) => (cells[header.indexOf(column)] ?? '').trim();
    const fail = (reason: string) => problems.push(`Row ${rowNumber} (${get('name') || 'no name'}): ${reason}`);

    const city = get('city');
    const district = get('district');
    if (!isCity(city)) return fail(`"${city}" is not a city Haraya covers.`);
    if (!isDistrict(district)) return fail(`"${district}" is not a known area. Use one of: ${DAVAO_DISTRICTS.join(', ')}.`);

    const lat = Number(get('lat'));
    const lng = Number(get('lng'));
    if (get('lat') === '' || get('lng') === '' || !Number.isFinite(lat) || !Number.isFinite(lng)) return fail('lat and lng must be numbers.');

    const amenityCells = get('amenities')
      .split(/[;|]/)
      .map((value) => value.trim())
      .filter(Boolean);
    const unknownAmenity = amenityCells.find((value) => !isAmenity(value));
    if (unknownAmenity) return fail(`"${unknownAmenity}" is not an amenity. Use: ${Object.keys(AMENITY_LABELS).join(', ')}.`);

    const opens = get('opens');
    const closes = get('closes');
    if ((opens === '') !== (closes === '')) return fail('give both opens and closes, or leave both empty.');
    if (opens && (!TIME.test(opens) || !TIME.test(closes))) return fail('opens and closes use 24-hour time, like 08:00 and 22:00.');

    const priceCell = get('price_level');
    const price = priceCell === '' ? 2 : Number(priceCell);
    if (price !== 1 && price !== 2 && price !== 3) return fail('price_level is 1, 2 or 3.');

    const wifi = get('wifi_mbps') === '' ? 0 : Number(get('wifi_mbps'));

    const listing: ListingInput = {
      ...emptyListing(),
      name: get('name'),
      city,
      district,
      address: get('address'),
      lat,
      lng,
      description: get('description'),
      signature: get('signature'),
      priceLevel: price,
      amenities: amenityCells.filter(isAmenity),
      wifiMbps: wifi,
    };
    if (opens) {
      for (const day of WEEKDAY_ORDER) listing.hours[day] = { open: opens, close: closes };
    }

    const problem = validateListing(listing);
    if (problem) return fail(problem);

    const key = `${listing.name.trim().toLowerCase()}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(key)) return fail('this place appears twice in the sheet.');
    seen.add(key);
    listings.push(listing);
  });

  return { listings, problems };
}
