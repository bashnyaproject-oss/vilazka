"""Find reusable Commons photographs along stored scenic road traces."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import html
import json
import math
from pathlib import Path
import re
import subprocess
from urllib.parse import urlencode

ROAD = re.compile(r'\b(road|highway|parkway|byway|freeway|route|street|pass|overlook|bridge|viaduct|scenic|switchback|vista|viewpoint|gorge|canyon|river|lake|mountain|falls|coast|valley|forest|beach|cliff|fjord|strasse|stra[ßs]e|rue|chemin|passe|passo|carretera)\b', re.I)
EXCLUDE = re.compile(r'\b(flag|logo|map|shield|sign|portrait|church|school|house|residence|interior|museum|headstone|cemetery|post office|gas station|parking lot|aerial|satellite|diagram|marker|guard station|emblem|oldsmobile|cruiser|wagon|car show|farm|automobile|motorcycle|accident|wreck|pass on the right|welcome to|street scene|kathy at)\b',re.I)
FREE = re.compile(r'^(?:CC BY(?:-SA)?\b|CC0\b|Public domain\b|PDM\b)',re.I)

def distance_to_line(x,y,line):
    scale=111.2*math.cos(math.radians(y))
    best=math.inf
    for (a,b),(c,d) in zip(line,line[1:]):
        vx,vy=(c-a)*scale,(d-b)*111.2
        ox,oy=(x-a)*scale,(y-b)*111.2
        norm=vx*vx+vy*vy
        t=max(0,min(1,(vx*ox+vy*oy)/norm)) if norm else 0
        best=min(best,math.hypot(ox-t*vx,oy-t*vy))
    return best

def fetch_candidates(x,y):
    params={'action':'query','generator':'geosearch','ggscoord':f'{y:.4f}|{x:.4f}',
            'ggsradius':2600,'ggsnamespace':6,'ggslimit':40,'prop':'imageinfo|coordinates',
            'iiprop':'url|size|mime|extmetadata','iiextmetadatafilter':'LicenseShortName|Artist',
            'iiurlwidth':640,'format':'json','formatversion':2,'maxlag':5}
    try:
        body=subprocess.check_output(['curl','-fsSL','--max-time','11','-A','VilazkaScenicRoads/1.0 (https://github.com/bashnyaproject-oss/vilazka)','https://commons.wikimedia.org/w/api.php?'+urlencode(params)],stderr=subprocess.DEVNULL)
        return json.loads(body).get('query',{}).get('pages',[])
    except (subprocess.CalledProcessError,ValueError):
        return []

def find(row):
    _,name,*_,line=row
    # Try two spaced locations so a dry midpoint does not rule out a good cover.
    for i in dict.fromkeys([len(line)//2,len(line)//4,3*len(line)//4]):
        candidates=[]
        for p in fetch_candidates(*line[i]):
            title=p.get('title','').replace('_',' ')
            images=p.get('imageinfo',[])
            coords=p.get('coordinates',[])
            if not images or not coords or not ROAD.search(title) or EXCLUDE.search(title):
                continue
            im=images[0]
            metadata=im.get('extmetadata',{})
            license=metadata.get('LicenseShortName',{}).get('value','')
            if not FREE.search(license) or im.get('mime') not in ('image/jpeg','image/webp') or im.get('width',0)<640 or im.get('height',0)<320 or im['width']<im['height']*1.17:
                continue
            distance=distance_to_line(coords[0]['lon'],coords[0]['lat'],line)
            if distance>.4 or not im.get('thumburl') or not im.get('descriptionurl'):
                continue
            author=html.unescape(re.sub(r'<[^>]+>','',metadata.get('Artist',{}).get('value',''))).strip()
            if license.upper().startswith('CC BY') and not author:
                continue
            candidates.append((distance,[im['thumburl'],im['descriptionurl'],license,author[:160],round(distance*1000)]))
        if candidates:
            return name.casefold(),min(candidates,key=lambda c:c[0])[1]
    return None

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--limit',type=int,default=250)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]/'dist/assets'
    roads=json.loads((root/'world-scenic-roads.json').read_text())
    destination=root/'nearby-road-photos.json'
    covers=json.loads(destination.read_text()) if destination.exists() else {}
    direct=json.loads((root/'byway-photos.json').read_text())
    used={photo[1] for photo in [*covers.values(),*direct.values()]}
    remaining=[r for r in roads if r[1].casefold() not in covers and r[1].casefold() not in direct]
    with ThreadPoolExecutor(6) as pool:
        for f in as_completed([pool.submit(find,row) for row in remaining[:args.limit]]):
            result=f.result()
            if not result or result[1][1] in used:
                continue
            name,photo=result
            covers[name]=photo
            used.add(photo[1])
            temporary=destination.with_suffix('.tmp')
            temporary.write_text(json.dumps(dict(sorted(covers.items())),ensure_ascii=False,indent=1)+'\n')
            temporary.replace(destination)
            print(len(covers),name,flush=True)

if __name__=='__main__':
    main()
