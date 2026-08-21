# 다음 세션 할 일

## 이번 세션까지 완료된 것 (요약)
- 구글 Places API (New) 실시간 리뷰 연동 (`api/google-reviews.js`) — 150m 반경 필터, 5개 필드 제한, not-found 처리, `store.googleReviews`(localStorage) 캐시
- 카카오 로컬 API 실시간 가게 검색 (`api/kakao-search.js`) — "동네 가게 찾아보기" 하나로 통합(기존 로컬 필터 검색창은 제거)
- 실제 가게 9곳(카카오+구글로 실존 확인됨) / 예시(목업) 가게 3곳으로 데이터 분리, 카테고리·정렬·가격 필터는 실제 가게 쪽에 적용
- "개강 후 터줏대감 사장님을 찾아갑니다" 로드맵 섹션 신설
- 지도: Leaflet.js + OpenStreetMap 타일로 구현 (아래 "미해결 이슈" 참고)
- Vercel 배포 연동 완료, 환경변수(`GOOGLE_PLACES_API_KEY`, `KAKAO_REST_KEY`/`KAKAO_REST_API_KEY` 둘 다 인식) 등록 확인, 배포 사이트에서 검색·리뷰·지도 전부 직접 검증 완료

## 미해결 이슈
- **지도**: 원래 구글 지도로 하고 싶었으나, 가진 Places API 키로는 Maps JavaScript API/Static API 둘 다 "API not activated" 상태(Cloud Console에서 별도 사용 설정 필요, 코드로 우회 불가 확인됨). 그래서 지금은 OpenStreetMap(Leaflet) 기반 실제 지도로 대체함 — 동작은 하지만 한국어 라벨이 깨져 보이고 구글맵만큼 매끄럽지 않다는 피드백 있음. 구글 지도로 다시 바꾸고 싶다면 Google Cloud Console에서 "Maps JavaScript API" 활성화가 먼저 필요.

## 다음 세션에서 진행할 것
1. **AI 리뷰 분석 기능 구체화** — 아직 요구사항 미정, 다음 세션에서 범위/방식부터 논의
2. **Supabase MCP 연결 → 메모장 연결** — 아직 요구사항 미정, 다음 세션에서 구체화
3. **로그인 기능 구체화** — 현재 "손주 로그인"은 UI 목업(실제 인증 없음, CLAUDE.md 참고). 실제 로그인으로 발전시킬 예정, 다음 세션에서 방식 논의(Supabase auth 연계 가능성 있음, 위 항목과 연결해서 검토)
