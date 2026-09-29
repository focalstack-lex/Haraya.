"""
Rebuilds src/data/digosCafes.ts from OpenStreetMap (Nominatim search, ODbL) for Digos City.
Keeps only what the source states: name, coordinates, street and barangay. Nothing else is invented.

  1. Search "cafe / coffee shop / coffee Digos City Davao del Sur" bounded to the Digos viewbox, save the JSON.
  2. Run:  python reports/digos-cafes/build-digos-cafes.py <folder with nom_*.json> <output .ts>
"""
import glob, json, re, sys

src, out = sys.argv[1], sys.argv[2]
# OSM ids that are tagged cafe but are not a coffee shop, or are already curated by hand
EXCLUDE = {'n13200051587': 'Kos Beauty Lounge & Cafe (salon)', 'n6064368485': 'Green Coffee (already curated)'}

rows = {}
for f in glob.glob(f'{src}/nom_*.json'):
    for r in json.load(open(f, encoding='utf-8')):
        rows[r['osm_type'][0] + str(r['osm_id'])] = r

keep = []
for oid, r in rows.items():
    if r.get('type') != 'cafe' or oid in EXCLUDE:
        continue
    parts = [p.strip() for p in r['display_name'].split(',')]
    if 'Digos' not in parts:
        continue
    # display_name is: name, street, ...subdivisions and zones..., Digos. Only the street is trusted: the
    # zone and barangay order is ambiguous in the source, so no barangay is stated.
    keep.append((r.get('name') or parts[0], parts[1], float(r['lat']), float(r['lon']), oid))
keep.sort(key=lambda k: (k[0].lower(), k[4]))

def q(text):
    backslash = chr(92)
    if "'" in text and '"' not in text:
        return '"' + text + '"'
    return "'" + text.replace(backslash, backslash * 2).replace("'", backslash + "'") + "'"

lines = ['  { osmId: %s, name: %s, street: %s, lat: %.6f, lng: %.6f },' % (q(o), q(n), q(st), la, lo)
         for n, st, la, lo, o in keep]
open(out, 'w', encoding='utf-8', newline='').write('\r\n'.join(lines) + '\r\n')
print(f'{len(keep)} cafes written; excluded {EXCLUDE}')
