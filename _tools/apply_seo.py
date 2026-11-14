import re,json,html,sys
sys.path.insert(0,'/home/claude/cks-law.github.io/_tools')
from faq import FAQ
R='/home/claude/cks-law.github.io/'
COLS=json.load(open('/home/claude/cks-law.github.io/_tools/columns.json',encoding='utf-8'))
SECKW={'sex':'성범죄','crim':'형사','traffic':'음주운전','online':'명예훼손','civil':'민사','family':'이혼·상속','labor':'노동','admin':'행정','school':'학교폭력'}
TAIL=' 서울 강남 테헤란로, 법무법인 ENC 최경수 변호사.'
for c in COLS['columns']:
    f=R+f'posts/{c["slug"]}.html'
    try: s=open(f,encoding='utf-8').read()
    except FileNotFoundError: continue
    kw=FAQ.get(c['slug'],(SECKW[c['sec']],[]))[0]
    s=re.sub(r'<title>.*?</title>',f'<title>{c["title"]} | 강남 {kw} 변호사 최경수</title>',s,count=1)
    def d(m):
        v=m.group(2)
        return m.group(1)+(v if TAIL.strip() in v else v+TAIL)+'"'
    s=re.sub(r'(<meta name="description" content=")([^"]*)"',d,s,count=1)
    s=s.replace('검찰의 처분','검사의 처분')
    qa=FAQ.get(c['slug'],(None,[]))[1]
    s=re.sub(r'\n?  <section class="faq">.*?</section>\n','\n',s,flags=re.S)
    s=re.sub(r'\n?<script type="application/ld\+json" data-faq>.*?</script>','',s,flags=re.S)
    if qa:
        body=''.join(f'<div class="qa"><h3>{html.escape(q)}</h3><p>{html.escape(a)}</p></div>' for q,a in qa)
        s=s.replace('  <div class="art-cta">',f'  <section class="faq">\n    <h2>자주 묻는 질문</h2>\n    {body}\n  </section>\n  <div class="art-cta">',1)
        ld={"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in qa]}
        s=s.replace('</head>','<script type="application/ld+json" data-faq>'+json.dumps(ld,ensure_ascii=False)+'</script>\n</head>',1)
    open(f,'w',encoding='utf-8').write(s)
print('seo ok')
