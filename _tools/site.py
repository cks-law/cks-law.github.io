import re,json,glob,html,sys
sys.path.insert(0,'/home/claude/cks-law.github.io/_tools')
from areas_data import NEW,AREAS
R='/home/claude/cks-law.github.io/'
O=open('/home/claude/cks-law.github.io/_tools/index_orig.html',encoding='utf-8').read()
COLS=json.load(open('/home/claude/cks-law.github.io/_tools/columns.json',encoding='utf-8'))
TEL='02-6011-0523'; HREF='tel:0260110523'
# --- pieces from original index
head=O[:O.index('<body')]
a=O.index('<div class="intake" id="intake"'); b=O.index('<div class="step" id="in-s3" hidden><div class="done" id="in-done"></div></div>')
b=O.index('</div>',b+90)+len('</div>')  # closes .intake
INTAKE=O[a:b]
foot=O[O.index('<footer>'):O.index('</footer>')+len('</footer>')]
def sec(id_):
    s=O.index(f'<section class="sec" id="{id_}">'); return O[s:O.index('</section>',s)+len('</section>')]
closing=O[O.index('<section class="closing">'):O.index('</section>',O.index('<section class="closing">'))+len('</section>')]
cases={}
for m in re.finditer(r'<details><summary>([^<]*)<small>.*?</details>',O,re.S):
    cases[m.group(1)]=m.group(0)
def new_case(k):
    t,sm,first,pre,slug,label=NEW[k]
    lis=''.join(f'<li>{html.escape(x)}</li>' for x in first)
    return f'<details><summary>{t}<small>{sm}</small></summary><div class="ans"><ul>{lis}</ul><div class="act"><button class="lnk" type="button" data-intake data-preset="{pre}">이 상황으로 간이 상담</button><a href="posts/{slug}.html">{label}</a></div></div></details>'
def case(item):
    if ':' in item: return new_case(item.split(':')[1])
    return cases[item]
