// 실제 가게의 이름/주소/좌표를 카카오 로컬 API로 찾아보는 1회성 로컬 도구.
// 배포되는 사이트 코드가 아니며, index.html/script.js/api 어디에서도 참조하지 않는다.
//
// 사용법:
//   KAKAO_REST_KEY=xxxx node scripts/kakao-lookup.js "가게이름" "지역 키워드(예: 조치원)"
//   또는: node scripts/kakao-lookup.js "가게이름" "조치원" xxxx  (3번째 인자로 키 전달)

const [, , name, area, keyArg] = process.argv;
const KAKAO_REST_KEY = keyArg || process.env.KAKAO_REST_KEY;

if (!name) {
  console.error('사용법: node scripts/kakao-lookup.js "가게이름" "지역 키워드" [REST_KEY]');
  process.exit(1);
}
if (!KAKAO_REST_KEY) {
  console.error('카카오 REST API 키가 없습니다. KAKAO_REST_KEY 환경변수로 전달하거나 3번째 인자로 넘겨주세요.');
  process.exit(1);
}

const query = area ? `${name} ${area}` : name;
const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;

fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } })
  .then((res) => res.json())
  .then((data) => {
    const docs = data.documents || [];
    if (docs.length === 0) {
      console.log('검색 결과가 없습니다.');
      return;
    }
    docs.forEach((d, i) => {
      console.log(`${i + 1}. ${d.place_name}`);
      console.log(`   주소: ${d.road_address_name || d.address_name}`);
      console.log(`   좌표: lat=${d.y}, lng=${d.x}`);
      console.log(`   카테고리: ${d.category_name}`);
      console.log('');
    });
  })
  .catch((e) => {
    console.error('요청 실패:', e.message);
    process.exit(1);
  });
