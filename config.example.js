// config.example.js — 설정 템플릿 (저장소에 커밋되는 파일)
//
// 실제 키는 이 파일에 넣지 마세요. 아래처럼 복사한 뒤 config.js에서 값만 채웁니다:
//     cp config.example.js config.js
// config.js는 .gitignore 처리되어 저장소에 올라가지 않습니다.
//
// [Google_Javascript_API_key 발급]
//   Cloud Console → API 및 서비스 → "Maps JavaScript API" 사용 설정 → 사용자 인증 정보 → API 키
//   발급 후 반드시 두 가지 제한을 겁니다. 지도 키는 브라우저 요청 URL에 그대로 노출되므로,
//   키를 숨기는 것이 아니라 이 제한이 실제 방어선입니다.
//     · 애플리케이션 제한: HTTP 리퍼러 → http://localhost:3000/*  + 배포 도메인
//     · API 제한: Maps JavaScript API 만 선택
//
// [GOOGLE_MAP_ID 발급]
//   Cloud Console → 지도 관리 → 지도 ID 만들기 (JavaScript / 래스터)
//   AdvancedMarkerElement는 Map ID를 요구합니다. 비워두면 개발용 'DEMO_MAP_ID'로 동작하지만
//   콘솔 경고가 뜨고 실서비스에는 쓸 수 없으니, 운영 전에 발급받아 채워주세요.
window.APP_CONFIG = {
  Google_Javascript_API_key: "여기에_본인의_지도용_API_키를_넣으세요",
  GOOGLE_MAP_ID: "",
};
