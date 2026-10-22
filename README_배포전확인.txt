달력한눈에 — 배포 직전 버전
운영 문의: onederlab82@gmail.com

[배포]
1. index.html, calendar.html, about.html, guide.html, privacy.html, contact.html, favicon.svg, robots.txt를 같은 디렉터리에 업로드하세요.
2. HTTPS를 제공하는 실제 도메인/호스팅에 배포하세요. 로컬 file:// 에서의 localStorage 동작은 브라우저마다 다를 수 있습니다.
3. 도메인이 정해지면 sitemap.xml.template 안의 YOUR-DOMAIN.example을 실제 도메인으로 바꾼 뒤 sitemap.xml로 이름을 변경해 업로드하세요. robots.txt에 Sitemap: https://실제도메인/sitemap.xml 줄을 추가하세요.
4. 공개일에 privacy.html의 시행일과 실제 호스팅 사업자/접속로그 처리 및 광고 사용 여부를 확인·수정하세요. 법적 완전성은 별도 검토가 필요합니다.
5. 모바일/PC에서 날짜 변환, 윤달, 기념일 등록/삭제/반복, 새로고침 후 유지, PNG 저장, 모든 하단 링크를 실제 클릭 테스트하세요.
6. 애드센스 승인 및 게시자 ID 발급 이후 정책에 맞춰 광고 코드를 설치하고 ads.txt를 구성하세요. 이 파일에는 인증키나 광고 코드를 넣지 않았습니다.
7. 배포 시 기존 사용자 기념일을 유지하려면 같은 도메인과 localStorage 키를 사용하세요.

[포함]
메인 변환기, 달력, 기념일 자동 저장, 전체 기념일 목록, PNG 저장, 사이트 소개, 이용 안내, 개인정보처리방침, 문의, 광고 예정 영역 2개.

[미완료]
실제 도메인 미확정으로 sitemap.xml과 canonical URL은 미설정. 광고 코드는 미삽입. 실제 브라우저 E2E 테스트 및 독립적 공식 API 전수 재조회는 수행하지 않았습니다.
