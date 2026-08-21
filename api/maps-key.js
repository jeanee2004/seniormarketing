// 브라우저용 구글 지도 위젯 키를 내려준다. Maps JavaScript API 키는 원래 브라우저에
// 노출되는 게 정상 설계(보안은 Google Cloud Console의 HTTP 리퍼러 제한으로 함) —
// 그래도 정적 HTML/JS 소스에 직접 박아넣지 않고 요청 시점에 서버에서 내려주는 편이
// 이 프로젝트의 "키는 항상 env var 경유" 관례와 일치한다.
module.exports = function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'server_missing_api_key' });
    return;
  }
  res.status(200).json({ key });
};