def header(base):
    areas=''.join(f'<a href="{base}area/{a[0]}.html" data-ev="nav_area" data-label="{a[1]}">{a[1]}</a>' for a in AREAS)
    return f'''<header class="bar" id="bar">
  <div class="w">
    <a class="mark" href="{base}index.html">최경수<i>변호사</i></a>
    <nav class="topnav" aria-label="주요 메뉴">{areas}<span class="sep"></span><a href="{base}columns.html">칼럼</a><a href="{base}index.html#profile">변호사 소개</a></nav>
    <a class="btn green bar-tel" href="{HREF}" data-ev="phone_click" data-label="header">전화</a>
    <button class="btn gold bar-cta" type="button" data-intake>간이 상담</button>
    <button class="menu-btn" type="button" data-drawer aria-label="메뉴 열기" aria-controls="drawer"><span></span><span></span><span></span></button>
  </div>
</header>'''
def drawer(base):
    areas=''.join(f'<a href="{base}area/{a[0]}.html" style="--c:var(--{a[2]})" data-ev="nav_area" data-label="{a[1]}"><i></i>{a[1]}</a>' for a in AREAS)
    return f'''<div class="drawer" id="drawer" hidden>
  <div class="drawer-bg" data-drawer-close></div>
  <aside class="drawer-panel" aria-label="메뉴">
    <div class="d-top"><a class="mark" href="{base}index.html">최경수<i>변호사</i></a><button class="sheet-x" type="button" data-drawer-close>닫기</button></div>
    <div class="d-prof">
      <b>최경수 변호사</b>
      <span>법무법인 ENC 파트너 변호사</span>
      <ul><li>법무법인 ENC 파트너 변호사 (2025–)</li><li>법무법인 YK 변호사 (2021–2025)</li><li>한양대학교 법학전문대학원</li></ul>
      <a href="{base}index.html#profile" data-drawer-close-nav>변호사 소개 자세히 →</a>
    </div>
    <p class="d-h">분야별 사건</p>
    <nav class="d-areas">{areas}</nav>
    <nav class="d-links"><a href="{base}columns.html">칼럼 전체 보기</a><a href="{base}index.html#profile" data-drawer-close-nav>변호사 소개</a></nav>
    <div class="d-btns"><a class="btn green lg" href="{HREF}" data-ev="phone_click" data-label="drawer">전화 {TEL}</a><button class="btn gold lg" type="button" data-intake>간이 상담</button></div>
  </aside>
</div>'''
SHEET=f'''<div class="sheet" id="sheet" hidden>
  <div class="sheet-bg" data-close></div>
  <div class="sheet-panel" role="dialog" aria-modal="true" aria-label="간이 상담">
    <button class="sheet-x" type="button" data-close aria-label="닫기">닫기</button>
    {INTAKE}
  </div>
</div>'''
FAB=f'<div class="fab-row"><a class="btn green fab-tel" href="{HREF}" data-ev="phone_click" data-label="fab">전화</a><button class="btn gold" type="button" data-intake>간이 상담</button></div>'
def tail(base):
    return f'''{FAB}
{drawer(base)}
{SHEET}
<script src="{base}intake.js?v=4"></script>
<script src="{base}site.js?v=4"></script>
<script>
(function(){{var b=document.getElementById('bar');if(!b)return;addEventListener('scroll',function(){{b.classList.toggle('on',scrollY>8)}},{{passive:true}});}})();
</script>
</body>
</html>
'''
secname={s['id']:s for s in COLS['sections']}
def area_cols(a): return [c for c in COLS['columns'] if c['sec'] in a[5]]
def ncases(a): return sum(len(g[1]) for g in a[4])
# --- home
tiles=''
for a in AREAS:
    sub=' · '.join(g[0] for g in a[4]) if len(a[4])>2 else a[3]
    tiles+=f'''      <a class="tile" style="--c:var(--{a[2]})" href="area/{a[0]}.html" data-ev="tile_click" data-label="{a[1]}"><span class="t-name">{a[1]}</span><span class="t-sub">{sub}</span><span class="t-meta">사건 {ncases(a)} · 칼럼 {len(area_cols(a))}<i aria-hidden="true">→</i></span></a>\n'''
hero=f'''<section class="hero2" id="areas">
  <div class="w">
    <div class="who"><span class="av">사진</span><span><b>최경수 변호사</b><br>형사 사건과 생활 분쟁을 다룹니다</span></div>
    <h1>어떤 일로 오셨나요?</h1>
    <p class="lede">해당하는 분야를 누르면 자주 겪는 상황과 지금 해 둘 일을 볼 수 있습니다.</p>
    <div class="tiles">
{tiles}    </div>
    <div class="quick">
      <p>어디에 해당하는지 모르겠다면, 상황을 직접 적어 보세요.</p>
      <div class="quick-btns"><button class="btn gold lg" type="button" data-intake>간이 상담에 적기</button><a class="btn green lg" href="{HREF}">전화 {TEL}</a></div>
    </div>
  </div>
</section>'''
cols_sec=sec('columns')
home=head+'<body data-base="">\n\n'+header('')+'\n\n<main>\n'+hero+'\n\n'+sec('profile')+'\n\n'+sec('flow')+'\n\n'+cols_sec+'\n\n'+closing+'\n</main>\n\n'+foot+'\n\n'+tail('')
home=home.replace('href="style.css"','href="style.css?v=4"')
open(R+'index.html','w',encoding='utf-8').write(home)
# --- area pages
import os; os.makedirs(R+'area',exist_ok=True)
for a in AREAS:
    aid,name,color,blurb,groups,secs=a
    gh=''
    for gname,items in groups:
        cs=''.join(case(i) for i in items).replace('href="posts/','href="../posts/')
        if len(groups)>1: gh+=f'<div class="grp" style="--c:var(--{color})"><h3>{gname}</h3><div class="cases one">{cs}</div></div>\n'
        else: gh+=f'<div class="grp" style="--c:var(--{color})"><div class="cases one">{cs}</div></div>\n'
    ch=''.join(f'<a class="hub-item" href="../posts/{c["slug"]}.html"><b>{c["title"]}</b><span>{c["sum"]}</span></a>' for c in area_cols(a))
    others=''.join(f'<a href="{x[0]}.html"{" aria-current=\"page\"" if x[0]==aid else ""}>{x[1]}</a>' for x in AREAS)
    url=f'https://cks-law.github.io/area/{aid}.html'
    titles=', '.join(re.sub('<.*?>','',(NEW[i.split(':')[1]][0] if ':' in i else i)) for g in groups for i in g[1])
    page=f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{name} 사건 상담 | 강남 {name} 변호사 최경수</title>
