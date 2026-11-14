import sys,json,os
TPL=open('/home/claude/cks-law.github.io/posts/police-summons.html',encoding='utf-8').read()
head_end=TPL.index('<main')
foot_start=TPL.index('</main>')
def page(slug,title,desc,color,kind,date,body,cta_h,cta_p):
    u=f"https://cks-law.github.io/posts/{slug}.html"
    head=f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} | 최경수 변호사</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="{u}">
<link rel="canonical" href="{u}">
<meta name="theme-color" content="#0C0C0D">
<link rel="stylesheet" href="../fonts.css">
<link rel="stylesheet" href="../style.css">
</head>
'''
    nav=TPL[TPL.index('<body'):head_end]
    main=f'''<main class="art" style="--c:var(--{color})">
<div class="w narrow">
  <span class="k">{kind}</span>
  <h1>{title}</h1>
  <p class="by">최경수 변호사, {date}</p>
{body}
  <div class="art-cta">
    <h3>{cta_h}</h3>
    <p>{cta_p}</p>
    <a class="btn gold lg" href="../index.html#intake">간이 상담에 상황 적기</a>
    <a class="btn line lg" href="tel:0260110523">전화 상담 02-6011-0523</a>
  </div>
  <p class="disclaimer">이 글은 일반적인 법률 정보를 제공하기 위한 것으로, 개별 사안에 대한 법률자문이 아닙니다. 법령과 실무는 바뀔 수 있고 사실관계에 따라 결론이 달라질 수 있습니다.</p>
  <a class="back" href="../index.html#columns">다른 칼럼 보기</a>
</div>
'''
    open(f'/home/claude/cks-law.github.io/posts/{slug}.html','w',encoding='utf-8').write(head+nav+main+TPL[foot_start:])
for fn in sys.argv[1:]:
    raw=open(fn,encoding='utf-8').read()
    meta,body=raw.split('\n',1)
    d=json.loads(meta); d['body']=body.rstrip()
    page(**d)
    print('ok',d['slug'])
