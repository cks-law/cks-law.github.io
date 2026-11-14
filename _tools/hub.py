import json,re
R='/home/claude/cks-law.github.io/'
d=json.load(open('/home/claude/cks-law.github.io/_tools/columns.json',encoding='utf-8'))
S={s['id']:s for s in d['sections']}
C={c['slug']:c for c in d['columns']}
tpl=open(R+'posts/police-summons.html',encoding='utf-8').read()
nav=tpl[tpl.index('<body'):tpl.index('<main')].replace('../','')
foot=tpl[tpl.index('</main>')+len('</main>\n'):].replace('../','')
secs=''
toc=''
for s in d['sections']:
    items=[c for c in d['columns'] if c['sec']==s['id']]
    if not items: continue
    toc+=f'<a href="#{s["id"]}">{s["name"]}</a>'
    li=''.join(f'<a class="hub-item" href="posts/{c["slug"]}.html"><b>{c["title"]}</b><span>{c["sum"]}</span></a>' for c in items)
    secs+=f'<section class="hub-sec" id="{s["id"]}" style="--c:var(--{s["color"]})"><h2><i></i>{s["name"]}<small>{len(items)}</small></h2><div class="hub-list">{li}</div></section>\n'
html=f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>칼럼 전체 보기 | 최경수 변호사</title>
<meta name="description" content="성범죄, 형사, 음주운전, 온라인 명예훼손, 민사·부동산, 이혼·상속, 노동, 행정, 학교폭력까지 분야별로 정리한 최경수 변호사의 법률 칼럼 모음.">
<meta property="og:title" content="칼럼 전체 보기 | 최경수 변호사">
<meta property="og:type" content="website">
<meta property="og:url" content="https://cks-law.github.io/columns.html">
<link rel="canonical" href="https://cks-law.github.io/columns.html">
<meta name="theme-color" content="#0C0C0D">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="style.css">
</head>
{nav}<main class="art hub">
<div class="w narrow">
  <h1>칼럼 전체 보기</h1>
  <p class="lead">상담에서 자주 받는 질문을 분야별로 정리했습니다. 내 상황과 비슷한 글부터 읽어 보세요.</p>
  <nav class="hub-toc" aria-label="분야">{toc}</nav>
{secs}  <div class="art-cta">
    <h3>찾는 내용이 없나요?</h3>
    <p>간이 상담에 상황을 적어 주시면 관련 정보를 바로 안내해 드리고, 자주 받는 질문은 칼럼으로 정리하겠습니다.</p>
    <a class="btn gold lg" href="index.html#intake">간이 상담에 상황 적기</a>
    <a class="btn line lg" href="tel:0260110523">전화 상담 02-6011-0523</a>
  </div>
</div>
</main>
{foot}'''
open(R+'columns.html','w',encoding='utf-8').write(html)
# featured cards on index
cards=''
for slug in d['featured']:
    c=C[slug]; s=S[c['sec']]
    cards+=f'      <a class="colc" style="--c:var(--{s["color"]})" href="posts/{slug}.html"><span class="k">{s["name"]}</span><h3>{c["title"]}</h3><p>{c["sum"]}</p><span class="rd">{c["min"]}분 읽기</span></a>\n'
ix=open('/home/claude/cks-law.github.io/_tools/index_orig.html',encoding='utf-8').read()
ix=re.sub(r'(<div class="cols">\n)(.*?)(    </div>\n)', lambda m:m.group(1)+cards+m.group(3), ix, count=1, flags=re.S)
more='    <p class="more"><a class="btn line" href="columns.html">칼럼 전체 보기 ('+str(len(d['columns']))+'개)</a></p>\n'
ix=re.sub(r'    <p class="more">.*?</p>\n','',ix)
ix=ix.replace(cards+'    </div>\n', cards+'    </div>\n'+more,1)
open('/home/claude/cks-law.github.io/_tools/index_orig.html','w',encoding='utf-8').write(ix)
# sitemap
urls=[('https://cks-law.github.io/','2026-11-14'),('https://cks-law.github.io/columns.html','2026-11-14')]+[(f'https://cks-law.github.io/area/{x}.html','2026-11-14') for x in ['criminal','civil','family','labor','admin','school']]+[(f'https://cks-law.github.io/posts/{c["slug"]}.html',c['date']) for c in d['columns']]
sm='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{u}</loc><lastmod>{t}</lastmod></url>\n' for u,t in urls)+'</urlset>\n'
open(R+'sitemap.xml','w').write(sm)
# post "back" links -> columns.html
import glob
for f in glob.glob(R+'posts/*.html'):
    t=open(f,encoding='utf-8').read()
    t2=t.replace('href="../index.html#columns">다른 칼럼 보기','href="../columns.html">다른 칼럼 보기').replace('<a href="../index.html#columns">칼럼</a>','<a href="../columns.html">칼럼</a>')
    if t2!=t: open(f,'w',encoding='utf-8').write(t2)
print('built', len(d['columns']))

import subprocess; subprocess.run(['python3','/home/claude/cks-law.github.io/_tools/site.py'],check=True)
