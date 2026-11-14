# 사이트 빌드 도구 (Jekyll이 _ 폴더는 배포하지 않음)

- `columns.json` — 칼럼 목록(분야 sec, 제목, 요약). 새 칼럼은 여기에 추가
- `make.py 파일.txt` — 칼럼 본문(1행 JSON 메타 + 본문 HTML)으로 posts/슬러그.html 생성
- `faq.py` — 칼럼별 자주 묻는 질문 (본문에 있는 내용만)
- `areas_data.py` — 첫 화면 6개 분야, 분야별 상황 카드
- `index_orig.html` — 첫 화면의 원본 조각(변호사 소개, 상담 절차, 간이 상담 양식, 푸터)
- `hub.py` — 칼럼 전체 보기, 사이트맵 생성 → 끝에 site.py 자동 실행
- `site.py` — 첫 화면, 분야 페이지, 모든 페이지의 공통 상단 메뉴·상담 창·모바일 메뉴 적용 → apply_seo.py 자동 실행

순서: 칼럼 txt 작성 → `python3 _tools/make.py 파일.txt` → columns.json/faq.py/areas_data.py 갱신 → `python3 _tools/hub.py`

원칙: 법정형·기한은 검색으로 확인된 것만. 사기죄는 2026.9.13 시행 개정(20년/5천만). 2026.10.2부터 검사 직접수사 폐지 → '검찰' 대신 '수사기관', '검사'.
