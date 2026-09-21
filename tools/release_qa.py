#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import re, sys, subprocess
ROOT=Path(__file__).resolve().parents[1]
IGNORE_PREFIX=('http://','https://','mailto:','tel:','javascript:','#','data:','blob:')
class P(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]; self.links=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.append(d['id'])
        for k in ('href','src'):
            if d.get(k):self.links.append(d[k])

def local_target(page,link):
    link=link.split('#',1)[0].split('?',1)[0]
    if not link or link.startswith(IGNORE_PREFIX): return None
    if link == '/': return ROOT/'index-self-contained.html'
    if link.startswith('/'):
        t=ROOT/link.lstrip('/')
    else:t=(page.parent/link).resolve()
    if str(t).endswith('/') or (t.exists() and t.is_dir()): t=t/'index.html'
    return t

htmls=[p for p in ROOT.rglob('*.html') if 'archive' not in p.parts]
missing=[]; duplicates=[]
for page in htmls:
    p=P()
    try:p.feed(page.read_text(errors='ignore'))
    except Exception as e: missing.append((page.relative_to(ROOT),f'parse:{e}')); continue
    seen=set(); dup=set()
    for i in p.ids:
        if i in seen:dup.add(i)
        seen.add(i)
    if dup:duplicates.append((page.relative_to(ROOT),sorted(dup)))
    for link in p.links:
        t=local_target(page,link)
        if t and not t.exists():missing.append((page.relative_to(ROOT),link))

js=list((ROOT/'server').rglob('*.js'))
js_bad=[]
for f in js:
    r=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
    if r.returncode:js_bad.append((f.relative_to(ROOT),r.stderr.strip()))

staff=list((ROOT/'staff').glob('*.html'))
prod=(ROOT/'index-self-contained.html').read_text(errors='ignore')
m=re.search(r'<script[^>]+id=["\']v80-preview-data["\'][^>]*>(.*?)</script>',prod,re.I|re.S)
embedded_staff=bool(m and re.search(r'["\']staff/',m.group(1),re.I))
print(f'HTML files: {len(htmls)}')
print(f'Staff HTML pages: {len(staff)}')
print(f'Missing local links/assets: {len(missing)}')
print(f'Duplicate-ID pages: {len(duplicates)}')
print(f'Server JS syntax failures: {len(js_bad)}')
print(f'Production homepage staff preview detected: {embedded_staff}')
if missing:
    print('\nMissing:')
    for x in missing[:50]:print(' -',x[0],'=>',x[1])
if duplicates:
    print('\nDuplicate IDs:')
    for x in duplicates:print(' -',x[0],x[1])
if js_bad:
    print('\nJS failures:')
    for x in js_bad:print(' -',x[0],x[1])
failed=bool(missing or duplicates or js_bad or embedded_staff)
print('\nRESULT:', 'FAIL' if failed else 'PASS')
sys.exit(1 if failed else 0)
