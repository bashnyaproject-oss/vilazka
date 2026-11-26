"""Create the scenic roads catalogue from downloaded ArcGIS and Overpass files."""
import argparse
from collections import defaultdict
from hashlib import sha1
import json
import math
from pathlib import Path
import re

ARCGIS = 'https://services7.arcgis.com/yiuFazTjHE8F5gzQ/arcgis/rest/services/America_s_Scenic_Highways_and_Byways_WFL1/FeatureServer'
CATEGORIES = {
    1: 'All-American Roads', 2: 'National Scenic Byway', 3: 'Parkway',
    4: 'National Forest Scenic Byway', 5: 'BLM Backcountry Byway', 6: 'Other Scenic Byway',
}

def distance(a, b):
    x, y = map(math.radians, a)
    u, v = map(math.radians, b)
    h = math.sin((y-v)/2)**2 + math.cos(y)*math.cos(v)*math.sin((x-u)/2)**2
    return 12742 * math.asin(math.sqrt(min(1, h)))

def length(path):
    return sum(distance(a, b) for a, b in zip(path, path[1:]))

def connected_paths(paths):
    remaining = dict(enumerate(paths))
    ends = defaultdict(set)
    for i, path in remaining.items():
        ends[path[0]].add(i)
        ends[path[-1]].add(i)
    def take(i):
        path = remaining.pop(i)
        ends[path[0]].discard(i)
        ends[path[-1]].discard(i)
        return path

    while remaining:
        chain = take(next(iter(remaining)))
        for reverse in (False, True):
            if reverse:
                chain.reverse()
            while len(ends[chain[-1]]) == 1:
                end = chain[-1]
                path = take(next(iter(ends[end])))
                if path[0] != end:
                    path.reverse()
                chain.extend(path[1:])
        yield chain

def simplify(path, max_points=130):
    # Preserve significant bends preferentially and always keep both ends.
    import heapq
    def span(a, b):
        x, y = path[a]
        dx, dy = path[b][0]-x, path[b][1]-y
        scale = math.cos(math.radians(y))
        dx *= scale
        norm = dx*dx+dy*dy
        def deviation(i):
            u, v = (path[i][0]-x)*scale, path[i][1]-y
            t = min(1, max(0, (u*dx+v*dy)/norm)) if norm else 0
            return (u-t*dx)**2+(v-t*dy)**2
        if b-a>1:
            i=max(range(a+1,b),key=deviation)
            heapq.heappush(heap,(-deviation(i),a,b,i))
    if len(path)<=max_points:
        return path
    heap=[]
    keep={0,len(path)-1}
    span(0,len(path)-1)
    while heap and len(keep)<max_points:
        _,a,b,i=heapq.heappop(heap)
        keep.add(i)
        span(a,i)
        span(i,b)
    return [path[i] for i in sorted(keep)]

def main(directory, output):
    groups = defaultdict(list)
    meta = {}
    def add(key, name, region, source, url, points):
        if not name or len(points)<2 or 'marine highway' in name.casefold():
            return
        path = [tuple(round(float(n),4) for n in p[:2]) for p in points]
        if any(abs(x)>180 or abs(y)>85 for x,y in path):
            return
        groups[key].append(path)
        meta.setdefault(key,(name,region,source,url))

    for file in sorted(directory.glob('arc*.json')):
        layer = int(re.match(r'arc(\d+)-',file.name)[1])
        for feature in json.loads(file.read_text()).get('features',[]):
            attr=feature['attributes']
            name=(attr.get('Byway_Name') or attr.get('Name') or '').strip()
            state=(attr.get('State') or '').strip()
            if not state or not name:
                continue
            key=('usa',state.casefold(),re.sub(r'[^\w]','',name.casefold()))
            for points in feature.get('geometry',{}).get('paths',[]):
                add(key,name,state+' · США',CATEGORIES[layer],f'{ARCGIS}/{layer}',points)

    extra_sources = {
        'wa': ('WSDOT Scenic Highways', 'https://data.wsdot.wa.gov/arcgis/rest/services/Shared/ScenicByways/MapServer/0'),
        'ky': ('Kentucky Transportation Cabinet', 'https://www.arcgis.com/home/item.html?id=6dc5e5627b00409a92af1dc97103bdab'),
        'scenic': ('Tipperary Scenic Routes GIS', 'https://www.arcgis.com/home/item.html?id=71b96f06c8f8465a94d4792ac0976ac0'),
    }
    for dataset, (source, url) in extra_sources.items():
        file = directory / (dataset+'-data.json')
        if not file.exists():
            continue
        for feature in json.loads(file.read_text()).get('features', []):
            a=feature['attributes']
            if dataset=='wa':
                if a['RouteType'] not in ('SR','US','IS'):
                    continue
                road=(a['RouteType']+' '+str(a['RouteID']).lstrip('0'))
                detail=(a.get('Description') or '').strip().title()
                region='Washington · США'
                name=road+' · '+detail if detail else road
                key=('wa',road)
            elif dataset=='ky':
                name=(a.get('ROAD') or '').strip().title()
                region='Kentucky · США'
                key=('usa','kentucky',re.sub(r'[^\w]','',name.casefold()))
            else:
                raw=a.get('Descriptio') or ''
                road=re.search(r'\b(?:R|N|M)\s?\d+\b',raw,re.I)
                code=road[0].replace(' ','').upper() if road else 'живописная дорога'
                name=f'Типперэри · {code} · участок {a["OBJECTID"]}'
                region='Типперэри · Ирландия'
                key=('ie',re.sub(r'[^\w]','',name.casefold()))
            for points in feature.get('geometry',{}).get('paths',[]):
                add(key,name,region,source,url,points)

    used_osm=set()
    for file in sorted([*directory.glob('map-*.json'),*directory.glob('osm-*.json')]):
        for way in json.loads(file.read_text()).get('elements',[]):
            tags=way.get('tags',{})
            identifier=way.get('id')
            points=[(p['lon'],p['lat']) for p in way.get('geometry',[])]
            if not identifier or identifier in used_osm or len(points)<2 or tags.get('access') in ('private','no') or tags.get('motor_vehicle') in ('private','no') or tags.get('highway') in ('footway','pedestrian','path','cycleway','steps','bridleway','service','track'):
                continue
            used_osm.add(identifier)
            name=tags.get('name','').strip()
            # Keep identically named roads in distant regions distinct.
            key=('osm',name.casefold(),round(points[0][0]/2),round(points[0][1]/2))
            add(key,name,'Швейцария' if file.name.startswith('map-ch') else '', '© OpenStreetMap contributors',f'https://www.openstreetmap.org/way/{identifier}',points)

    rows=[]
    for key, segments in groups.items():
        path=max(connected_paths(segments),key=length)
        km=round(length(path),1)
        if km<0.5:
            continue
        digest=sha1(repr(key).encode()).hexdigest()[:14]
        rows.append([f'drive-{digest}',*meta[key],km,simplify(path)])
    rows.sort(key=lambda r:(r[3].startswith('©'),-r[5],r[1]))
    # A named federal byway can appear in several state layers. Publish one representative line.
    seen_names=set()
    unique=[]
    for row in rows:
        name_key=re.sub(r'[^\w]','',row[1].casefold())
        if name_key in seen_names:
            continue
        seen_names.add(name_key)
        unique.append(row)
    priority=['All-American Roads','National Scenic Byway','National Forest Scenic Byway','Parkway']
    rows=sorted(unique,key=lambda r:(priority.index(r[3]) if r[3] in priority else len(priority),-r[5],r[1]))
    output.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n')
    print(len(rows))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('data',type=Path)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    main(args.data,args.output)
