"""
Decodes the short Google plus code printed on a Maps listing (for example Q85W+9P2) into latitude and longitude,
using Digos City's center to recover the missing leading characters. Use it to place a spot exactly.

  python reports/digos-cafes/decode-plus-code.py Q85W+9P2 [more codes]

Sanity check: Q83X+6G4 (Cafe Vicente) decodes to 6.753013, 125.348828, within 1 m of its OpenStreetMap node.
"""
import sys

ALPHA = '23456789CFGHJMPQRVWX'
REFERENCE = (6.7497, 125.3572)


def encode_prefix(lat, lng):
    lat = min(max(lat, -90), 90 - 1e-9) + 90
    lng = (lng + 180) % 360
    out, res = '', 20.0
    for _ in range(4):
        a, b = int(lat // res), int(lng // res)
        out += ALPHA[a] + ALPHA[b]
        lat -= a * res
        lng -= b * res
        res /= 20
    return out


def decode_full(code):
    chars = code.replace('+', '')
    lat, lng, res = -90.0, -180.0, 20.0
    for i in range(0, 10, 2):
        lat += ALPHA.index(chars[i]) * res
        lng += ALPHA.index(chars[i + 1]) * res
        if i < 8:
            res /= 20
    lat_res = lng_res = res
    if len(chars) > 10:
        idx = ALPHA.index(chars[10])
        lat_res, lng_res = res / 5, res / 4
        lat += (idx // 4) * lat_res
        lng += (idx % 4) * lng_res
    return lat + lat_res / 2, lng + lng_res / 2


def recover(short):
    missing = 8 - short.index('+')
    return decode_full(encode_prefix(*REFERENCE)[:missing] + short)


for code in sys.argv[1:]:
    lat, lng = recover(code.strip().upper())
    print(f'{code}: {lat:.6f}, {lng:.6f}')
