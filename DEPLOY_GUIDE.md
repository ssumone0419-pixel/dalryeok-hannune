# 달력한눈에 v3 — Cloudflare Pages 배포 안내

1. GitHub에서 새 저장소 `dalryeok-hannune`를 만듭니다. Private 저장소도 사용 가능합니다.
2. 이 ZIP의 **내용 전체**를 저장소 최상위 경로에 올립니다. `functions/api/holidays.js`와 `assets` 폴더가 반드시 포함되어야 합니다. API 키는 GitHub에 올리지 마세요.
3. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → 해당 저장소 선택. Framework preset: None, Build command: 비움, Build output directory: `.` (프로젝트 루트).
4. Cloudflare Pages 프로젝트 Settings → Variables and Secrets → Add → 이름 `HOLIDAY_API_KEY`, 값: 공공데이터포털에서 받은 **일반 인증키(Decoding)**, Encrypt 체크, Production 환경에 저장. 변경 후 재배포.
5. `https://<프로젝트>.pages.dev/api/holidays?year=2026` 주소에서 JSON `holidays` 배열이 반환되는지 확인하세요. API 승인/키 종류에 따라 인코딩 문제가 있으면 인증키 설정을 확인하세요.
6. `calendar.html`에서 공휴일 표시/끄기, 음력 달력, 기념일, PNG를 점검합니다. 공휴일은 공식 API 반영 및 캐시 만료 후 자동 반영됩니다. 캐시 6시간, 브라우저 캐시 5분.
7. 실제 도메인 결정 후 `sitemap.xml.template`의 도메인을 교체해 `sitemap.xml`로 저장하고 `robots.txt`에 사이트맵 주소를 입력합니다.

주의: 실제 API 키로 연동 테스트하지 않았습니다. API 장애 또는 미지원 연도는 공휴일이 표시되지 않을 수 있습니다. 공휴일 미표시는 평일임을 뜻하지 않습니다.

## 공휴일·황금연휴 페이지
`holidays.html`에서 조회 연도를 선택하면 공식 API에서 공휴일을 조회하고 연휴 및 연차 1일 추천 구간을 계산합니다. Cloudflare Pages Functions 설정 및 HOLIDAY_API_KEY Secret이 필요합니다. API 조회 실패 시 임의로 공휴일을 만들어 표시하지 않습니다.
