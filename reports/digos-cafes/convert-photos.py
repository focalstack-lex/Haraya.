"""
Converts the photos Lex drops into "Haraya Files/Haraya Coffee Spots/<Shop> Digos/" into web images for the app:
public/spots/<shop-slug>/photo-N.webp (WebP, quality 80, long side at most 1200 px, EXIF rotation applied, metadata
dropped). Green Coffee Digos is skipped (already integrated by hand). Re-running overwrites the outputs.

  python reports/digos-cafes/convert-photos.py
"""
import glob
import os
import re
import unicodedata

from PIL import Image, ImageOps

SOURCE = 'C:/Users/User/Pictures/Haraya Files/Haraya Coffee Spots'
OUT = 'public/spots'
EXTENSIONS = ('.jpg', '.jpeg', '.jfif', '.png', '.webp')
LONG_SIDE = 1200


def slug(name):
    ascii_name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', ascii_name.lower()).strip('-')


total = 0
for folder in sorted(glob.glob(SOURCE + '/*/')):
    name = os.path.basename(os.path.dirname(folder))
    if name == 'Green Coffee Digos':
        continue
    photos = sorted(f for f in glob.glob(folder + '*') if f.lower().endswith(EXTENSIONS))
    if not photos:
        continue
    target = os.path.join(OUT, slug(name))
    os.makedirs(target, exist_ok=True)
    for index, path in enumerate(photos, start=1):
        image = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
        image.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
        out = os.path.join(target, f'photo-{index}.webp')
        image.save(out, 'WEBP', quality=80, method=6)
        total += 1
        print(f'{name} -> {out.replace(os.sep, "/")}  {image.size[0]}x{image.size[1]}  {os.path.getsize(out) // 1024} KB')
print(total, 'images written')
