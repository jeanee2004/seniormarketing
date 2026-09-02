// 가게 이름 + 좌표를 받아 구글 Places API (New)에서 별점/리뷰를 찾아 반환한다.
// GOOGLE_PLACES_API_KEY는 서버(Vercel 환경변수)에만 존재하며 클라이언트로 절대 내려가지 않는다.

const SEARCH_RADIUS_METERS = 150; // 도보 2분

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// locationBias(순위 힌트)만 쓰면, 근처에 이름이 비슷한 가게가 없을 때 구글이 이름만
// 맞는 멀리 떨어진 다른 가게를 1순위로 돌려준다(실측: "뉴애상마라탕 고대점" 검색 →
// 111km 떨어진 "백미향마라탕 고대점"). 아래 haversine 체크가 결국 걸러내긴 하지만,
// locationRestriction(강제 범위 제한)을 같이 쓰면 애초에 그 멀리 있는 오매칭이
// 검색 결과 자리(maxResultCount:1)를 차지하지 않는다.
function radiusToRectangle(lat, lng, meters) {
  const dLat = meters / 111320;
  const dLng = meters / (111320 * Math.cos((lat * Math.PI) / 180));
  return {
    low: { latitude: lat - dLat, longitude: lng - dLng },
    high: { latitude: lat + dLat, longitude: lng + dLng },
  };
}

module.exports = async function handler(req, res) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'server_missing_api_key' });
    return;
  }

  const { name, lat, lng, lang } = req.query || {};
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!name || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    res.status(400).json({ error: 'missing_params' });
    return;
  }
  // 화이트리스트 밖 값은 무시하고 기본값으로 — 임의 문자열을 그대로 구글에 넘기지 않는다.
  const languageCode = ['ko', 'en', 'zh-CN', 'es'].includes(lang) ? lang : 'ko';

  try {
    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.location,places.reviews',
      },
      body: JSON.stringify({
        textQuery: name,
        languageCode,
        locationRestriction: {
          rectangle: radiusToRectangle(latNum, lngNum, SEARCH_RADIUS_METERS),
        },
        maxResultCount: 1,
      }),
    });

    if (!searchRes.ok) {
      res.status(502).json({ error: 'upstream_error' });
      return;
    }

    const searchData = await searchRes.json();
    const place = (searchData.places || [])[0];

    // locationBias는 검색 순위에만 영향을 줄 뿐 하드 컷오프가 아니므로,
    // 150m 반경 제한은 여기서 실측 거리로 다시 한번 확실히 강제한다.
    if (!place || !place.location) {
      res.status(200).json({ found: false });
      return;
    }
    const distance = haversineMeters(latNum, lngNum, place.location.latitude, place.location.longitude);
    if (distance > SEARCH_RADIUS_METERS) {
      res.status(200).json({ found: false });
      return;
    }

    let reviews = place.reviews;
    if (!reviews) {
      const detailRes = await fetch(`https://places.googleapis.com/v1/places/${place.id}?languageCode=${languageCode}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'reviews',
        },
      });
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        reviews = detailData.reviews;
      }
    }

    res.status(200).json({
      found: true,
      name: (place.displayName && place.displayName.text) || name,
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? 0,
      reviews: (reviews || []).slice(0, 5).map((rv) => ({
        author: (rv.authorAttribution && rv.authorAttribution.displayName) || '익명',
        rating: rv.rating || 0,
        relativeTime: rv.relativePublishTimeDescription || '',
        text: (rv.text && rv.text.text) || '',
      })),
      mapsUri: place.googleMapsUri || null,
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream_error' });
  }
};
