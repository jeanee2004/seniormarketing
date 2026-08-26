// 지도용 Maps JavaScript API 키를 브라우저에 내려준다.
//
// 왜 서버를 거치는가: 이 저장소는 빌드 스텝이 없어서 script.js가 process.env를 읽을 수 없고,
// 실제 키가 든 config.js는 .gitignore라 배포본에 아예 없다. 그래서 배포 사이트에서는
// 키가 빈 문자열이 되어 지도 스크립트를 로드조차 못 했다. 이 통로가 그 자리를 메운다.
//
// 숨겨지는 게 아니라는 점은 분명히 해둔다: Maps JS 키는 브라우저가 maps.googleapis.com을
// 직접 부르면서 요청 URL에 그대로 실린다. 여기서 막는 건 "저장소에 키가 남는 것"이고,
// 노출 자체의 방어선은 Cloud Console의 HTTP 리퍼러 제한이다.
// (반대로 GOOGLE_PLACES_API_KEY는 서버에서만 쓰므로 리퍼러 제한을 걸면 안 된다.)

// Vercel은 리눅스라 환경변수 이름의 대소문자를 가린다. 등록해둔 철자를 먼저 보고,
// 나중에 이름을 정리하더라도 깨지지 않게 흔한 변형도 함께 본다(kakao-search.js와 같은 방식).
function readKey() {
  return process.env.Google_Javascript_API_key
    || process.env.GOOGLE_JAVASCRIPT_API_KEY
    || process.env.GOOGLE_MAPS_API_KEY
    || '';
}

module.exports = async function handler(req, res) {
  const key = readKey();
  if (!key) {
    res.status(500).json({ error: 'server_missing_api_key' });
    return;
  }
  // 키는 자주 바뀌지 않지만 캐시에 굳으면 교체가 늦게 반영된다 — 짧게만 캐시한다.
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({ key });
};
