import { describe, expect, it } from 'vitest';
import { IMPORT_TEMPLATE, parseCsv, parseImport } from './placeImport';

describe('parseCsv', () => {
  it('handles quoted commas, doubled quotes and blank lines', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['1', '2'],
    ]);
  });

  it('reads Windows line endings and a byte order mark', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('parseImport', () => {
  it('turns the template into one listing with the same hours every day', () => {
    const { listings, problems } = parseImport(IMPORT_TEMPLATE);
    expect(problems).toEqual([]);
    expect(listings).toHaveLength(1);
    expect(listings[0]).toMatchObject({
      name: 'Example Cafe',
      city: 'Davao City',
      district: 'Poblacion',
      address: '123 Example Street, Davao City',
      lat: 7.07,
      lng: 125.61,
      priceLevel: 2,
      amenities: ['fastWifi', 'plugs', 'aircon'],
      wifiMbps: 50,
    });
    expect(listings[0].hours.Monday).toEqual({ open: '08:00', close: '22:00' });
    expect(listings[0].hours.Sunday).toEqual({ open: '08:00', close: '22:00' });
  });

  it('asks for the required columns', () => {
    expect(parseImport('name,city\nA,Davao City').problems[0]).toContain('Missing: district, lat, lng');
  });

  it('leaves out bad rows and says why, keeping the good ones', () => {
    const sheet = [
      'name,city,district,address,lat,lng',
      'Good Place,Digos City,Digos,Rizal Avenue,6.75,125.35',
      'Wrong City,Manila,Digos,Rizal Avenue,6.75,125.35',
      'No Pin,Digos City,Digos,Rizal Avenue,,',
      'Far Away,Digos City,Digos,Rizal Avenue,14.6,121.0',
      'Good Place,Digos City,Digos,Rizal Avenue,6.75,125.35',
    ].join('\n');
    const { listings, problems } = parseImport(sheet);
    expect(listings.map((listing) => listing.name)).toEqual(['Good Place']);
    expect(problems).toHaveLength(4);
    expect(problems[0]).toContain('Row 3');
    expect(problems[0]).toContain('not a city');
    expect(problems[1]).toContain('lat and lng');
    expect(problems[2]).toContain('outside the Davao Region');
    expect(problems[3]).toContain('twice');
  });

  it('rejects an unknown amenity and half-given hours', () => {
    const sheet = [
      'name,city,district,address,lat,lng,amenities,opens,closes',
      'A Place,Digos City,Digos,Rizal Avenue,6.75,125.35,jacuzzi,,',
      'B Place,Digos City,Digos,Rizal Avenue,6.76,125.35,,08:00,',
    ].join('\n');
    const { listings, problems } = parseImport(sheet);
    expect(listings).toEqual([]);
    expect(problems[0]).toContain('not an amenity');
    expect(problems[1]).toContain('both opens and closes');
  });
});
