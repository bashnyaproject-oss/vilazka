"""Validate photo batches and refresh the published covers and coverage report."""
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / 'dist/assets/road-photos'
REPORT = ROOT / 'research/scenic-road-photo-coverage.csv'


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main():
    index = read_json(PHOTOS / 'index.json')
    galleries = {}
    for path in sorted(PHOTOS.glob('batch-*.json')):
        batch = int(path.stem.split('-')[1])
        for road, photos in read_json(path).items():
            if index.get(road) != batch or road in galleries:
                raise ValueError(f'{road}: incorrect photo batch')
            if not photos:
                continue
            if len(photos) > 5 or len({photo[1] for photo in photos}) != len(photos):
                raise ValueError(f'{road}: too many or repeated images')
            for url, source, license, author, distance in photos:
                if not all(value.startswith('https://') for value in (url, source)) or not license:
                    raise ValueError(f'{road}: missing HTTPS URL or license')
            galleries[road] = photos

    with REPORT.open(encoding='utf-8', newline='') as stream:
        reader = csv.DictReader(stream)
        fields = reader.fieldnames
        rows = list(reader)
    if len(rows) != len(index) or {row['route_id'] for row in rows} != set(index):
        raise ValueError('Coverage report and current route index differ')

    for row in rows:
        photos = galleries.get(row['route_id'], [])
        row['photo_count'] = len(photos)
        for position in range(5):
            row[f'photo_{position + 1}_source'] = photos[position][1] if position < len(photos) else ''

    previous = read_json(PHOTOS / 'covers.json')
    covers = {road: galleries[road][0] for road in previous if road in galleries}
    for road, photos in galleries.items():
        covers.setdefault(road, photos[0])
    (PHOTOS / 'covers.json').write_text(
        json.dumps(covers, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    with REPORT.open('w', encoding='utf-8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    full = sum(len(photos) >= 4 for photos in galleries.values())
    print(f'{len(index)} routes, {len(galleries)} with galleries, {full} with 4–5 photos, '
          f'{sum(map(len, galleries.values()))} photos')


if __name__ == '__main__':
    main()