<meta name="description" content="강남 {name} 변호사 최경수. {name} 분야에서 자주 겪는 상황과 지금 해 둘 일: {html.escape(titles)[:110]}">
<meta property="og:title" content="{name} 사건 | 최경수 변호사">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0C0C0D">
<link rel="stylesheet" href="../fonts.css">
<link rel="stylesheet" href="../style.css?v=4">
</head>
<body data-base="../">
{header('../')}
<main class="area" style="--c:var(--{color})">
<div class="w narrow">
  <a class="crumb" href="../index.html#areas">← 전체 분야</a>
  <nav class="area-tabs" aria-label="분야">{others}</nav>
  <h1>{name}</h1>
  <p class="lede">{blurb}. 비슷한 상황을 누르면 지금 해 둘 일을 볼 수 있습니다.</p>
{gh}  <h2 class="area-h2">{name} 칼럼</h2>
  <div class="hub-list">{ch}</div>
  <div class="art-cta">
    <h3>내 상황이 목록에 없나요?</h3>
    <p>간이 상담에 상황을 적어 주시면 어떤 사건에 해당하는지, 지금 무엇부터 해야 하는지 바로 안내해 드립니다.</p>
    <button class="btn gold lg" type="button" data-intake>간이 상담에 상황 적기</button>
    <a class="btn green lg" href="{HREF}">전화 상담 {TEL}</a>
  </div>
</div>
</main>
{foot.replace('href="mailto','href="mailto')}
{tail('../')}'''
    open(R+f'area/{aid}.html','w',encoding='utf-8').write(page)
# --- posts & hub: header, intake buttons, fab, sheet
for f in glob.glob(R+'posts/*.html')+[R+'columns.html']:
    s=open(f,encoding='utf-8').read()
    base='../' if '/posts/' in f else ''
    s=re.sub(r'<header class="bar[^"]*"( id="bar")?>.*?</header>',header(base),s,count=1,flags=re.S)
    s=re.sub(r'<a class="btn gold lg" href="(?:\.\./)?index\.html#intake">([^<]*)</a>',r'<button class="btn gold lg" type="button" data-intake>\1</button>',s)
    s=s.replace(f'<a class="btn line lg" href="{HREF}">',f'<a class="btn green lg" href="{HREF}">')
    s=re.sub(r'<div class="fab-row">.*?</div>\n?','',s,flags=re.S)
    s=re.sub(r'<a class="btn gold fab"[^>]*>[^<]*</a>\n?','',s)
    s=re.sub(r'<div class="drawer" id="drawer".*?</aside>\n</div>\n?','',s,flags=re.S)
    s=re.sub(r'\n?<div class="sheet" id="sheet".*?</html>\n?','\n</body>\n</html>\n',s,flags=re.S)
    s=re.sub(r'href="((?:\.\./)?)style\.css(?:\?v=\d+)?"',r'href="\1style.css?v=4"',s)
    s=re.sub(r'<body[^>]*>',f'<body data-base="{base}">',s,count=1)
    s=s.replace('</body>\n</html>',tail(base).rstrip('\n'),1) if '</body>\n</html>' in s else s.replace('</body>',tail(base).split('</body>')[0]+'</body>',1)
    open(f,'w',encoding='utf-8').write(s)
print('ok')

import subprocess; subprocess.run(['python3','/home/claude/cks-law.github.io/_tools/apply_seo.py'],check=True)
