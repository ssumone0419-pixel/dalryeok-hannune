달력한눈에 · 정적 사이트 릴리스 v2

배포: 이 폴더의 파일과 assets/ 폴더를 함께 업로드하세요. ZIP 파일을 Cloudflare Pages에 업로드할 수 있습니다.
시작 페이지: index.html
고객 문의: onederlab82@gmail.com

개선: 음양력 원본 데이터 공통 파일화, 공통 CSS/페이지별 JS 분리, 날짜별 기념일 캐싱, 삭제 실패 시 원상복구, 달력 PNG 가변 셀 높이, 키보드/접근성 상태 표시, 경계 날짜 탐색 개선, 데이터 보존 경고.

배포 전/후 확인: 
1) 실제 도메인이 정해지면 sitemap.template.xml의 example.com을 교체해 sitemap.xml로 저장하고 robots.txt에 Sitemap 주소 추가.
2) privacy.html의 시행일/실제 호스팅·광고 관련 설명을 최종 검토.
3) 실제 호스팅에서 양력↔음력, 윤달, 1900/2050 경계, 기념일 저장·삭제·반복, PNG 출력, 모바일 UI 확인.
4) 광고 영역은 자리 표시용이며 AdSense 코드 및 ads.txt는 아직 없음.
5) 기존 기념일 localStorage 키(dalryeok-hannune-events-v1)는 유지.
