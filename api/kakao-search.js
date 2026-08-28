// 가게 이름으로 카카오 로컬 API에서 학교 주변 실시간 검색 결과를 반환한다.
// 카카오 REST 키는 서버(Vercel 환경변수)에만 존재하며 클라이언트로 절대 내려가지 않는다.

const CAMPUS_CENTER = { lat: 36.6109529892437, lng: 127.286987211083 }; // 고려대학교 세종캠퍼스
const SEARCH_RADIUS_METERS = 5000;
const MAX_RESULTS = 5;

module.exports = async function handler(req, res) {
  // Vercel에 등록한 변수 이름이 KAKAO_REST_KEY / KAKAO_REST_API_KEY 둘 중 무엇이든 인식
  const restKey = process.env.KAKAO_REST_KEY || process.env.KAKAO_REST_API_KEY;
  if (!restKey) {
    res.status(500).json({ error: 'server_missing_api_key' });
    return;
  }

  const query = (req.query && req.query.query || '').trim().slice(0, 50);
  if (!query) {
    res.status(400).json({ error: 'missing_query' });
    return;
  }

  try {
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', query);
    url.searchParams.set('x', String(CAMPUS_CENTER.lng));
    url.searchParams.set('y', String(CAMPUS_CENTER.lat));
    url.searchParams.set('radius', String(SEARCH_RADIUS_METERS));
    url.searchParams.set('sort', 'distance');
    url.searchParams.set('size', String(MAX_RESULTS));

    const kakaoRes = await fetch(url, {
      headers: { Authorization: `KakaoAK ${restKey}` },
    });

    if (!kakaoRes.ok) {
      res.status(502).json({ error: 'upstream_error' });
      return;
    }

    const data = await kakaoRes.json();
    const results = (data.documents || []).map((d) => ({
      name: d.place_name,
      address: d.road_address_name || d.address_name,
      phone: d.phone || '',
      lat: Number(d.y),
      lng: Number(d.x),
      category: d.category_name,
    }));

    res.status(200).json({ results });
  } catch (e) {
    res.status(502).json({ error: 'upstream_error' });
  }
};
