// config.js — 배포 환경마다 값이 다르므로 script.js와 분리한다.
// 이 파일은 index.html <head>에서 script.js보다 먼저 로드된다.
//
// 카카오 JS 키는 "도메인 화이트리스트" 방식이라, developers.kakao.com에서
// 앱 > 플랫폼 > Web에 실제 배포 도메인(예: http://localhost:5500, https://example.com)을
// 등록해둔 경우에만 인증이 통과한다. file:// 로 직접 열면 도메인이 없어서 항상 실패하므로,
// 키를 비워두면 script.js가 SDK를 아예 부르지 않고 목업 데이터로 폴백한다.

const KAKAO_JS_KEY = '';        // developers.kakao.com > 앱 > JavaScript 키

// 지도 기본 중심 좌표 — 조치원역 기준
const JOCHIWON_CENTER = { lat: 36.6008, lng: 127.2966 };
