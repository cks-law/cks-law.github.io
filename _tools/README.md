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

## 칼럼 100개 진행 상황
- 1차 성범죄 15개 완료(2026-11-14): deepfake, filming-threat, csam-possession, online-grooming, workplace-power-assault, harassment-vs-assault, public-indecency, restroom-intrusion, prostitution, sex-offender-registry, employment-restriction, public-servant-sex-crime, sex-crime-settlement, sex-crime-first-offense, sex-crime-victim (원고: _tools/src/s1_*.txt)
- 이혼·가사 22개 완료(2026-11-14, plan_100.md 1차): 원고 _tools/src/f01~f22.txt. plan_100.md의 [x] 표시가 진행 상황 기준
- 음주·교통 20개 완료(2026-11-14, plan_100.md 2차): 원고 _tools/src/t01~t20.txt
- 성범죄 14개 완료(2026-11-14, plan_100.md 3차, 나머지 8개는 1차 기존 글로 대체): 원고 _tools/src/s3_01~s3_14.txt. 사이트 칼럼 총 100개
- 다음: plan_100.md 4차 보이스피싱·금융 10개 → 이후 plan_100.md 순서대로
- make.py는 템플릿의 `<body` 태그(속성 포함)를 찾도록 수정됨
