// 사용자 위치 → 가게까지의 "텍스트 추천 경로"(거리·소요시간·도보 안내 문구)를 구한다.
// 지도 위에 선을 그리지는 않으므로 클라이언트에서 DirectionsRenderer는 안 쓰지만,
// 호출 자체는 유료 Routes API라 서버(GOOGLE_PLACES_API_KEY, 리퍼러 제한 없음)를 거친다.

module.exports = async function handler(req, res) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'server_missing_api_key' });
    return;
  }

  const { originLat, originLng, destLat, destLng, lang } = req.query || {};
  const oLat = Number(originLat);
  const oLng = Number(originLng);
  const dLat = Number(destLat);
  const dLng = Number(destLng);
  if (![oLat, oLng, dLat, dLng].every(Number.isFinite)) {
    res.status(400).json({ error: 'missing_params' });
    return;
  }
  // 화이트리스트 밖 값은 무시하고 기본값으로 — 임의 문자열을 그대로 구글에 넘기지 않는다.
  const languageCode = ['ko', 'en', 'zh-CN', 'es'].includes(lang) ? lang : 'ko';

  try {
    const routeRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs.steps.navigationInstruction.instructions',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: oLat, longitude: oLng } } },
        destination: { location: { latLng: { latitude: dLat, longitude: dLng } } },
        travelMode: 'WALK',
        languageCode,
      }),
    });

    if (!routeRes.ok) {
      res.status(502).json({ error: 'upstream_error' });
      return;
    }

    const data = await routeRes.json();
    const route = (data.routes || [])[0];
    if (!route) {
      res.status(200).json({ found: false });
      return;
    }

    const steps = ((route.legs || [])[0]?.steps || [])
      .map((s) => s.navigationInstruction && s.navigationInstruction.instructions)
      .filter(Boolean);

    res.status(200).json({
      found: true,
      // duration은 "296s" 형태의 문자열로 온다 — 초 단위 숫자만 뽑아 클라이언트가 사람이 읽을
      // 형태(몇 분)로 바꾸게 둔다. distanceMeters는 이미 숫자다.
      durationSeconds: route.duration ? parseInt(route.duration, 10) : null,
      distanceMeters: route.distanceMeters ?? null,
      steps,
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream_error' });
  }
};
