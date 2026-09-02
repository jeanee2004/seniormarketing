// ---- 지도 설정 (실제 키는 .gitignore된 config.js에만 있다) ----
// config.js가 없거나 값이 비어 있으면 빈 문자열이 되고, 지도만 조용히 비활성화된다.
// 이 두 변수 밖에서는 키를 직접 참조하지 않는다.
const MAPS_KEY = (window.APP_CONFIG && window.APP_CONFIG.Google_Javascript_API_key) || '';

// 지도 인스턴스와 마커 목록. renderCards()가 파일 아래쪽 지도 블록보다 먼저 돌기 때문에
// 여기서 선언해야 한다 — 아래에서 선언하면 첫 렌더가 TDZ ReferenceError로 죽는다.
let gmap = null;
let gMarkers = [];
let gMarkerById = new Map(); // r.id -> marker, "지도에서 위치 보기"가 필터와 무관하게 마커를 찾는 데 쓴다

// ---- Dummy restaurant data ----
const restaurants = [
  {id:"jochiwon-halmae-gukbap", name:"조치원 할매국밥", cat:"한식", emoji:"🍚", desc:"40년 전통, 진한 국물의 소문난 국밥집", rating:4.8, reviewCount:212, price:"₩", priceValue:9000, saved:false, visited:false, detail:{
    isExample:true,
    address:"세종특별자치시 조치원읍 죽림리 123-4 (임의 주소 · 실제 주소 아님)",
    hours:"매일 07:00 - 20:00 (재료 소진 시 조기 마감)",
    closed:"매주 일요일 휴무",
    phone:"044-123-4567",
    reservation:"전화 예약 가능 (당일 예약 권장, 워크인도 가능)",
    capacity:"최대 24명 (4인 테이블 6개)",
    parking:"가게 앞 2대 무료 주차 · 공영주차장 도보 3분",
    mobilePay:"카카오페이 · 네이버페이 · 삼성페이 가능",
    vouchers:"온누리상품권 가능 · 세종사랑카드(지역화폐) 가능 · 유가부담경감 식권은 미사용 · 학생식권 미사용",
    menu:[
      {name:"할매국밥", price:"9,000원", composition:"국밥 1그릇 + 깍두기 + 배추김치 + 새우젓 + 밥 무한리필", origin:"돼지고기 국내산, 쌀 국내산(세종)"},
      {name:"순대국밥", price:"9,000원", composition:"순대국밥 1그릇 + 깍두기 + 배추김치 + 부추무침", origin:"돼지고기·순대 국내산, 쌀 국내산(세종)"},
      {name:"수육 (소)", price:"18,000원", composition:"수육 1접시 + 새우젓 + 쌈장 + 쌈채소 + 배추김치", origin:"돼지고기 국내산"},
    ]
  },
  // pass가 있는 가게만 손주 식권 섹션과 검색에 노출된다 (detail과 같은 방식 — 일부만 채워둔 예시)
  pass:{unit:9000, bundles:[{count:5,bonus:0},{count:10,bonus:1}], benefit:"10장 사면 1장 더", benefitEn:"Buy 10, get 1 free", benefitZh:"买10送1", benefitEs:"Compra 10, llévate 1 gratis", benefitFr:"10 achetés, 1 offert", benefitDe:"10 kaufen, 1 gratis", benefitJa:"10枚買うと1枚無料", validDays:180}},
  {id:"yeokjeon-wang-donkatsu", name:"역전 왕돈까스", cat:"양식", emoji:"🍱", desc:"두툼한 수제 돈까스, 넉넉한 인심", rating:4.7, reviewCount:151, price:"₩", priceValue:9000, saved:false, visited:false,
    pass:{unit:9000, bundles:[{count:5,bonus:0},{count:10,bonus:1}], benefit:"10장 사면 1장 더", benefitEn:"Buy 10, get 1 free", benefitZh:"买10送1", benefitEs:"Compra 10, llévate 1 gratis", benefitFr:"10 achetés, 1 offert", benefitDe:"10 kaufen, 1 gratis", benefitJa:"10枚買うと1枚無料", validDays:90},
    detail:{
      isExample:true,
      address:"세종특별자치시 조치원읍 원리 78-1 (임의 주소 · 실제 주소 아님)",
      hours:"매일 11:00 - 20:30",
      closed:"매주 수요일 휴무",
      phone:"044-234-5672",
      reservation:"워크인 전용",
      capacity:"최대 28명 (4인 테이블 7개)",
      parking:"공영주차장 도보 2분",
      mobilePay:"카카오페이 · 네이버페이 가능",
      vouchers:"온누리상품권 가능 · 세종사랑카드 가능",
      menu:[
        {name:"왕돈까스", price:"9,000원", composition:"두툼한 돈까스 1장 + 밥 + 수프 + 샐러드", origin:"돼지고기 국내산"},
        {name:"치즈돈까스", price:"10,500원", composition:"돈까스+모짜렐라 + 밥 + 수프", origin:"돼지고기 국내산, 치즈 수입산"},
      ]
    }},
  {id:"an-chef-jjambbong", name:"안쉐프고기해물짬뽕", cat:"중식", emoji:"🥡", desc:"고기와 해물을 함께 낸 얼큰한 짬뽕집", rating:null, reviewCount:null, price:"₩", priceValue:9000, saved:false, visited:false,
    liveReview:true, lat:36.61477503455844, lng:127.2857292835937, realAddress:"세종특별자치시 조치원읍 섭골길 51-21"},
  {id:"jagal-dondon", name:"자갈돈돈", cat:"한식", emoji:"🥩", desc:"조치원읍 골목의 고기구이집", rating:null, reviewCount:null, price:"₩₩", priceValue:15000, saved:false, visited:false,
    liveReview:true, lat:36.6080898465768, lng:127.29005819471818, realAddress:"세종특별자치시 조치원읍 내창2길 30"},
  {id:"wooridul-sikdang", name:"우리들식당", cat:"한식", emoji:"🍲", desc:"조치원읍 골목의 가정식 백반집", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6080899912077, lng:127.288885692635, realAddress:"세종특별자치시 조치원읍 내창3길 19"},
  {id:"paul-barna", name:"폴바나", cat:"양식", emoji:"🍝", desc:"조치원읍 골목의 양식당", rating:null, reviewCount:null, price:"₩₩", priceValue:15000, saved:false, visited:false,
    liveReview:true, lat:36.60819819730195, lng:127.28885703507063, realAddress:"세종특별자치시 조치원읍 내창3길 19"},
  {id:"donseu", name:"돈스", cat:"일식", emoji:"🍱", desc:"조치원읍 골목의 돈까스·우동집", rating:null, reviewCount:null, price:"₩", priceValue:9000, saved:false, visited:false,
    liveReview:true, lat:36.60735076086951, lng:127.29343318591735, realAddress:"세종특별자치시 조치원읍 돌마루7길 6"},
  {id:"the-ramen", name:"더라멘", cat:"일식", emoji:"🍜", desc:"조치원읍 골목의 라멘집", rating:null, reviewCount:null, price:"₩", priceValue:9000, saved:false, visited:false,
    liveReview:true, lat:36.607796147725, lng:127.289286979365, realAddress:"세종특별자치시 조치원읍 내창3길 16-1"},
  {id:"sushi-power-plant-12g", name:"초밥발전소12g", cat:"일식", emoji:"🍣", desc:"조치원읍 골목의 초밥·롤 전문점", rating:null, reviewCount:null, price:"₩₩", priceValue:13000, saved:false, visited:false,
    liveReview:true, lat:36.60695328676086, lng:127.2894090160121, realAddress:"세종특별자치시 조치원읍 내창3길 8"},
  {id:"halmoni-tteokbokki", name:"할머니 떡볶이", cat:"분식", emoji:"🍢", desc:"매콤달콤 옛날 떡볶이, 학생 최애 간식", rating:4.9, reviewCount:264, price:"₩", priceValue:4000, saved:true, visited:false,
    pass:{unit:4000, bundles:[{count:10,bonus:1},{count:20,bonus:3}], benefit:"20장 사면 3장 더", benefitEn:"Buy 20, get 3 free", benefitZh:"买20送3", benefitEs:"Compra 20, llévate 3 gratis", benefitFr:"20 achetés, 3 offerts", benefitDe:"20 kaufen, 3 gratis", benefitJa:"20枚買うと3枚無料", validDays:180},
    detail:{
      isExample:true,
      address:"세종특별자치시 조치원읍 봉산리 5-2 (임의 주소 · 실제 주소 아님)",
      hours:"매일 12:00 - 19:00 (재료 소진 시 조기 마감)",
      closed:"매주 일요일 휴무",
      phone:"044-456-7892",
      reservation:"워크인 전용",
      capacity:"최대 10명 (분식 좌식 테이블 3개)",
      parking:"가게 앞 노상 주차 1대",
      mobilePay:"카카오페이 가능 (네이버페이 준비중)",
      vouchers:"온누리상품권 가능 · 세종사랑카드 가능 · 학생식권 가능",
      menu:[
        {name:"떡볶이 (1인분)", price:"4,000원", composition:"즉석 떡볶이 + 어묵 2개", origin:"떡 국내산, 고춧가루 국내산"},
        {name:"모둠튀김", price:"5,000원", composition:"튀김 5종 모둠", origin:"식용유 국내산"},
      ]
    }},
  {id:"parangsae-bunsik", name:"파랑새분식", cat:"분식", emoji:"🍙", desc:"조치원읍 골목의 분식집", rating:null, reviewCount:null, price:"₩", priceValue:5000, saved:false, visited:false,
    liveReview:true, lat:36.608516105696, lng:127.290049731247, realAddress:"세종특별자치시 조치원읍 내창1길 34-1"},
  {id:"sookine-bapsang", name:"숙이네밥상", cat:"한식", emoji:"🍲", desc:"조치원읍 골목의 가정식 백반집", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.608995511335, lng:127.291526952076, realAddress:"세종특별자치시 조치원읍 원마루길 16-1"},
  // ── 2026-08-26 추가: 고려대 세종캠퍼스 1km 이내, 카카오 로컬 + 구글 Places로 실존 확인한 가게들.
  //    프랜차이즈(카테고리에 브랜드 마디가 있거나 "OO점" 접미사)는 제외하고 개인 가게만 담았다.
  //    가격대는 구글 priceLevel에서 왔고, 그 값이 없는 곳만 카테고리 기본값이다(next.md 참고).
  {id:"seochangri-181", name:"서창리181", cat:"한식", emoji:"🍲", desc:"조치원읍 골목의 한식당", rating:null, reviewCount:null, price:"₩", priceValue:9000, saved:false, visited:false,
    liveReview:true, lat:36.6095767075366, lng:127.289694903435, realAddress:"세종특별자치시 조치원읍 원마루길 31-5"},
  {id:"sammat-cafe", name:"삼맛카페", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.60822500941674, lng:127.28483105107225, realAddress:"세종특별자치시 조치원읍 모과나무길 34"},
  {id:"vanilla-garden", name:"바닐라가든", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.608334206532, lng:127.289625427726, realAddress:"세종특별자치시 조치원읍 내창1길 35"},
  {id:"dankong", name:"단콩", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6138564422386, lng:127.28922913275, realAddress:"세종특별자치시 조치원읍 섭골길 35-4"},
  {id:"paul-and-banabas", name:"폴앤바나바스", cat:"양식", emoji:"🍝", desc:"조치원읍 골목의 양식당", rating:null, reviewCount:null, price:"₩₩", priceValue:15000, saved:false, visited:false,
    liveReview:true, lat:36.60798264373754, lng:127.2893033241067, realAddress:"세종특별자치시 조치원읍 내창3길 20"},
  {id:"cafe-sujak", name:"카페수작", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6094043626304, lng:127.290898078419, realAddress:"세종특별자치시 조치원읍 원마루길 28-1"},
  {id:"cafe-calendar", name:"카페캘린더", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.6084758354333, lng:127.290304424996, realAddress:"세종특별자치시 조치원읍 내창1길 32-1"},
  {id:"hong-cafe", name:"홍카페", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6138660610245, lng:127.289721008169, realAddress:"세종특별자치시 조치원읍 섭골길 31"},
  {id:"matna-sikdang-bunsik", name:"맛나식당분식", cat:"분식", emoji:"🍢", desc:"조치원읍 골목의 분식집", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.608079882452, lng:127.290079394343, realAddress:"세종특별자치시 조치원읍 내창2길 30"},
  {id:"imone-dwaeji-gukbap", name:"이모네돼지국밥", cat:"한식", emoji:"🍲", desc:"조치원읍 골목의 한식당", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6143244215738, lng:127.289481273025, realAddress:"세종특별자치시 조치원읍 섭골길 34"},
  {id:"bundang-ilpum-guksu", name:"분당일품국수", cat:"한식", emoji:"🍲", desc:"조치원읍 골목의 한식당", rating:null, reviewCount:null, price:"₩", priceValue:9000, saved:false, visited:false,
    liveReview:true, lat:36.6147376747531, lng:127.28552570074, realAddress:"세종특별자치시 조치원읍 섭골길 51-23"},
  {id:"urban-lounge", name:"어반라운지", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩₩", priceValue:15000, saved:false, visited:false,
    liveReview:true, lat:36.61467875353, lng:127.288662111208, realAddress:"세종특별자치시 조치원읍 신안새동네2길 15"},
  {id:"gyodong-jjambbong", name:"교동짬뽕", cat:"중식", emoji:"🥡", desc:"조치원읍 골목의 중식당", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6142189884474, lng:127.289851995861, realAddress:"세종특별자치시 조치원읍 섭골길 30"},
  {id:"naive", name:"나이브", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6072146336185, lng:127.28940216838, realAddress:"세종특별자치시 조치원읍 내창2길 13-3"},
  {id:"yuram-coffee-roasters", name:"유람 커피로스터스", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩₩", priceValue:15000, saved:false, visited:false,
    liveReview:true, lat:36.6142152703281, lng:127.291007809944, realAddress:"세종특별자치시 조치원읍 신안새동네길 25"},
  {id:"daily-point", name:"딜리포인트", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:8000, saved:false, visited:false,
    liveReview:true, lat:36.6095312814038, lng:127.292428760867, realAddress:"세종특별자치시 조치원읍 원마루길 8"},
  {id:"hunminjeongeum", name:"훈민정음", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.6067909095201, lng:127.289479943118, realAddress:"세종특별자치시 조치원읍 내창3길 6-2"},
  {id:"siot", name:"시옷", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩₩", priceValue:9000, saved:false, visited:false,
    liveReview:true, lat:36.6131699644573, lng:127.280096320418, realAddress:"세종특별자치시 조치원읍 봉신길 69"},
  {id:"vib", name:"비브", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩₩", priceValue:15000, saved:false, visited:false,
    liveReview:true, lat:36.6046085750178, lng:127.290128986122, realAddress:"세종특별자치시 조치원읍 행복5길 4"},
  {id:"neomeo", name:"너머", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.6054794933111, lng:127.292905251462, realAddress:"세종특별자치시 조치원읍 행복6길 32"},
  {id:"chas", name:"차스", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.60417645156744, lng:127.29143281475365, realAddress:"세종특별자치시 조치원읍 행복3길 13"},
  {id:"second-road", name:"세컨로드", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.618473252653, lng:127.28948336837, realAddress:"세종특별자치시 조치원읍 돌간2길 6"},
  {id:"merry-go-round", name:"메리고라운드", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.6186374126704, lng:127.290161420959, realAddress:"세종특별자치시 조치원읍 돌간1길 2"},
  {id:"roastery-cafe-in", name:"로스터리 카페IN", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.6030584936834, lng:127.290179064282, realAddress:"세종특별자치시 조치원읍 행복길 4"},
  {id:"defense", name:"디펜스", cat:"카페", emoji:"☕", desc:"조치원읍 골목의 카페", rating:null, reviewCount:null, price:"₩", priceValue:6000, saved:false, visited:false,
    liveReview:true, lat:36.6027370464379, lng:127.28895961480195, realAddress:"세종특별자치시 조치원읍 문화길 35-6"},
];

// ================= Supabase (손주 로그인) =================
// publishable 키는 원래 브라우저로 내려가는 공개 값이다. 숨기는 것이 보안 경계가 아니라,
// 테이블의 RLS 정책이 경계다. 계정 자체는 Supabase Auth(auth.users)가 관리하므로
// 비밀번호는 이 코드 어디에도 저장되지 않는다.
const SUPABASE_URL = 'https://oqsydupzmgfgrkuibbqm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mLipCnG1P2J2iJckvbaVZg_daYRe2VR';

// index.html에서 UMD 빌드를 먼저 불러온다. CDN이 막힌 환경에서도 사이트의 나머지 기능은
// 그대로 돌아가야 하므로, 없으면 null로 두고 로그인 시도할 때만 안내한다.
const sb = (typeof supabase !== 'undefined' && supabase.createClient)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

// ================= 로컬 저장 (백엔드 전환 지점) =================
// 나중에 Supabase 같은 백엔드를 붙일 때는 loadState / saveState 두 함수만 갈아끼우면 된다.
// marks는 배열 인덱스가 아니라 가게 이름을 키로 잡는다 — restaurants 순서가 바뀌거나
// 항목이 추가돼도 저장된 값이 엉뚱한 가게에 붙지 않도록.
//
// marks는 다시 사용자 id로 한 겹 감싼다: { [userId]: { [가게이름]: {saved, visited} } }.
// 인증이 진짜가 된 이상 전역으로 두면 한 브라우저에서 A가 로그아웃하고 B가 로그인했을 때
// B가 A의 저장목록을 보게 된다. 이 모양은 나중에 옮겨갈 서버 테이블
// saved_restaurants(user_id, restaurant_name, …)와 같아서 이전도 쉬워진다.
const STORE_KEY = 'bmw:v1';
let store = { auth:{isLoggedIn:false, name:'', userId:''}, marks:{}, reviews:[], passOrders:[], passOrdersAdopted:false, reviewLikes:{}, myLikedReviews:[], googleReviews:{}, reviewAnalysis:{}, lang:'ko', theme:'', allergies:[] };

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return;
    const parsed = JSON.parse(raw);
    store = {
      auth:{
        // 로그인 여부의 진짜 출처는 이제 Supabase 세션이다. 여기 값은 세션이 확인되기 전까지
        // 헤더가 깜빡이지 않게 해주는 힌트일 뿐이고, syncAuthFromSession()이 곧 덮어쓴다.
        isLoggedIn: !!(parsed.auth && parsed.auth.isLoggedIn),
        name: (parsed.auth && parsed.auth.name) || '',
        userId: (parsed.auth && parsed.auth.userId) || '',
      },
      marks: normalizeMarks(parsed.marks),
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      passOrders: Array.isArray(parsed.passOrders) ? parsed.passOrders : [],
      passOrdersAdopted: !!parsed.passOrdersAdopted,
      reviewLikes: parsed.reviewLikes || {},
      myLikedReviews: Array.isArray(parsed.myLikedReviews) ? parsed.myLikedReviews : [],
      googleReviews: pruneGoogleCache(parsed.googleReviews),
      // 옛 캐시는 키가 가게 이름뿐이라 어떤 언어로 받은 요약인지 알 수 없다 — 버린다.
      reviewAnalysis: pruneAnalysisCache(parsed.reviewAnalysis),
      lang: parsed.lang || 'ko',
      // ''(미설정)이면 OS의 prefers-color-scheme을 따른다. 'light'/'dark'는 사용자가 직접 고른 값.
      theme: (parsed.theme === 'light' || parsed.theme === 'dark') ? parsed.theme : '',
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
    };
    // 옛 버전의 parsed.accounts(평문 비밀번호가 들어있던 배열)는 일부러 읽지 않는다.
    // 다음 saveState()에서 저장소에서도 사라진다.
  }catch(e){
    // 저장소가 막힌 환경(사생활 보호 모드 등) — 조용히 메모리 전용으로 동작한다
  }
}

// 구글 리뷰 캐시는 영구 저장이 아니라 유효기간이 있는 캐시다.
// 실패(found:false)를 캐시하면 안 된다 — API 키가 잠깐 막혔던 동안 저장된 "못 찾음"이
// 그대로 굳어서, 키를 고친 뒤에도 그 가게만 계속 "실제 리뷰 준비중"으로 남는다.
// (실제로 그 일이 있었다. 그래서 성공만, 그것도 GOOGLE_CACHE_TTL 동안만 캐시한다.)
const GOOGLE_CACHE_TTL = 12 * 60 * 60 * 1000; // 12시간
function isFreshGoogle(entry){
  return !!(entry && entry.data && entry.data.found && (Date.now() - (entry.fetchedAt || 0)) < GOOGLE_CACHE_TTL);
}
function pruneAnalysisCache(raw){
  if(!raw || typeof raw !== 'object') return {};
  const out = {};
  for(const [key, entry] of Object.entries(raw)) if(key.includes('|')) out[key] = entry;
  return out;
}

// 구글 리뷰 텍스트는 이제 언어별로 다르게 받아온다(구글이 languageCode에 맞춰 번역해 돌려줌)
// — 그래서 캐시 키도 review-analysis와 같은 "이름|언어" 조합이다. 키에 '|'가 없는 옛 캐시는
// 언어를 알 수 없어(마이그레이션 이전) 버린다.
function googleCacheKey(name){ return name + '|' + currentLang; }
function pruneGoogleCache(raw){
  if(!raw || typeof raw !== 'object') return {};
  const out = {};
  for(const [key, entry] of Object.entries(raw)) if(key.includes('|') && isFreshGoogle(entry)) out[key] = entry;
  return out;
}

// 옛 저장본은 marks가 { 가게이름: {...} } 였고, 지금은 { userId: { 가게이름: {...} } } 다.
// 값의 모양을 보고 옛 형식이면 LEGACY_MARKS_KEY 아래로 옮겨둔다 —
// 처음 로그인하는 사람에게 한 번 승계시켜서(adoptLegacyMarks) 기존 저장목록을 잃지 않게 한다.
const LEGACY_MARKS_KEY = '__legacy__';
function normalizeMarks(raw){
  if(!raw || typeof raw !== 'object') return {};
  const values = Object.values(raw);
  const isOldShape = values.length > 0 && values.every(v =>
    v && typeof v === 'object' && ('saved' in v || 'visited' in v));
  return isOldShape ? { [LEGACY_MARKS_KEY]: raw } : raw;
}

// 지금 마크를 읽고 쓸 대상. 로그아웃 상태에서는 어차피 화면에 마크가 보이지 않으므로
// 빈 통을 돌려주고, 어떤 사용자의 데이터에도 섞이지 않게 한다.
function currentMarks(){
  const uid = store.auth.userId;
  if(!uid) return {};
  if(!store.marks[uid]) store.marks[uid] = {};
  return store.marks[uid];
}

// 저장 성공 여부를 돌려준다 (사진 첨부로 용량을 넘길 수 있어서 호출부에서 안내가 필요함)
function saveState(){
  store.auth = { isLoggedIn, name: currentUserName, userId: currentUserId };
  if(currentUserId){
    const mine = {};
    restaurants.forEach(r => {
      if(r.saved || r.visited) mine[r.name] = { saved:!!r.saved, visited:!!r.visited };
    });
    store.marks[currentUserId] = mine;
  }
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  }catch(e){
    return false;
  }
}

function applyState(){
  const marks = currentMarks();
  restaurants.forEach(r => {
    const m = marks[r.name];
    r.saved = !!(m && m.saved);
    r.visited = !!(m && m.visited);
  });
}

// ================= 저장목록 서버 저장 (Supabase saved_restaurants) =================
// 담기(♡)는 이제 브라우저뿐 아니라 서버에도 한 줄로 남는다 — 기기를 바꿔도 저장목록이 따라온다.
// 표 만드는 SQL은 supabase/saved_restaurants.sql 한 파일에 들어 있다.
//
//   행(row) 하나 = 담은 가게 하나.
//   담기 → upsert 한 줄 / 담기 해제 → 그 줄 delete / 가본 곳 → 같은 줄의 visited_at.
//
// (user_id, restaurant_id)에 unique 제약이 있어 같은 사람이 같은 가게를 두 번 담을 수 없고,
// RLS 정책 때문에 남의 줄은 읽지도 쓰지도 못한다. 키를 가게 이름이 아니라 id 슬러그로 잡은 것은
// 이름에 오타를 고치거나 배열 순서를 바꿔도 저장목록이 끊기지 않게 하기 위해서다.
//
// localStorage(store.marks)는 그대로 남긴다 — 세션이 확인되기 전 첫 프레임을 그리는 캐시이자,
// CDN이 막혀 sb가 null인 환경의 대비책이다. 로그인이 확정되는 순간 pullSaved()가
// 로컬을 서버 기준으로 덮어쓴다.
const SAVED_TABLE = 'saved_restaurants';

// 주소는 실제 가게(realAddress)와 예시 가게(detail.address)가 서로 다른 자리에 들어 있다
function rAddress(r){
  return r.realAddress || (r.detail && r.detail.address) || null;
}

function savedRow(r){
  return {
    user_id: currentUserId,
    restaurant_id: r.id,
    restaurant_name: r.name,
    category: r.cat || null,
    address: rAddress(r),
    lat: (typeof r.lat === 'number') ? r.lat : null,
    lng: (typeof r.lng === 'number') ? r.lng : null,
    visited_at: r.visited ? new Date().toISOString() : null,
  };
}

// 서버 반영은 전부 fire-and-forget이다. 호출 시점에 saveState()가 로컬 저장을 이미 끝냈으므로,
// 여기서 기다리거나 예외를 던지면 네트워크가 느린 것만으로 "담기가 안 된다"고 느끼게 된다.
const ignore = () => {};

function pushMark(r){
  if(!sb || !currentUserId || !r || !r.id) return;
  if(r.saved){
    sb.from(SAVED_TABLE)
      .upsert(savedRow(r), { onConflict:'user_id,restaurant_id' })
      .then(ignore, ignore);
  } else {
    sb.from(SAVED_TABLE).delete()
      .eq('user_id', currentUserId).eq('restaurant_id', r.id)
      .then(ignore, ignore);
  }
}

// 여러 가게가 한꺼번에 바뀌는 경우(마이페이지 초기화, 첫 로그인 시 로컬 기록 업로드)용.
// 지금 담긴 것은 전부 올리고, 담기지 않은 것은 전부 지워서 화면과 표를 통째로 맞춘다.
function pushAllMarks(){
  if(!sb || !currentUserId) return;
  const rows = restaurants.filter(r => r.saved && r.id).map(savedRow);
  const dropIds = restaurants.filter(r => !r.saved && r.id).map(r => r.id);
  if(rows.length){
    sb.from(SAVED_TABLE).upsert(rows, { onConflict:'user_id,restaurant_id' }).then(ignore, ignore);
  }
  if(dropIds.length){
    sb.from(SAVED_TABLE).delete()
      .eq('user_id', currentUserId).in('restaurant_id', dropIds)
      .then(ignore, ignore);
  }
}

// 로그인이 확정된 직후 서버 저장목록을 내려받아 화면과 로컬 캐시를 맞춘다.
function pullSaved(){
  if(!sb || !currentUserId) return;
  const uid = currentUserId;
  sb.from(SAVED_TABLE)
    .select('restaurant_id,visited_at')
    .eq('user_id', uid)
    .then(({ data, error }) => {
      // 네트워크·정책 문제로 못 읽었으면 로컬 캐시를 그대로 둔다. 지우면 오프라인에서
      // 저장목록이 사라진 것처럼 보인다.
      if(error || !data) return;
      // 응답을 기다리는 사이에 계정이 바뀌었으면 남의 화면에 덮어쓰지 않는다
      if(uid !== currentUserId) return;

      const localCount = Object.keys(store.marks[uid] || {}).length;
      // 서버가 비어 있는데 이 브라우저에 담아둔 게 있으면 이 계정의 첫 동기화다 — 한 번 올려준다
      if(data.length === 0 && localCount > 0){ pushAllMarks(); return; }

      const byId = {};
      restaurants.forEach(r => { if(r.id) byId[r.id] = r; });
      const mine = {};
      data.forEach(row => {
        const r = byId[row.restaurant_id];
        if(!r) return; // 목록에서 빠진 가게가 서버에만 남아 있는 경우 — 조용히 무시
        mine[r.name] = { saved:true, visited: !!row.visited_at };
      });
      store.marks[uid] = mine;
      applyState();
      saveState();
      renderCards();
      renderExampleCards();
    }, ignore);
}

// ---- 리뷰(공개 피드) · 손주 식권 예약(개인 목록)도 saved_restaurants와 같은 패턴으로 서버에 남는다 ----
// 리뷰는 저장목록과 달리 "내 것만" 보이는 목록이 아니라 모두가 보는 공개 피드다(구글 리뷰와 같은 성격).
// 그래서 select는 로그인 여부와 무관하게 전체를 읽어오고, mine 여부만 로그인 상태로 가린다.
const REVIEWS_TABLE = 'reviews';
const PASS_ORDERS_TABLE = 'pass_orders';

function reviewRow(rv){
  return {
    id: rv.id,
    user_id: rv.userId,
    restaurant_id: rv.restaurantId || null,
    restaurant_name: rv.place,
    stars: rv.stars,
    body: rv.text,
    photo: rv.photo || null,
    reviewer_name: rv.name,
    reviewer_emoji: rv.emoji,
  };
}
function pushReview(rv){
  if(!sb || !rv.userId) return;
  sb.from(REVIEWS_TABLE).insert(reviewRow(rv)).then(ignore, ignore);
}
function pushReviewDelete(id){
  if(!sb || !currentUserId) return;
  sb.from(REVIEWS_TABLE).delete().eq('id', id).eq('user_id', currentUserId).then(ignore, ignore);
}
function deleteAllMyReviews(){
  if(!sb || !currentUserId) return;
  sb.from(REVIEWS_TABLE).delete().eq('user_id', currentUserId).then(ignore, ignore);
}

// 로그인 여부와 무관하게 페이지 진입 시 한 번 불러온다 — 구글 리뷰처럼 방문자 전체가 보는 공개 피드라서다.
// 실패해도(CDN 차단·오프라인) 마지막으로 받아둔 로컬 캐시(store.reviews)를 그대로 보여준다.
function loadCommunityReviews(){
  if(!sb) return;
  sb.from(REVIEWS_TABLE)
    .select('id,user_id,restaurant_id,restaurant_name,stars,body,photo,reviewer_name,reviewer_emoji,created_at')
    .order('created_at', { ascending:false })
    .limit(200)
    .then(({ data, error }) => {
      if(error || !data) return;
      store.reviews = data.map(row => ({
        id: row.id,
        userId: row.user_id,
        restaurantId: row.restaurant_id,
        name: row.reviewer_name,
        emoji: row.reviewer_emoji,
        stars: row.stars,
        place: row.restaurant_name,
        text: row.body,
        photo: row.photo || '',
        at: (row.created_at || '').slice(0, 10),
      }));
      saveState();
      renderReviews();
    }, ignore);
}

function passOrderRow(o){
  return {
    id: o.id,
    user_id: currentUserId,
    restaurant_id: o.restaurantId || null,
    restaurant_name: o.place,
    emoji: o.emoji,
    unit_price: o.unit,
    count: o.count,
    bonus: o.bonus,
    total: o.total,
  };
}
function pushPassOrder(o){
  if(!sb || !currentUserId) return;
  sb.from(PASS_ORDERS_TABLE).insert(passOrderRow(o)).then(ignore, ignore);
}
function deletePassOrder(id){
  if(!sb || !currentUserId) return;
  sb.from(PASS_ORDERS_TABLE).delete().eq('id', id).eq('user_id', currentUserId).then(ignore, ignore);
}
function deleteAllPassOrders(){
  if(!sb || !currentUserId) return;
  sb.from(PASS_ORDERS_TABLE).delete().eq('user_id', currentUserId).then(ignore, ignore);
}

// 손주 식권은 저장목록과 같은 "내 것만" 개인 목록이라 로그인 직후 서버 기준으로 맞춘다.
// passOrders는 계정별로 분리 저장된 적이 없어(store.marks와 달리 평평한 배열), 같은 브라우저에서
// 다른 계정으로 로그인해도 로컬 캐시가 그대로 남아 있을 수 있다 — 그래서 "서버가 비어 있으면
// 로컬 값을 올려준다"는 한 번뿐인 승계(store.passOrdersAdopted)로 제한한다. 승계 없이 매번
// 다시 시도하면 다른 계정의 로컬 잔여물을 새 계정 것으로 잘못 올릴 수 있다.
function pullPassOrders(){
  if(!sb || !currentUserId) return;
  const uid = currentUserId;
  sb.from(PASS_ORDERS_TABLE)
    .select('id,restaurant_id,restaurant_name,emoji,unit_price,count,bonus,total,created_at')
    .eq('user_id', uid)
    .then(({ data, error }) => {
      if(error || !data) return;
      if(uid !== currentUserId) return;

      if(data.length === 0 && store.passOrders.length > 0 && !store.passOrdersAdopted){
        store.passOrdersAdopted = true;
        store.passOrders.forEach(pushPassOrder);
        saveState();
        return;
      }
      store.passOrdersAdopted = true;
      store.passOrders = data
        .map(row => ({
          id: row.id,
          place: row.restaurant_name,
          restaurantId: row.restaurant_id,
          emoji: row.emoji,
          count: row.count,
          bonus: row.bonus,
          unit: row.unit_price,
          total: row.total,
          at: (row.created_at || '').slice(0, 10),
        }))
        .sort((a, b) => (b.at || '').localeCompare(a.at || ''));
      saveState();
      renderMypage();
    }, ignore);
}

// ---- 사장님 권한(role) — 접근 제어 구조만 (화면은 아직 없음, next.md C5) ----
// store_owners는 클라이언트가 쓸 수 없는 표다(관리자가 SQL Editor로만 행을 추가한다).
// 여기서는 로그인한 사람이 자신이 어느 가게의 사장님으로 지정됐는지 읽어오는 것까지만 한다.
let myOwnedRestaurantIds = [];
function isStoreOwner(){ return myOwnedRestaurantIds.length > 0; }
function loadStoreOwnership(){
  if(!sb || !currentUserId){ myOwnedRestaurantIds = []; return; }
  const uid = currentUserId;
  sb.from('store_owners').select('restaurant_id').eq('user_id', uid)
    .then(({ data, error }) => {
      if(error || !data) return;
      if(uid !== currentUserId) return; // 응답을 기다리는 사이 계정이 바뀌면 무시
      myOwnedRestaurantIds = data.map(row => row.restaurant_id);
    }, ignore);
}

// ---- 사이트 관리자(다른 개념) — "내가 사장님인가"가 아니라 "내가 문의를 승인할 수 있는가" ----
// 관리자를 클라이언트에서 판정하지 않는다. 마이페이지가 열릴 때마다 서버에 문의 목록을 요청만
// 해보고, 서버(api/admin-contacts.js)가 세션 토큰의 이메일을 ADMIN_EMAIL과 직접 대조해 200/403을
// 준다 — 관리자 이메일은 이 파일 어디에도 없다(공개 저장소 소스에 노출하지 않기 위해).
let isAdmin = false;
let adminContacts = [];
function loadAdminStatus(session){
  if(!session){ isAdmin = false; adminContacts = []; return; }
  fetch('/api/admin-contacts', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + session.access_token },
    body: JSON.stringify({ action:'list' }),
  })
    .then(r => r.json().then(data => ({ ok:r.ok, data })))
    .then(({ ok, data }) => {
      if(ok && data && data.ok){
        isAdmin = true;
        adminContacts = data.items || [];
      } else {
        isAdmin = false; // 대부분의 로그인 사용자에게 정상적인 결과다(403) — 조용히 넘어간다
      }
      if(mypageOverlay && mypageOverlay.classList.contains('show')) renderMypage();
    }, () => { isAdmin = false; });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ================= 다국어(영어) 지원 =================
// 정적 HTML은 [data-i18n]/[data-i18n-placeholder]/[data-i18n-title] 속성으로 태그해두고,
// 최초 방문(한국어)한 그대로의 텍스트를 data-i18n-ko-cache에 보관했다가 언어 전환 시 복원한다.
// 동적으로 생성되는 카드/모달 문구는 t(key)로 직접 끌어다 쓴다.
// 범위: 헤더·히어로·문제·로드맵·지도·맛집 카드/상세·구글 리뷰·실시간 검색 등 핵심 경로.
// 설문·마이페이지·게임·로그인·문의·식권·소개·FAQ 모달과 약관 페이지는 다음 단계에서 번역 예정.
const i18n = { en: {
  pageTitle:"Bap Meokeoreo Wa — Discover Jochiwon's Local Restaurants",
  navSearch:"Search", navGame:"Menu Roulette Game", navSurvey:"Taste Survey", navLang:"Language", navTheme:"Switch light/dark", navLogin:"Sign in",
  mapFilterAria:"Map display type", mapFilterAll:"All", mapFilterFood:"Food", mapFilterCafe:"Cafes",
  navMenuAria:"Main sections", navMenuEat:"Restaurants", navMenuMap:"Map", navMenuAbout:"About", navMenuJoin:"Get involved",
  navLogout:"Sign out",
  headerSearchPh:"Search restaurants, meal passes, partners, pages",
  heroEyebrow:"KU-jodae! Help the Local Owners",
  heroTitle:'Did you know there are great restaurants missing or barely listed on Naver? <span>Now you do.</span>',
  heroBody:'A student team from Korea University Sejong Campus, <b>Matjip KU-jodae</b>, walks the backstreets of Jochiwon-eup to find them. We\'re starting by tracking down real local restaurants that are either completely missing from Naver/Kakao Map, or listed with barely any information. Discover great-value local restaurants that Korea University and Hongik University Sejong students and nearby residents can enjoy together.',
  heroBrowse:"Browse restaurants", heroNotify:"Get notified at launch",
  heroQuickpick:"Decision Rescue · Pick for me in 3 seconds", heroSpeech:"Come eat with us!",
  problemEyebrow:"WHY BAP MEOKEOREO WA", problemTitle:"If you only trust map apps, you'll miss out on great food",
  problemSub:"A familiar story for Korea University and Hongik University Sejong students, exchange students, staff, and nearby residents.",
  problem1Title:"Missing or barely listed on maps",
  problem1Body:"Long-time local restaurants are often completely missing from Naver/Kakao Map, or listed without even a single photo — so they don't show up even when you search.",
  problem2Title:"Always the same cafeteria",
  problem2Body:"There are better-value, tastier local restaurants nearby, but with no way to find them, you keep making the same choice.",
  problem3Title:"We need to help each other",
  problem3Body:"Customers discover hidden gems, and owners get more visibility and sales — a structure where our whole neighborhood thrives together.",
  discoverEyebrow:"COMING SOON", discoverTitle:"After the semester starts, we'll visit local owners in person",
  discoverBody:"Real local restaurants that are completely unlisted, or listed with barely any information — our student team will walk the backstreets of Jochiwon-eup after the semester starts in September, meet the owners, and introduce them here one by one. Restaurants with a 🌐 badge below are a preview of how live Google review integration looks; the real list of local restaurants we've personally found and helped will fill this space soon.",
  discoverStep1:"Field survey of Jochiwon-eup backstreets (after September semester start)",
  discoverStep2:"Finding under-listed local owners and filling in their info",
  discoverStep3:"Publishing them here as real local restaurants, one by one",
  discoverBtn:"Report a local restaurant near you",
  mapEyebrow:"MAP", mapTitle:"Jochiwon Mini Map",
  mapBody:"Locations of restaurants we've actually confirmed. Tap a pin to see details. The rest will be added one by one after the September field survey.",
  mapCampusLabel:"🏫 Korea University Sejong Campus",
  mapAuthFail:"Couldn't load the map.",
  eatLocalEyebrow:"EAT LOCAL", eatLocalTitle:"What to eat today?",
  realGridTitle:"📍 Confirmed real restaurants · Live Google reviews",
  realGridSub:"Restaurants actually registered on Kakao/Google. Click one to see real ratings and reviews instantly.",
  liveSearchPh:"Can't find a restaurant? Type a name to search nearby in real time",
  liveSearchBtn:"Search",
  catAll:"All", catKorean:"Korean", catWestern:"Western", catChinese:"Chinese", catJapanese:"Japanese", catSnack:"Snacks", catCafe:"Cafes",
  descVarCafe0:"A good-vibes cafe in a Jochiwon-eup backstreet",
  descVarCafe1:"A backstreet cafe for a quick cup",
  descVarCafe2:"A backstreet cafe to drop by between classes",
  descVarCafe3:"A Jochiwon-eup backstreet cafe to settle into",
  descVarCafe4:"A Jochiwon-eup backstreet cafe for one more cup",
  descVarKorean0:"A hearty Korean spot in a Jochiwon-eup backstreet",
  descVarKorean1:"A filling meal in a Jochiwon-eup backstreet",
  descVarKorean2:"The backstreet Korean spot for \"what should I eat today\"",
  descVarKorean3:"A Jochiwon-eup backstreet spot for home-style cooking",
  descVarWestern0:"A cozy Western restaurant in a Jochiwon-eup backstreet",
  descVarWestern1:"A knife-and-fork meal in a Jochiwon-eup backstreet",
  descVarWestern2:"A Jochiwon-eup backstreet spot for a slightly special day",
  descVarChinese0:"A wok-fired Chinese spot in a Jochiwon-eup backstreet",
  descVarChinese1:"A one-bowl Chinese spot in a Jochiwon-eup backstreet",
  descVarChinese2:"A Jochiwon-eup backstreet spot worth the jjajang-or-jjamppong debate",
  descVarJapanese0:"A quiet Japanese restaurant in a Jochiwon-eup backstreet",
  descVarJapanese1:"A one-bowl Japanese spot in a Jochiwon-eup backstreet",
  descVarJapanese2:"A Jochiwon-eup backstreet spot you slurp clean",
  descVarSnack0:"A nostalgic bunsik shop in a Jochiwon-eup backstreet",
  descVarSnack1:"A backstreet bunsik shop for a light bite",
  descVarSnack2:"A Jochiwon-eup backstreet spot for tteokbokki cravings",
  // 가게 이름 다국어 — restaurants[]에서 이전(rName()이 조회). id 순서 = restaurants[] 순서.
  "name_jochiwon-halmae-gukbap":"Jochiwon Grandma's Gukbap (조치원 할매국밥)",
  "name_yeokjeon-wang-donkatsu":"Yeokjeon King Donkatsu (역전 왕돈까스)",
  "name_an-chef-jjambbong":"An-Chef Meat & Seafood Jjambbong (안쉐프고기해물짬뽕)",
  "name_jagal-dondon":"Jagal Dondon (자갈돈돈)",
  "name_wooridul-sikdang":"Wooridul Sikdang (우리들식당)",
  "name_paul-barna":"Paul, Barna (폴바나)",
  "name_donseu":"Donseu (돈스)",
  "name_the-ramen":"The Ramen (더라멘)",
  "name_sushi-power-plant-12g":"Sushi Power Plant 12g (초밥발전소12g)",
  "name_halmoni-tteokbokki":"Grandma's Tteokbokki (할머니 떡볶이)",
  "name_parangsae-bunsik":"Blue Bird Bunsik (파랑새분식)",
  "name_sookine-bapsang":"Sooki's Table (숙이네밥상)",
  "name_seochangri-181":"Seochang-ri 181 (서창리181)",
  "name_sammat-cafe":"Samat Cafe (삼맛카페)",
  "name_vanilla-garden":"Vanilla Garden (바닐라가든)",
  "name_dankong":"Dankong (단콩)",
  "name_paul-and-banabas":"Paul and Barnabas (폴앤바나바스)",
  "name_cafe-sujak":"Cafe Sujak (카페수작)",
  "name_cafe-calendar":"Cafe Calendar (카페캘린더)",
  "name_hong-cafe":"Hong Cafe (홍카페)",
  "name_matna-sikdang-bunsik":"Matna Restaurant & Bunsik (맛나식당분식)",
  "name_imone-dwaeji-gukbap":"Imone Dwaeji-gukbap (이모네돼지국밥)",
  "name_bundang-ilpum-guksu":"Bundang Ilpum Noodles (분당일품국수)",
  "name_urban-lounge":"Urban Lounge (어반라운지)",
  "name_gyodong-jjambbong":"Gyodong Jjamppong (교동짬뽕)",
  "name_naive":"Naive (나이브)",
  "name_yuram-coffee-roasters":"Yuram Coffee Roasters (유람 커피로스터스)",
  "name_daily-point":"Dilly Point (딜리포인트)",
  "name_hunminjeongeum":"Hunminjeongeum (훈민정음)",
  "name_siot":"Siot (시옷)",
  "name_vib":"Vibe (비브)",
  "name_neomeo":"Neomeo (너머)",
  "name_chas":"Chas (차스)",
  "name_second-road":"Second Road (세컨로드)",
  "name_merry-go-round":"Merry-Go-Round (메리고라운드)",
  "name_roastery-cafe-in":"Roastery Cafe IN (로스터리 카페IN)",
  "name_defense":"Defense (디펜스)",
  // 가게 설명 다국어 — descVariant()에 안 걸리는 가게만(rDesc()가 조회).
  "desc_jochiwon-halmae-gukbap":"A well-known gukbap house with 40 years of tradition and rich broth",
  "desc_yeokjeon-wang-donkatsu":"Thick handmade donkatsu with generous portions",
  "desc_an-chef-jjambbong":"A spicy jjambbong spot serving both meat and seafood",
  "desc_jagal-dondon":"A grilled-meat restaurant in a Jochiwon-eup backstreet",
  "desc_wooridul-sikdang":"A home-style Korean set-meal restaurant in a Jochiwon-eup backstreet",
  "desc_donseu":"A donkatsu and udon spot in a Jochiwon-eup backstreet",
  "desc_the-ramen":"A ramen shop in a Jochiwon-eup backstreet",
  "desc_sushi-power-plant-12g":"A sushi and roll specialist in a Jochiwon-eup backstreet",
  "desc_halmoni-tteokbokki":"Sweet and spicy old-school tteokbokki, a student favorite snack",
  "desc_sookine-bapsang":"A home-style Korean set-meal restaurant in a Jochiwon-eup backstreet",
  pagerAria:"Restaurant list pages", pagerPrev:"Previous page", pagerNext:"Next page",
  sortRecommend:"Recommended", sortName:"Name (A-Z)", sortRating:"Highest rated", sortReviews:"Most reviewed", sortLatest:"Latest", sortDistance:"Nearest",
  priceMin:"Min", priceMax:"Max", priceWon:"KRW",
  filterEmpty:"No restaurants match these filters yet.",
  filterEmptySub:"How about these?", filterReset:"Clear filters and show everything",
  filterEmptyKorean:"🍚 Korean", filterEmptyJapanese:"🍜 Japanese", filterEmptyWestern:"🍝 Western",
  exampleGridTitle:"🔎 Example restaurants (pending field survey)",
  exampleGridSub:'Placeholder info until the field survey is done. Tap the heart to save a spot to "Want to visit."',
  loadMore:'Show more restaurants <span class="badge-soon">Opening in September</span>',
  reviewEyebrow:"REVIEW", reviewTitle:"Stories from people who've been there",
  reviewSearchPh:"Search reviews (restaurant name, keyword)",
  reviewWriteBtn:"Write a review too",
  reviewSoon:"<strong>Review data coming soon</strong> — once real visit reviews build up after the September semester start, an AI review summary feature will launch too.",
  surveyTitle:"Tell us a bit about your taste", surveyBody:"Answer a quick survey on spice level, favorite categories, and budget to get restaurant picks matched to you.", surveyBtn:"Start the taste survey",
  shareEyebrow:"SHARE", shareTitle:"Tell your friends at school too",
  shareBody:'Hidden gems get even better the more they\'re shared. Recommend "Bap Meokeoreo Wa" to a friend.',
  shareKakao:"Share on KakaoTalk", shareCopy:"Copy link", shareText:"Share by text", shareInsta:"Share on Instagram",
  joinEyebrow:"TOGETHER", joinTitle:"Let's build this together",
  joinBody:"For owners, for us, for neighbors — we've made room for anyone who wants to join this project.",
  join1Title:'Are you an owner?<span class="badge-soon">Opening in September</span>',
  join1Body:"A signup spot for Jochiwon local restaurant owners who want their restaurant featured.",
  join2Title:"Lend us a hand", join2Body:"We're looking for people to join as teammates for planning, development, design, and field research.",
  join3Title:"Tell us about local spots in your area too", join3Body:"Even outside Jochiwon, if you connect with what we're doing, let's talk anytime.",
  signupTitle:"Be the first to know", signupBody:"We'll email you first when the beta launches and when new restaurants are added.",
  signupEmailPh:"Enter your email address", signupBtn:"Sign up early",
  signupErrEmail:"That email address looks a little off! 💌",
  signupMsg:"You're signed up! We'll let you know first when we launch 🌾",
  footerAbout:'"KU-jodae! Help the Local Owners" — a social contribution project by Matjip KU-jodae, a Korea University Sejong Campus student team, built to grow together with the local business community.',
  footerServiceHead:"Service", footerMapLink:"View map", footerPassLink:'Grandchild meal pass<span class="badge-live">Reservations open</span>', footerSponsorLink:"Support us",
  footerInfoHead:"Info", footerIntroLink:"About this service", footerFaqLink:"Contact us", footerSignupLink:"Sign up for launch alerts",
  footerAdminHead:"Admin", footerAnalyticsLink:"Usage analytics", footerOwnerLink:"Owner page",
  adminGateTitle:"Admin check", adminGateBody:"You're heading to the usage analytics page. Please enter the password.",
  adminGateOk:"Enter", adminGateWrong:"That password doesn't match.",
  footerLegalHead:"Legal", footerPrivacyLink:"Privacy Policy", footerTermsLink:"Terms of Service",
  footerOperator:"<b>Operator</b> Matjip KU-jodae, a Korea University Sejong Campus student team",
  footerProject:"<b>Project name</b> KU-jodae! Help the Local Owners",
  footerServiceName:"<b>Service name</b> Bap Meokeoreo Wa",
  footerEmail:"<b>Contact email</b> (to be announced)",
  footerOfficer:"<b>Privacy officer</b> (to be announced)",
  footerBottom:"© 2026 Bap Meokeoreo Wa · KU-jodae! Help the Local Owners. Matjip KU-jodae (Korea University Sejong Campus).",
  a11yToggle:"🔍 Large text mode",
  confirmOk:"OK", confirmNo:"No",
  // 카드/상세/구글 리뷰/실시간 검색 (동적 렌더)
  cardReviewPending:"🔎 Live reviews coming soon", cardVisitBadge:"✔ Visited", cardLiveBadge:"🌐 Live Google reviews", cardMockTag:"Example data",
  cardVisitedLabel:"✔ Visit recorded", cardMarkVisited:"Mark as visited", cardWantToVisit:"Add to want-to-visit",
  filterCountTemplate:"{n} restaurants",
  detailAddress:"📍 Address", detailHours:"🕐 Hours", detailClosed:"🚫 Closed", detailPhone:"☎️ Phone", detailReservation:"📅 Reservations",
  copyAddressBtn:"Copy address", copyPhoneBtn:"Copy phone number",
  copyOkTitle:"Copied", copyOkBody:"It's on your clipboard — paste it wherever you need.",
  copyFailTitle:"Couldn't copy", copyFailBody:"Your browser blocked the copy. Please select the text and copy it by hand.",
  detailCapacity:"🪑 Capacity", detailParking:"🚗 Parking", detailMobilePay:"📱 Mobile pay", detailVouchers:"🎟️ Vouchers/passes",
  detailMenuTitle:"Menu", detailOrigin:"Origin: ", detailExampleNote:"* This is example info — real details will be added after the field survey.",
  detailStubTitle:"Details coming soon", detailStubBody:" will be added after the September field survey. See the Jochiwon Grandma's Gukbap card for a preview of what will be included.",
  detailStubBodyFull:"Address, hours, menu, and ingredient origin",
  detailStubBodyPartial:"Hours, menu, and ingredient origin",
  closeBtn:"Close",
  googleReviewTitle:"Google Reviews", googleReviewLoading:"Loading reviews...", googleReviewError:"Couldn't load reviews. Please try again shortly.",
  aiSummaryTitle:"AI Review Summary", aiSummaryLoading:"🤖 Summarizing reviews...",
  detailMapFocus:"🗺️ View on map",
  detailNoLocationNote:"🧭 This is example data with no real location yet, so it can't be shown on the map.",
  googleReviewNotFound:"😢 We couldn't find this restaurant on Google Maps.", googleReviewNone:"No reviews yet.",
  googleReviewLink:"See all reviews on Google Maps →", googleReviewAnon:"Anonymous",
  liveSearchLoading:"Searching...", liveSearchEmpty:"No results found.", liveSearchError:"Search failed. Please try again shortly.",
  searchNoResultsFor:"No results for \"{q}\".", searchDidYouMean:"Did you mean?",
  searchCheckSpelling:"Please check that your search term is spelled correctly.", searchMaybeThisShop:"Did you mean one of these shops?",
  confirmLoginTitle:"Sign-in required", confirmLoginBody:"This feature requires signing in. Sign in and build your own restaurant list!", confirmLoginOk:"Sign in", confirmLoginCancel:"Close",
  discardTitle:"Leave without finishing?", discardBody:"What you've picked so far won't be saved.",
  discardOk:"Leave", discardCancel:"Keep going",
  confirmUnsave:"Remove from your want-to-visit list?", confirmUnsaveVisited:"Remove from your want-to-visit list? Your visit record for this place will be deleted too.", confirmSave:"Add this restaurant to your want-to-visit list?", confirmVisited:"Mark this restaurant as visited?",
  // 취향 설문
  surveyPrev:"Previous", surveyNext:"Next", surveyResult:"See results",
  surveyResultTitle:"How about these?", surveyResultSub:"Local restaurants picked to match your taste",
  // 메뉴 추천 게임
  gameTitle:"Let's decide what to eat, game-style", gameSub:"No more indecision! Pick one of the two",
  gameTarotName:"Today's Menu Tarot", gameTarotDesc:"Draw a card and reveal your restaurant destiny",
  gameRouletteName:"Menu Roulette", gameRouletteDesc:"Type what you're craving and let the roulette decide",
  gameBack:"← Pick a different game",
  tarotTitle:"Today's Menu Tarot", tarotSub:"{n} cards are flowing by. Tap to draw today's meal",
  tarotRedraw:"Draw again",
  rouletteTitle:"Menu Roulette", rouletteSub:"Add 2 or more items you're craving, then spin",
  roulettePh:"e.g. gukbap, pizza, malatang", rouletteAdd:"Add",
  rouletteEmpty:"Add some menu items", rouletteMin:"Add 2 or more menu items",
  rouletteReady:"{n} items to pick from", rouletteSpin:"🎡 Spin", rouletteRespin:"🎡 Spin again", rouletteSlotLabel:"Number of slots",
  // 손주 로그인/가입
  authIntentSave:"To save places you want to visit, become one of our grandchildren first!",
  authIntentMypage:"You'll need to register to use My Page.",
  authIntentReview:"Please register first to leave a review.",
  authIntentPass:"Meal passes are saved to your account, so please register first.",
  authIntentLogin:"Welcome back! Please sign in to your account.",
  authTitle:"Become one of our grandchildren", authTabSignup:"Register", authTabLogin:"Sign in",
  authNameLabel:"Name", authNamePh:"What should we call you?",
  authIdLabel:"Email", authIdPh:"example@mail.com",
  authPwLabel:"Password", authPwPh:"Password",
  authPw2Label:"Confirm password", authPw2Ph:"Enter your password again",
  authSubmitSignup:"Register and get started", authSubmitLogin:"Sign in",
  authErrFormat:"Please enter a valid email address.",
  authErrPwMismatch:"Passwords don't match. Please check again.",
  authErrDupe:'This account already exists. Please sign in from the "Sign in" tab.',
  authErrNotFound:'No account found. Please register first from the "Register" tab.',
  authErrPwShort:"Password must be at least 6 characters.",
  mypageResetSaved:"Clear want-to-go list", mypageResetVisited:"Clear visited list", mypageResetPass:"Clear voucher bookings",
  resetSavedTitle:"Clear want-to-go list", resetSavedBody:"This clears every place you saved. Your visited list and voucher bookings stay.",
  resetVisitedTitle:"Clear visited list", resetVisitedBody:"This clears every visited mark. Your saved list and your reviews stay.",
  resetPassTitle:"Clear voucher bookings", resetPassBody:"This clears every voucher booking. Your saved and visited lists stay.",
  authErrPwEmpty:"Please enter your password.",
  authErrNameEmpty:"Please tell us what to call you.",
  authErrNotConfirmed:"Your email isn't verified yet. Please check your inbox.",
  authErrNeedConfirm:"We sent you a confirmation email. Please verify it, then sign in.",
  authErrRate:"Too many requests. Please try again in a moment.",
  authErrNetwork:"Connection failed. Please try again in a moment.",
  authErrOffline:"Can't reach the sign-in server right now. Please try again in a moment.",
  authErrGeneric:"Something went wrong. Please try again in a moment.",
  authErrWrongPw:"Incorrect password.",
  authWelcomeTitle:"Welcome, {name}!", authWelcomeBody:"Registration complete. We'll let you know first when we officially launch.",
  authWelcomeBodyLogin:"Welcome back! Great to see you again.",
  authWelcomeMypageBtn:"Go to My Page",
  headerAuthSavedLabel:"My saved places", headerAuthMypageTitle:"{name}'s My Page",
  logoutTitle:"Sign out?", logoutBody:"After signing out, you'll need to sign in again to use saved lists, write reviews, and more.",
  logoutOk:"Sign out", logoutCancel:"Cancel",
  // 마이페이지
  mypageTitle:"{name}'s My Page", mypageTitleGeneric:"My Page",
  mypageTabSaved:"Want to visit", mypageTabVisited:"Visited", mypageTabPass:"Meal passes",
  allergyTitle:"🥜 Allergy settings", allergySub:"We'll warn you before opening a place that may use what you pick.",
  allergyWarnTitle:"Heads up before you go in", allergyWarnBody:"This place may serve dishes containing {list}. Please check with the owner before ordering.",
  allergyWarnOk:"Got it, show me",
  allergen_shellfish:"Shellfish", allergen_fish:"Fish & seafood", allergen_milk:"Milk", allergen_wheat:"Wheat & gluten",
  allergen_nuts:"Nuts", allergen_pork:"Pork", allergen_beef:"Beef", allergen_egg:"Egg",
  mypageResetLink:"Reset all my activity", mypageLogoutBtn:"Sign out",
  mypageEmptySaved:"No saved restaurants yet.", mypageEmptyVisited:"No visit records yet.",
  mypageEmptyPass:"No meal passes reserved yet.<br>Pick a restaurant you like in the grandchild meal pass section.",
  mypageRemoveSavedTitle:"Remove from want-to-visit", mypageRemoveVisitedTitle:"Cancel visit record",
  mypageConfirmUnvisit:"Cancel this visit record?",
  mypageCancelPassTitle:"Cancel reservation", mypageConfirmCancelPass:"Cancel this meal pass reservation?", mypageCancelPassOk:"Cancel reservation",
  resetTitle:"Reset my activity", resetBody:"This clears your saved places, visit records, your reviews, and meal pass reservations. This can't be undone.",
  resetOk:"Reset", resetCancel:"Cancel",
  // 리뷰 작성
  reviewFormTitle:"Write a review too", reviewFormSub:"Share an honest review of a restaurant you've visited.",
  reviewFormNoVisitTitle:"You can't write a review yet", reviewFormNoVisitBody:"You can only review restaurants you've marked as visited.",
  reviewFormNoVisitOk:"Browse restaurants",
  reviewRatingLabel:"Rating", reviewPlaceLabel:"Restaurant visited",
  reviewVisibilityLabel:"Show as", reviewVisibilityReal:"Real name ({name})", reviewVisibilityAnon:"Anonymous",
  reviewPhotoLabel:"Attach a photo", reviewOptional:"Optional",
  visitVerifyTitle:"Verify your visit",
  visitVerifySub:"Did you really go to {name}? Upload a receipt or a photo of the shop's sign.",
  visitVerifyNote:"You can only review places you've actually been to. The photo is used for the check only and is not stored.",
  visitVerifyPhotoLabel:"Receipt or storefront photo",
  visitVerifySubmit:"Verify", visitVerifyChecking:"Checking...",
  visitVerifyPreviewAlt:"Preview of the photo you uploaded",
  visitVerifyErrNoPhoto:"Please upload a photo first.",
  visitVerifyErrRead:"We couldn't read that photo. Please try another one.",
  visitVerifyErrServer:"Verification isn't available right now. Please try again in a moment.",
  visitVerifyFailKind:"This doesn't look like a receipt or a photo of the shop's sign.",
  visitVerifyFailName:"We couldn't find this restaurant's name in the photo.",
  reviewContentLabel:"Review", reviewContentPh:"What did you like about it?",
  reviewSubmitBtn:"Post review", reviewErrEmpty:"Please write your review.",
  reviewSuccessTitle:"Your review is posted!",
  reviewSuccessBodyOk:"Thanks for sharing! It's now live in the review list.",
  reviewSuccessBodyFail:"Added to the review list. The photo was too large to save, though — it may disappear on reload.",
  anonReviewerName:"Anonymous grandchild", namedReviewerSuffix:" (grandchild)", defaultReviewerName:"A grandchild",
  // 서비스 소개
  introSub:"Local restaurant discovery for Jochiwon-eup",
  introVision:"Finding real neighborhood restaurants that are missing or poorly listed on maps, and building a local business ecosystem where customers and owners thrive together",
  introOverviewHead:"Project overview",
  introOverviewBody:'"KU-jodae! Help the Local Owners" — a student-led service that began as a Korea University Sejong Campus social contribution project. Students and residents personally find and introduce local Jochiwon-eup restaurants that are missing from Naver/Kakao Map, or listed with barely any information.',
  introMakerHead:"Who made this",
  introMakerBody:"A social contribution project planned and built by Matjip KU-jodae, an Economic Policy student team at Korea University Sejong Campus.",
  introProgressHead:"Progress",
  introProgressBody:"We're currently in the pre-launch stage taking early sign-ups. We plan to start the full service after filling in real restaurant data through a field survey following the September semester start.",
  introFaqBtn:"Frequently asked questions",
  // FAQ
  faqTitle:"Contact us", faqSub:"Check the FAQ first for a quick answer.",
  faqQ1:"What is Bap Meokeoreo Wa?",
  faqA1:'It\'s a service created by the "KU-jodae! Help the Local Owners" project. Students and residents personally find and introduce local Jochiwon-eup restaurants that are missing from online maps like Naver/Kakao Map, or listed with barely any information.',
  faqQ2:"Is this before the official launch?",
  faqA2:"Yes, we're currently taking early sign-ups in a preparation stage, and plan to launch the full service with real restaurant data after the September semester starts.",
  faqQ3:"Can my restaurant be listed too?",
  faqA3:'Yes! We\'re preparing an owner registration page. We\'ll guide you through it via the "Are you an owner?" button as it becomes available.',
  faqQ4:"Can anyone write a review?",
  faqA4:"Only signed-in members can write a review, and only for restaurants they've marked as visited — a minimal safeguard against fake reviews.",
  faqQ5:"How is my personal information used?",
  faqA5:"It's used only for the purposes stated in our Privacy Policy (member identification, providing the service), and is managed securely under relevant laws.",
  faqQ6:"I'd like to volunteer or join as a team member.",
  faqA6:'Leave an inquiry via the "Lend us a hand" menu and we\'ll guide you through next steps.',
  faqFootPrefix:"Can't find your answer? Reach out through ", faqFootBold:"Lend us a hand", faqFootSuffix:".",
  faqContactBtn:"Send an inquiry",
  // 참여/후원/제휴 문의
  supportTitle:"Lend us a hand", supportSub:"We're waiting for helping hands on this project.",
  supportTeamTitle:"I'd like to join as a team member", supportTeamDesc:"From field research to planning and development — there's a place for you.",
  supportSponsorTitle:"I'd like to support this project", supportSponsorDesc:"Help power a project run on a non-profit basis.",
  contactNameLabel:"Name", contactNamePh:"Name or nickname",
  contactReachLabel:"Contact / email", contactReachPh:"Email or phone number to reach you",
  contactMessageOptional:"Optional", contactSubmitBtn:"Send inquiry",
  contactErrName:"Please enter your name.", contactErrReach:"Please enter a valid email or phone number.",
  contactBack:"Back", contactSuccessTitle:"Your inquiry is in!",
  contactSuccessBody:"Thanks, {name}. We'll follow up using the contact info you left.<br>({type})",
  ct_team_title:"I'd like to join as a team member", ct_team_sub:"We're waiting for teammates to help build this with us.",
  ct_team_note:"Planning, development, design, field research — any role is welcome. We'll reach out using the contact info you leave.",
  ct_team_field:"Area you'd like to help with",
  ct_team_opt1:"Field research (finding restaurants)", ct_team_opt2:"Planning / Operations", ct_team_opt3:"Design", ct_team_opt4:"Development", ct_team_opt5:"Marketing / Content", ct_team_opt6:"Not sure yet",
  ct_team_msgLabel:"Anything else you'd like to share", ct_team_msgPh:"Feel free to share why you'd like to join or when you're available.",
  ct_sponsor_title:"I'd like to support this project", ct_sponsor_sub:"Every bit of support helps us find one more local restaurant.",
  ct_sponsor_note:"This project currently runs on a non-profit basis, so donations will only be used for field research and operating costs.",
  ct_sponsor_field:"Type of support",
  ct_sponsor_opt1:"One-time donation", ct_sponsor_opt2:"Recurring donation", ct_sponsor_opt3:"In-kind / skill donation", ct_sponsor_opt4:"Just want to ask first",
  ct_sponsor_msgLabel:"Message about your support", ct_sponsor_msgPh:"Share any questions or thoughts about supporting us.",
  ct_partnerStore_title:"Owner partnership application", ct_partnerStore_sub:"Let's prepare meal passes and student perks together.",
  ct_partnerStore_note:"Listing and partnership applications are free. You set the meal pass benefits and validity period; the fee structure is still under discussion.",
  ct_partnerStore_field:"Preferred benefit",
  ct_partnerStore_opt1:"10+1 meal pass", ct_partnerStore_opt2:"Student discount", ct_partnerStore_opt3:"Set menu discount", ct_partnerStore_opt4:"Just want to ask first",
  ct_partnerStore_msgLabel:"About your restaurant / anything else", ct_partnerStore_msgPh:"Share your restaurant's name, location, and what benefit you're considering.",
  ct_partnerOrg_title:"Student council / club partnership inquiry", ct_partnerOrg_sub:"Let's create benefits for your organization's members.",
  ct_partnerOrg_note:"Korea University Sejong Campus already has partner restaurants like the KU Membership program. We want to help local restaurants not on the map join that same space — terms are still under discussion.",
  ct_partnerOrg_field:"Organization type",
  ct_partnerOrg_opt1:"Student council", ct_partnerOrg_opt2:"Club", ct_partnerOrg_opt3:"Campus organization", ct_partnerOrg_opt4:"Other group",
  ct_partnerOrg_msgLabel:"What kind of partnership you'd like", ct_partnerOrg_msgPh:"Share your organization's name, size, and what benefit you'd like.",
  ct_expand_title:"Find local restaurants in my area too", ct_expand_sub:"Even outside Jochiwon, if you connect with what we're doing.",
  ct_expand_note:"The revenue model isn't finalized yet. We're currently discussing non-profit expansion and figuring out how to work together.",
  ct_expand_field:"Area you're suggesting", ct_expand_fieldPh:"e.g. Dodam-dong Sejong, Sachang-dong Cheongju",
  ct_expand_msgLabel:"Your suggestion", ct_expand_msgPh:"Tell us about the neighborhood and why this service would help there.",
  // 손주 식권
  passPerUnit:"per pass", passValidDays:"Valid for {n} days", passBuyBtn:"Reserve meal pass",
  passSelectTitle:"{name} meal pass", passHowMany:"How many would you like?",
  passSummaryCount:"{n} passes", passSummaryBonus:"Owner bonus +{n} passes", passSummaryTotal:"Passes you'll receive", passSummaryAmount:"Amount due",
  passNextBtn:"Next", passConfirmTitle:"Reserve like this?", passConfirmSub:"We'll submit a reservation with the details below.",
  passSummaryStore:"Restaurant", passSummaryBought:"Passes purchased", passSummaryValid:"Valid period", passSummaryValidVal:"{n} days from first use",
  passPrepayNote:"This only submits a <b>pre-order</b> right now. Real payment will connect at official launch — no money is charged at this stage.",
  passSubmitBtn:"Submit pre-order", passBackBtn:"Back",
  passSuccessTitle:"Your reservation is in!",
  passSuccessBodyOk:"We've saved {n} passes for {name}. We'll notify you about payment once we officially launch.",
  passSuccessBodyFail:"We've saved your {name} pass, but storage was full so we couldn't record it — it may disappear on reload.",
  passSeeMyPasses:"See my meal passes",
  // 손주 식권 안내 (정적 페이지)
  passInfoTitle:'Grandchild Meal Pass<span class="badge-live">Reservations open</span>',
  passInfoBody:"Pre-load a meal pass for a restaurant you like. Get extra passes based on what the owner offers, then use one each visit.",
  passBenefit1Title:"Buy 10, get 1 free", passBenefit1Body:"Buy in bulk and get extra passes set by the owner. Benefits vary by restaurant.",
  passBenefit2Title:"Prepay for meals", passBenefit2Body:"Prepay instead of paying meal by meal, and lighten the burden on your wallet.",
  passBenefit3Title:"Owners gain regulars", passBenefit3Body:"Restaurants get revenue upfront and gain regular customers — a win-win for both sides.",
  passListTitle:"Restaurants preparing meal passes",
  passMoreNote:"More restaurants will open passes gradually after discussing with owners during the September field survey.",
  passPartnerTitle:"We're also preparing partnerships",
  passPartnerBody:"Korea University Sejong Campus already has partner restaurants like the KU Membership program. We believe local restaurants that aren't on the map can join that same space once they're discovered.",
  passPartnerStoreBtn:"Owner partnership application", passPartnerOrgBtn:"Student council / club partnership inquiry",
  passNotice:"<strong>Payment isn't open yet.</strong> This is currently a non-profit preparation stage, so meal passes only accept <b>pre-orders</b> — real payment integration will launch officially later. Benefits and validity periods are set by the owner.",
  // 커뮤니티
  join4Title:"Join our community", join4Body:"Real-time chat happens over on our external SNS group.",
  communityTitle:"Join our community",
  communityBody:"Real-time chat happens in an external SNS group like KakaoTalk or Instagram. This site only provides the join link and QR code.",
  communityJoinBtn:"Join the group",
  communityQrReady:"Scan the QR code below or tap the button to join.",
  communityQrSoon:"The group hasn't been created yet. Once it's open, a QR code will appear here.",
  // 손주 로그인/식권 흐름의 잡다한 fallback 단어들
  grandchildDefaultName:"Grandchild", mealPassWord:"Meal Pass", ownerBonusLabel:"Owner bonus",
  mypagePassBonusWord:"bonus", mypagePassDateLine:"Reserved {date}", reviewCharUnit:"",
}, zh: {
  // 중국어는 핵심 경로(헤더·히어로·문제·로드맵·지도·맛집 카드/상세·구글 리뷰·실시간 검색)만 지원 —
  // 그 외 키가 없으면 t()가 null을 반환해 한국어 원문으로 자동 대체된다.
  pageTitle:"Bap Meokeoreo Wa — 发现调治院本地美食",
  navSearch:"搜索", navGame:"菜单推荐游戏", navSurvey:"口味问卷", navLang:"语言", navTheme:"切换深浅色", navLogin:"登录",
  mapFilterAria:"地图显示类型", mapFilterAll:"全部", mapFilterFood:"餐厅", mapFilterCafe:"咖啡馆",
  navMenuAria:"主要栏目", navMenuEat:"餐厅", navMenuMap:"地图", navMenuAbout:"介绍", navMenuJoin:"一起参与",
  navLogout:"退出登录",
  headerSearchPh:"搜索餐厅、餐券、合作、页面",
  heroEyebrow:"KU助队！拜托了老板",
  heroTitle:'你知道吗，有些好吃的餐厅在Naver地图上找不到，或者信息很少？<span>现在你知道了。</span>',
  heroBody:'高丽大学世宗校区学生团队<b>味集KU助队</b>亲自走遍调治院邑的大街小巷去发掘。我们从寻找那些完全没有在Naver/Kakao地图上登记，或者登记了但几乎没有信息的本地老字号餐厅开始。快来发现高丽大学、弘益大学世宗校区学生和附近居民都能享受的高性价比本地美食吧。',
  heroBrowse:"浏览餐厅", heroNotify:"获取开放通知",
  heroQuickpick:"选择困难症救援 · 3秒帮你选好", heroSpeech:"来吃饭吧！",
  problemEyebrow:"为什么选择来吃饭吧", problemTitle:"只相信地图App，会错过好吃的餐厅",
  problemSub:"高丽大学、弘益大学世宗校区学生、留学生、教职员工和附近居民都曾经历过的故事。",
  problem1Title:"地图上没有，或信息不全",
  problem1Body:"老字号老板的店常常完全没有登记在Naver/Kakao地图上，或者登记了却连一张照片都没有，信息不全，搜索也看不到。",
  problem2Title:"总是吃教职工食堂",
  problem2Body:"明明附近就有性价比更高、更好吃的本地餐厅，却没办法知道，只能一直重复相同的选择。",
  problem3Title:"需要互相帮助",
  problem3Body:"顾客能发现隐藏的美食，老板能获得宣传和销量的增长——这是让我们整个社区一起变好的方法。",
  discoverEyebrow:"即将推出", discoverTitle:"开学后，我们将亲自拜访老字号老板",
  discoverBody:"完全没有登记在地图上，或者登记了但信息不全的真正本地美食——学生团队将在9月开学后走遍调治院邑的巷子，与老板见面，逐一在这里介绍。下方带有🌐标志的餐厅是谷歌实时评论功能的预览示例，我们亲自发掘并提供帮助的真正本地店铺列表将很快填充在这里。",
  discoverStep1:"调治院邑巷弄实地调查（9月开学后）",
  discoverStep2:"发掘登记信息不全的老字号老板 · 补充信息",
  discoverStep3:"在此处逐一公开真正的本地店铺",
  discoverBtn:"举报你身边的本地美食",
  mapEyebrow:"地图", mapTitle:"调治院迷你地图",
  mapBody:"这里是已确认的实际店铺位置。点击图钉可跳转到详情页。其余店铺将在9月实地调查后陆续添加。",
  mapCampusLabel:"🏫 高丽大学世宗校区",
  mapAuthFail:"无法加载地图。",
  eatLocalEyebrow:"本地美食", eatLocalTitle:"今天吃什么？",
  realGridTitle:"📍 已确认的实际店铺 · 谷歌实时评论",
  realGridSub:"在Kakao/谷歌上真实登记的店铺。点击即可立即查看真实评分和评论。",
  liveSearchPh:"找不到想要的餐厅？输入店名在学校周边实时搜索更多",
  liveSearchBtn:"搜索",
  catAll:"全部", catKorean:"韩餐", catWestern:"西餐", catChinese:"中餐", catJapanese:"日料", catSnack:"小吃", catCafe:"咖啡馆",
  descVarCafe0:"位于调治院邑小巷、氛围很好的咖啡馆",
  descVarCafe1:"小巷里可以快速喝一杯的咖啡馆",
  descVarCafe2:"课间顺路歇脚的小巷咖啡馆",
  descVarCafe3:"调治院邑小巷里可以坐下来待着的咖啡馆",
  descVarCafe4:"再来一杯的调治院邑小巷咖啡馆",
  descVarKorean0:"调治院邑小巷里让人吃得踏实的韩餐厅",
  descVarKorean1:"调治院邑小巷里扎实的一餐",
  descVarKorean2:"纠结今天吃什么时会去的小巷韩餐厅",
  descVarKorean3:"想念家常饭时去的调治院邑小巷馆子",
  descVarWestern0:"调治院邑小巷里小而温馨的西餐厅",
  descVarWestern1:"在调治院邑小巷用刀叉吃的一餐",
  descVarWestern2:"调治院邑小巷里适合稍微特别日子的西餐厅",
  descVarChinese0:"调治院邑小巷里有锅气的中餐厅",
  descVarChinese1:"调治院邑小巷里的一碗中餐",
  descVarChinese2:"值得纠结炸酱面还是炒码面的小巷中餐厅",
  descVarJapanese0:"调治院邑小巷里安静的日餐厅",
  descVarJapanese1:"调治院邑小巷里的一碗日料",
  descVarJapanese2:"一口气吸溜干净的调治院邑小巷日餐厅",
  descVarSnack0:"调治院邑小巷里充满回忆的韩式小吃店",
  descVarSnack1:"小巷里轻松填饱肚子的小吃店",
  descVarSnack2:"想吃炒年糕时去的调治院邑小巷小吃店",
  // 가게 이름 다국어 — restaurants[]에서 이전(rName()이 조회). id 순서 = restaurants[] 순서.
  "name_jochiwon-halmae-gukbap":"调治院奶奶汤饭 (조치원 할매국밥)",
  "name_yeokjeon-wang-donkatsu":"驿前炸猪排大王 (역전 왕돈까스)",
  "name_an-chef-jjambbong":"安主厨肉类海鲜炒码面 (안쉐프고기해물짬뽕)",
  "name_jagal-dondon":"紫葛顿顿 (자갈돈돈)",
  "name_wooridul-sikdang":"我们食堂 (우리들식당)",
  "name_paul-barna":"波尔巴纳 (폴바나)",
  "name_donseu":"顿思 (돈스)",
  "name_the-ramen":"拉面屋 (더라멘)",
  "name_sushi-power-plant-12g":"寿司发电站12g (초밥발전소12g)",
  "name_halmoni-tteokbokki":"奶奶炒年糕 (할머니 떡볶이)",
  "name_parangsae-bunsik":"青鸟小吃 (파랑새분식)",
  "name_sookine-bapsang":"淑姬家饭桌 (숙이네밥상)",
  "name_seochangri-181":"瑞昌里181 (서창리181)",
  "name_sammat-cafe":"三味咖啡 (삼맛카페)",
  "name_vanilla-garden":"香草花园 (바닐라가든)",
  "name_dankong":"甜豆咖啡 (단콩)",
  "name_paul-and-banabas":"保罗与巴拿巴 (폴앤바나바스)",
  "name_cafe-sujak":"手工咖啡馆 (카페수작)",
  "name_cafe-calendar":"日历咖啡馆 (카페캘린더)",
  "name_hong-cafe":"洪咖啡 (홍카페)",
  "name_matna-sikdang-bunsik":"美味食堂粉食 (맛나식당분식)",
  "name_imone-dwaeji-gukbap":"阿姨家猪肉汤饭 (이모네돼지국밥)",
  "name_bundang-ilpum-guksu":"盆唐一品面条 (분당일품국수)",
  "name_urban-lounge":"都市酒廊 (어반라운지)",
  "name_gyodong-jjambbong":"校洞炒码面 (교동짬뽕)",
  "name_naive":"天真咖啡 (나이브)",
  "name_yuram-coffee-roasters":"游览咖啡烘焙 (유람 커피로스터스)",
  "name_daily-point":"美味点 (딜리포인트)",
  "name_hunminjeongeum":"训民正音 (훈민정음)",
  "name_siot":"西奥特 (시옷)",
  "name_vib":"维夫 (비브)",
  "name_neomeo":"那边 (너머)",
  "name_chas":"查斯 (차스)",
  "name_second-road":"第二道路 (세컨로드)",
  "name_merry-go-round":"旋转木马 (메리고라운드)",
  "name_roastery-cafe-in":"IN烘焙咖啡馆 (로스터리 카페IN)",
  "name_defense":"防御 (디펜스)",
  // 가게 설명 다국어 — descVariant()에 안 걸리는 가게만(rDesc()가 조회).
  "desc_jochiwon-halmae-gukbap":"有着40年传统、汤底浓郁的知名汤饭店",
  "desc_yeokjeon-wang-donkatsu":"厚实的手工炸猪排，分量十足",
  "desc_an-chef-jjambbong":"肉类与海鲜同煮的辣味炒码面店",
  "desc_jagal-dondon":"位于调治院邑小巷里的烤肉店",
  "desc_wooridul-sikdang":"位于调治院邑小巷里的家常韩式套餐店",
  "desc_donseu":"位于调治院邑小巷里的炸猪排、乌冬面店",
  "desc_the-ramen":"位于调治院邑小巷里的拉面店",
  "desc_sushi-power-plant-12g":"位于调治院邑小巷里的寿司卷专门店",
  "desc_halmoni-tteokbokki":"香辣香甜的怀旧炒年糕，学生们的最爱零食",
  "desc_sookine-bapsang":"位于调治院邑小巷里的家常韩式套餐店",
  pagerAria:"餐厅列表分页", pagerPrev:"上一页", pagerNext:"下一页",
  sortRecommend:"推荐排序", sortName:"名称排序（拼音）", sortRating:"评分最高", sortReviews:"评论最多", sortLatest:"最新", sortDistance:"最近",
  priceMin:"最低", priceMax:"最高", priceWon:"韩元",
  filterEmpty:"目前没有符合这些筛选条件的餐厅。",
  filterEmptySub:"这些餐厅怎么样？", filterReset:"清除筛选，查看全部",
  filterEmptyKorean:"🍚 韩餐", filterEmptyJapanese:"🍜 日料", filterEmptyWestern:"🍝 西餐",
  exampleGridTitle:"🔎 示例店铺（待实地调查）",
  exampleGridSub:'这是实地调查完成前的示例信息。点击爱心可保存到"想去的地方"。',
  loadMore:'查看更多餐厅 <span class="badge-soon">9月开放</span>',
  confirmOk:"确认", confirmNo:"否",
  cardReviewPending:"🔎 真实评论准备中", cardVisitBadge:"✔ 去过", cardLiveBadge:"🌐 谷歌实时评论", cardMockTag:"示例数据",
  cardVisitedLabel:"✔ 已记录到访", cardMarkVisited:"标记为已到访", cardWantToVisit:"添加到想去的地方",
  filterCountTemplate:"{n}家餐厅",
  detailAddress:"📍 地址", detailHours:"🕐 营业时间", detailClosed:"🚫 休息日", detailPhone:"☎️ 电话", detailReservation:"📅 预约",
  copyAddressBtn:"复制地址", copyPhoneBtn:"复制电话号码",
  copyOkTitle:"已复制", copyOkBody:"已存入剪贴板，可以直接粘贴使用。",
  copyFailTitle:"复制失败", copyFailBody:"浏览器阻止了复制，请手动选中文字复制。",
  detailCapacity:"🪑 可容纳人数", detailParking:"🚗 停车", detailMobilePay:"📱 移动支付", detailVouchers:"🎟️ 代金券/餐券",
  detailMenuTitle:"菜单", detailOrigin:"产地：", detailExampleNote:"* 这是示例信息，实地调查后将更新为真实数据。",
  detailStubTitle:"详细信息准备中", detailStubBody:"，将在9月实地调查后补充完整。可先在调治院奶奶汤饭卡片中预览会包含哪些信息。",
  detailStubBodyFull:"地址、营业时间、菜单构成和食材产地",
  detailStubBodyPartial:"营业时间、菜单构成和食材产地",
  closeBtn:"关闭",
  googleReviewTitle:"谷歌评论", googleReviewLoading:"正在加载评论...", googleReviewError:"无法加载评论，请稍后再试。",
  aiSummaryTitle:"AI评论摘要", aiSummaryLoading:"🤖 正在总结评论……",
  detailMapFocus:"🗺️ 在地图上查看",
  detailNoLocationNote:"🧭 这是示例数据，暂无真实位置信息，无法在地图上显示。",
  googleReviewNotFound:"😢 在谷歌地图上找不到这家店。", googleReviewNone:"暂无评论。",
  googleReviewLink:"在谷歌地图查看全部评论 →", googleReviewAnon:"匿名",
  liveSearchLoading:"搜索中...", liveSearchEmpty:"没有找到结果。", liveSearchError:"搜索失败，请稍后再试。",
  searchNoResultsFor:"没有找到与“{q}”相关的结果。", searchDidYouMean:"您是不是在找这些？",
  searchCheckSpelling:"请确认搜索词是否正确。", searchMaybeThisShop:"您要找的是这家店吗？",
  confirmLoginTitle:"需要登录", confirmLoginBody:"此功能需要登录。登录后即可创建你自己的餐厅列表！", confirmLoginOk:"登录", confirmLoginCancel:"关闭",
  discardTitle:"要中途退出吗？", discardBody:"目前选择的内容不会被保存。",
  discardOk:"退出", discardCancel:"继续",
  confirmUnsave:"要从想去的地方中移除吗？", confirmUnsaveVisited:"要从想去的地方中移除吗？这家店的到访记录也会一并删除。", confirmSave:"要把这家餐厅添加到想去的地方吗？", confirmVisited:"要将这家餐厅标记为已到访吗？",
  // 리뷰(랜딩) / 설문 CTA / 공유 / 함께하기 / 이메일 신청 / 푸터 / 접근성
  reviewEyebrow:"评价", reviewTitle:"亲身体验过的人的故事",
  reviewSearchPh:"搜索评论（餐厅名、关键词）",
  reviewWriteBtn:"我也来写评论",
  reviewSoon:"<strong>评论数据即将上线</strong> — 9月开学后真实到访评论积累起来后，AI评论摘要功能也将同步推出。",
  surveyTitle:"告诉我们你的口味", surveyBody:"回答关于辣度、喜爱类型和预算的简单问卷，获取为你量身定制的餐厅推荐。", surveyBtn:"开始口味问卷",
  shareEyebrow:"分享", shareTitle:"也告诉学校的朋友们吧",
  shareBody:'分享得越多，隐藏的美食就会变得更好——把"来吃饭吧"推荐给朋友吧。',
  shareKakao:"分享到KakaoTalk", shareCopy:"复制链接", shareText:"短信分享", shareInsta:"分享到Instagram",
  joinEyebrow:"一起", joinTitle:"让我们一起打造这个项目",
  joinBody:"为老板，为我们，为邻居——我们为想要加入这个项目的所有人留出了空间。",
  join1Title:'你是店主吗？<span class="badge-soon">9月开放</span>',
  join1Body:"为希望自己的店铺被介绍的调治院本地店主准备的登记入口。",
  join2Title:"帮我们一把", join2Body:"我们正在寻找愿意加入企划、开发、设计、实地调查等岗位的队友。",
  join3Title:"也告诉我们你所在地区的本地美食", join3Body:"即使不在调治院，只要和我们做的事情有共鸣，随时欢迎联系。",
  signupTitle:"第一时间获知消息", signupBody:"测试版上线和新增餐厅时，我们会第一时间发邮件通知你。",
  signupEmailPh:"请输入邮箱地址", signupBtn:"提前注册",
  signupErrEmail:"邮箱地址的格式好像有点不对哦！💌",
  signupMsg:"注册成功！上线时我们会第一时间通知你 🌾",
  footerAbout:'"KU助队！拜托了老板"——高丽大学世宗校区学生团队味集KU助队发起的社会公益项目，致力于与本地商圈一起成长。',
  footerServiceHead:"服务", footerMapLink:"查看地图", footerPassLink:'孙辈餐券<span class="badge-live">可预约</span>', footerSponsorLink:"支持我们",
  footerInfoHead:"信息", footerIntroLink:"关于本服务", footerFaqLink:"联系我们", footerSignupLink:"订阅上线通知",
  footerAdminHead:"管理员", footerAnalyticsLink:"使用分析", footerOwnerLink:"店主页面",
  adminGateTitle:"管理员确认", adminGateBody:"即将前往使用分析页面，请输入密码。",
  adminGateOk:"进入", adminGateWrong:"密码不正确。",
  footerLegalHead:"法律", footerPrivacyLink:"隐私政策", footerTermsLink:"服务条款",
  footerOperator:"<b>运营机构</b> 高丽大学世宗校区学生团队 味集KU助队",
  footerProject:"<b>项目名称</b> KU助队！拜托了老板",
  footerServiceName:"<b>服务名称</b> Bap Meokeoreo Wa",
  footerEmail:"<b>咨询邮箱</b>（待公布）",
  footerOfficer:"<b>隐私保护负责人</b>（待公布）",
  footerBottom:"© 2026 Bap Meokeoreo Wa · KU助队！拜托了老板。味集KU助队（高丽大学世宗校区）。",
  a11yToggle:"🔍 大字模式",
  // 취향 설문
  surveyPrev:"上一步", surveyNext:"下一步", surveyResult:"查看结果",
  surveyResultTitle:"这些怎么样？", surveyResultSub:"根据你的口味挑选的本地美食",
  // 메뉴 추천 게임
  gameTitle:"用游戏的方式决定吃什么吧", gameSub:"告别选择困难！两者选一个",
  gameTarotName:"今日菜单塔罗", gameTarotDesc:"抽一张卡，揭晓今天的美食命运",
  gameRouletteName:"菜单转盘", gameRouletteDesc:"输入你想吃的东西，让转盘帮你决定",
  gameBack:"← 选择其他游戏",
  tarotTitle:"今日菜单塔罗", tarotSub:"{n}张卡牌正在流动。点击抽取今天的一餐",
  tarotRedraw:"重新抽取",
  rouletteTitle:"菜单转盘", rouletteSub:"添加2个以上想吃的菜品，然后转动",
  roulettePh:"例如：汤饭、披萨、麻辣烫", rouletteAdd:"添加",
  rouletteEmpty:"请添加菜品", rouletteMin:"请添加2个以上菜品",
  rouletteReady:"共{n}个选项可供选择", rouletteSpin:"🎡 转动", rouletteRespin:"🎡 再转一次", rouletteSlotLabel:"格子数",
  // 손주 로그인/가입
  authIntentSave:"要保存想去的地方，请先成为我们的孙辈！",
  authIntentMypage:"使用我的页面需要先注册。",
  authIntentReview:"请先注册后再撰写评论。",
  authIntentPass:"餐券会保存到你的账户，请先注册。",
  authIntentLogin:"欢迎回来！请登录你的账户。",
  authTitle:"成为我们的孙辈", authTabSignup:"注册", authTabLogin:"登录",
  authNameLabel:"姓名", authNamePh:"该怎么称呼你？",
  authIdLabel:"邮箱", authIdPh:"example@mail.com",
  authPwLabel:"密码", authPwPh:"密码",
  authPw2Label:"确认密码", authPw2Ph:"请再次输入密码",
  authSubmitSignup:"注册并开始使用", authSubmitLogin:"登录",
  authErrFormat:"请输入有效的邮箱地址。",
  authErrPwMismatch:"两次输入的密码不一致，请重新确认。",
  authErrDupe:'该账户已存在，请通过"登录"标签页登录。',
  authErrNotFound:'找不到该账户，请先通过"注册"标签页注册。',
  authErrPwShort:"密码至少需要6个字符。",
  mypageResetSaved:"清空想去的店", mypageResetVisited:"清空去过的店", mypageResetPass:"清空餐券预约",
  resetSavedTitle:"清空想去的店", resetSavedBody:"将清空所有收藏的店铺。去过的记录和餐券预约会保留。",
  resetVisitedTitle:"清空去过的店", resetVisitedBody:"将清除所有去过标记。收藏列表和您写的评论会保留。",
  resetPassTitle:"清空餐券预约", resetPassBody:"将清除所有餐券预约记录。收藏列表和去过的记录会保留。",
  authErrPwEmpty:"请输入密码。",
  authErrNameEmpty:"请填写您的称呼。",
  authErrNotConfirmed:"邮箱尚未验证，请查收邮件。",
  authErrNeedConfirm:"我们已发送验证邮件，请验证后再登录。",
  authErrRate:"请求过于频繁，请稍后再试。",
  authErrNetwork:"连接失败，请稍后再试。",
  authErrOffline:"暂时无法连接登录服务器，请稍后再试。",
  authErrGeneric:"处理失败，请稍后再试。",
  authErrWrongPw:"密码错误。",
  authWelcomeTitle:"欢迎，{name}！", authWelcomeBody:"注册完成。正式上线时我们会第一时间通知你。",
  authWelcomeBodyLogin:"欢迎回来！很高兴再次见到你。",
  authWelcomeMypageBtn:"前往我的页面",
  headerAuthSavedLabel:"我保存的地方", headerAuthMypageTitle:"{name}的我的页面",
  logoutTitle:"要登出吗？", logoutBody:"登出后，使用保存列表、撰写评论等功能需要重新登录。",
  logoutOk:"登出", logoutCancel:"取消",
  // 마이페이지
  mypageTitle:"{name}的我的页面", mypageTitleGeneric:"我的页面",
  mypageTabSaved:"想去的地方", mypageTabVisited:"去过的地方", mypageTabPass:"餐券",
  allergyTitle:"🥜 过敏原设置", allergySub:"打开可能含有所选食材的店铺时，我们会提前提醒你。",
  allergyWarnTitle:"进店前请先确认", allergyWarnBody:"这家店可能有含{list}的菜品，点餐前请务必向老板确认。",
  allergyWarnOk:"知道了，继续查看",
  allergen_shellfish:"甲壳类", allergen_fish:"鱼类·海鲜", allergen_milk:"牛奶", allergen_wheat:"小麦·麸质",
  allergen_nuts:"坚果", allergen_pork:"猪肉", allergen_beef:"牛肉", allergen_egg:"鸡蛋",
  mypageResetLink:"重置我的全部活动记录", mypageLogoutBtn:"登出",
  mypageEmptySaved:"还没有保存的餐厅。", mypageEmptyVisited:"还没有到访记录。",
  mypageEmptyPass:"还没有预订的餐券。<br>请在孙辈餐券栏目中选择你喜欢的餐厅。",
  mypageRemoveSavedTitle:"从想去的地方中移除", mypageRemoveVisitedTitle:"取消到访记录",
  mypageConfirmUnvisit:"要取消这条到访记录吗？",
  mypageCancelPassTitle:"取消预订", mypageConfirmCancelPass:"要取消这份餐券预订吗？", mypageCancelPassOk:"取消预订",
  resetTitle:"重置我的活动记录", resetBody:"这会清除你保存的地方、到访记录、你写的评论和餐券预订。此操作无法撤销。",
  resetOk:"重置", resetCancel:"取消",
  // 리뷰 작성
  reviewFormTitle:"我也来写评论", reviewFormSub:"分享你对到访过的餐厅的真实评价。",
  reviewFormNoVisitTitle:"还不能写评论", reviewFormNoVisitBody:"只能评论已标记为到访过的餐厅。",
  reviewFormNoVisitOk:"浏览餐厅",
  reviewRatingLabel:"评分", reviewPlaceLabel:"到访的餐厅",
  reviewVisibilityLabel:"显示方式", reviewVisibilityReal:"真实姓名（{name}）", reviewVisibilityAnon:"匿名",
  reviewPhotoLabel:"添加照片", reviewOptional:"可选",
  visitVerifyTitle:"到店认证",
  visitVerifySub:"您确实去过{name}吗？请上传小票或店铺招牌的照片。",
  visitVerifyNote:"只有实际到访过的店铺才能写评论。照片仅用于核对，不会保存。",
  visitVerifyPhotoLabel:"小票或招牌照片",
  visitVerifySubmit:"认证", visitVerifyChecking:"正在核对……",
  visitVerifyPreviewAlt:"已上传照片的预览",
  visitVerifyErrNoPhoto:"请先上传照片。",
  visitVerifyErrRead:"无法读取该照片，请换一张再试。",
  visitVerifyErrServer:"目前无法进行认证，请稍后再试。",
  visitVerifyFailKind:"这看起来不像小票或店铺招牌的照片。",
  visitVerifyFailName:"照片中未能确认这家店的名称。",
  reviewContentLabel:"评论内容", reviewContentPh:"你喜欢这里的哪一点？",
  reviewSubmitBtn:"发布评论", reviewErrEmpty:"请填写评论内容。",
  reviewSuccessTitle:"评论发布成功！",
  reviewSuccessBodyOk:"感谢分享！评论已发布到评论列表中。",
  reviewSuccessBodyFail:"已添加到评论列表，但照片过大未能保存——刷新页面后可能会消失。",
  anonReviewerName:"匿名孙辈", namedReviewerSuffix:"（孙辈）", defaultReviewerName:"一位孙辈",
  // 서비스 소개
  introSub:"调治院邑本地美食发现平台",
  introVision:"寻找那些在地图上缺失或信息不全的真正社区餐厅，打造顾客与店主共同繁荣的本地商圈生态",
  introOverviewHead:"项目概述",
  introOverviewBody:'"KU助队！拜托了老板"——始于高丽大学世宗校区社会公益项目的学生主导服务。学生和居民亲自寻找并介绍那些在Naver/Kakao地图上缺失或信息不全的调治院邑本地餐厅。',
  introMakerHead:"关于我们",
  introMakerBody:"由高丽大学世宗校区经济政策学专业学生团队味集KU助队企划并打造的社会公益项目。",
  introProgressHead:"进展情况",
  introProgressBody:"目前正处于正式上线前接受提前注册的准备阶段。计划在9月开学后通过实地调查填充真实餐厅数据，然后启动完整服务。",
  introFaqBtn:"常见问题",
  // FAQ
  faqTitle:"联系我们", faqSub:"请先查看常见问题，可能会有快速答案。",
  faqQ1:"什么是「来吃饭吧」？",
  faqA1:'这是「KU助队！拜托了老板」项目打造的服务。学生和居民亲自寻找并介绍那些在Naver/Kakao地图等在线地图上缺失或信息不全的调治院邑本地餐厅。',
  faqQ2:"现在是正式上线前吗？",
  faqA2:"是的，目前正处于准备阶段，接受提前注册，计划在9月开学后携带真实餐厅数据启动完整服务。",
  faqQ3:"我的餐厅也能被收录吗？",
  faqA3:'当然可以！我们正在准备店主登记页面。功能上线后，会通过"你是店主吗？"按钮引导你完成登记。',
  faqQ4:"任何人都能写评论吗？",
  faqA4:"只有登录会员才能写评论，且仅限已标记为到访过的餐厅——这是防止虚假评论的最低限度保障措施。",
  faqQ5:"我的个人信息会如何使用？",
  faqA5:"仅用于隐私政策中列明的目的（会员身份确认、提供服务），并依据相关法律安全管理。",
  faqQ6:"我想做志愿者或加入团队。",
  faqA6:'请通过"帮我们一把"菜单留下咨询，我们会引导你了解后续步骤。',
  faqFootPrefix:"没找到你要的答案？可以通过", faqFootBold:"帮我们一把", faqFootSuffix:"联系我们。",
  faqContactBtn:"发送咨询",
  // 참여/후원/제휴 문의
  supportTitle:"帮我们一把", supportSub:"我们正在等待愿意帮忙的人加入这个项目。",
  supportTeamTitle:"我想加入团队", supportTeamDesc:"从实地调查到企划开发——总有适合你的位置。",
  supportSponsorTitle:"我想支持这个项目", supportSponsorDesc:"为以非营利方式运营的项目提供助力。",
  contactNameLabel:"姓名", contactNamePh:"姓名或昵称",
  contactReachLabel:"联系方式/邮箱", contactReachPh:"可联系到你的邮箱或电话号码",
  contactMessageOptional:"可选", contactSubmitBtn:"发送咨询",
  contactErrName:"请输入姓名。", contactErrReach:"请输入有效的邮箱或电话号码。",
  contactBack:"返回", contactSuccessTitle:"咨询已提交！",
  contactSuccessBody:"谢谢你，{name}。我们会通过你留下的联系方式跟进。<br>（{type}）",
  ct_team_title:"我想加入团队", ct_team_sub:"我们正在等待愿意一起打造这个项目的队友。",
  ct_team_note:"企划、开发、设计、实地调查——欢迎任何角色。我们会通过你留下的联系方式联系你。",
  ct_team_field:"你想帮忙的领域",
  ct_team_opt1:"实地调查（发掘餐厅）", ct_team_opt2:"企划/运营", ct_team_opt3:"设计", ct_team_opt4:"开发", ct_team_opt5:"营销/内容", ct_team_opt6:"还没想好",
  ct_team_msgLabel:"还有什么想告诉我们的", ct_team_msgPh:"欢迎分享你想加入的理由或你的可用时间。",
  ct_sponsor_title:"我想支持这个项目", ct_sponsor_sub:"每一份支持都能帮我们多发掘一家本地美食。",
  ct_sponsor_note:"本项目目前以非营利方式运营，捐款仅用于实地调查和运营成本。",
  ct_sponsor_field:"支持方式",
  ct_sponsor_opt1:"一次性捐款", ct_sponsor_opt2:"定期捐款", ct_sponsor_opt3:"实物/技能捐赠", ct_sponsor_opt4:"只是想先咨询一下",
  ct_sponsor_msgLabel:"关于你的支持的留言", ct_sponsor_msgPh:"欢迎分享关于支持我们的疑问或想法。",
  ct_partnerStore_title:"店主合作申请", ct_partnerStore_sub:"让我们一起准备餐券和学生福利吧。",
  ct_partnerStore_note:"登记和合作申请均免费。餐券福利和有效期由你自行设定；具体费用结构仍在讨论中。",
  ct_partnerStore_field:"希望提供的福利",
  ct_partnerStore_opt1:"10+1餐券", ct_partnerStore_opt2:"学生折扣", ct_partnerStore_opt3:"套餐折扣", ct_partnerStore_opt4:"只是想先咨询一下",
  ct_partnerStore_msgLabel:"关于你的餐厅/其他补充说明", ct_partnerStore_msgPh:"请分享你的餐厅名称、位置以及考虑提供的福利。",
  ct_partnerOrg_title:"学生会/社团合作咨询", ct_partnerOrg_sub:"让我们一起为你所在组织的成员打造福利吧。",
  ct_partnerOrg_note:"高丽大学世宗校区已经有像KU会员计划这样的合作餐厅。我们希望帮助那些不在地图上的本地餐厅加入同样的合作空间——具体条款仍在讨论中。",
  ct_partnerOrg_field:"组织类型",
  ct_partnerOrg_opt1:"学生会", ct_partnerOrg_opt2:"社团", ct_partnerOrg_opt3:"校园组织", ct_partnerOrg_opt4:"其他团体",
  ct_partnerOrg_msgLabel:"你希望的合作方式", ct_partnerOrg_msgPh:"请分享你所在组织的名称、规模以及希望获得的福利。",
  ct_expand_title:"也想让我所在地区的本地美食被发掘", ct_expand_sub:"即使不在调治院，只要和我们做的事情有共鸣。",
  ct_expand_note:"盈利模式尚未确定。我们目前正在讨论非营利式扩张，并探索合作方式。",
  ct_expand_field:"你建议的地区", ct_expand_fieldPh:"例如：世宗市都潭洞、清州市梳仓洞",
  ct_expand_msgLabel:"你的建议", ct_expand_msgPh:"请告诉我们这个社区的情况，以及为什么这项服务在那里会有帮助。",
  // 손주 식권
  passPerUnit:"每张", passValidDays:"有效期{n}天", passBuyBtn:"预订餐券",
  passSelectTitle:"{name}餐券", passHowMany:"你想要多少张？",
  passSummaryCount:"{n}张", passSummaryBonus:"老板赠送+{n}张", passSummaryTotal:"实际获得的餐券", passSummaryAmount:"应付金额",
  passNextBtn:"下一步", passConfirmTitle:"确认预订这些内容吗？", passConfirmSub:"我们会提交以下信息的预订。",
  passSummaryStore:"餐厅", passSummaryBought:"购买的餐券", passSummaryValid:"有效期", passSummaryValidVal:"首次使用后{n}天内有效",
  passPrepayNote:"目前仅提交<b>预订</b>。正式上线后将接入真实支付——此阶段不会产生任何费用。",
  passSubmitBtn:"提交预订", passBackBtn:"返回",
  passSuccessTitle:"预订已提交！",
  passSuccessBodyOk:"已为{name}保存{n}张餐券。正式上线后我们会通知你付款事宜。",
  passSuccessBodyFail:"已保存你的{name}餐券，但存储空间已满未能记录——刷新页面后可能会消失。",
  passSeeMyPasses:"查看我的餐券",
  // 손주 식권 안내 (정적 페이지)
  passInfoTitle:'孙辈餐券<span class="badge-live">可预约</span>',
  passInfoBody:"为你喜欢的餐厅预先充值餐券。根据店主提供的福利获得额外餐券，每次到访使用一张。",
  passBenefit1Title:"买10送1", passBenefit1Body:"批量购买可获得店主设定的额外餐券。福利因店而异。",
  passBenefit2Title:"预付餐费", passBenefit2Body:"无需每次单独付款，提前预付，减轻你的钱包负担。",
  passBenefit3Title:"老板获得回头客", passBenefit3Body:"餐厅提前获得营收并收获常客——对双方都是双赢。",
  passListTitle:"正在准备餐券的餐厅",
  passMoreNote:"9月实地调查期间与店主协商后，会陆续为更多餐厅开放餐券。",
  passPartnerTitle:"我们也在准备合作项目",
  passPartnerBody:"高丽大学世宗校区已经有像KU会员计划这样的合作餐厅。我们相信那些不在地图上的本地餐厅一旦被发掘，也能加入同样的合作空间。",
  passPartnerStoreBtn:"店主合作申请", passPartnerOrgBtn:"学生会/社团合作咨询",
  passNotice:"<strong>付款功能尚未开放。</strong>目前处于非营利准备阶段，餐券仅接受<b>预订</b>——正式付款功能将在后续上线。福利和有效期由店主设定。",
  // 커뮤니티
  join4Title:"加入我们的社区", join4Body:"实时交流在我们的外部SNS群组进行。",
  communityTitle:"加入我们的社区",
  communityBody:"实时交流在KakaoTalk、Instagram等外部SNS群组进行。本网站仅提供加入链接和二维码。",
  communityJoinBtn:"加入群组",
  communityQrReady:"扫描下方二维码或点击按钮加入。",
  communityQrSoon:"群组尚未建立。群组开放后，二维码将显示在这里。",
  grandchildDefaultName:"孙辈", mealPassWord:"餐券", ownerBonusLabel:"老板赠送",
  mypagePassBonusWord:"奖励", mypagePassDateLine:"{date} 预订", reviewCharUnit:"字",
}, es: {
  pageTitle:"Bap Meokeoreo Wa — Descubre los restaurantes locales de Jochiwon",
  navSearch:"Buscar", navGame:"Juego de la ruleta de menú", navSurvey:"Encuesta de gustos", navLang:"Idioma", navTheme:"Cambiar modo claro/oscuro", navLogin:"Iniciar sesión",
  mapFilterAria:"Tipo de visualización del mapa", mapFilterAll:"Todos", mapFilterFood:"Comida", mapFilterCafe:"Cafeterías",
  navMenuAria:"Secciones principales", navMenuEat:"Restaurantes", navMenuMap:"Mapa", navMenuAbout:"Acerca de", navMenuJoin:"Participa",
  navLogout:"Cerrar sesión",
  headerSearchPh:"Busca restaurantes, bonos de comida, socios, páginas",
  heroEyebrow:"KU-jodae! Ayudemos a los dueños locales",
  heroTitle:"¿Sabías que hay restaurantes estupendos que no aparecen o apenas figuran en Naver? <span>Ahora ya lo sabes.</span>",
  heroBody:"Un equipo de estudiantes del campus de Sejong de la Universidad de Korea, <b>Matjip KU-jodae</b>, recorre las callejuelas de Jochiwon-eup para encontrarlos. Empezamos localizando restaurantes locales reales que no aparecen en absoluto en Naver/Kakao Map, o que figuran con muy poca información. Descubre restaurantes locales de gran valor que los estudiantes de la Universidad de Korea y la Universidad de Hongik en el campus de Sejong, y los residentes cercanos, pueden disfrutar juntos.",
  heroBrowse:"Ver restaurantes", heroNotify:"Avísame en el lanzamiento",
  heroQuickpick:"Rescate de indecisos · Elige por mí en 3 segundos", heroSpeech:"¡Ven a comer con nosotros!",
  problemEyebrow:"POR QUÉ BAP MEOKEOREO WA", problemTitle:"Si solo confías en las apps de mapas, te perderás buena comida",
  problemSub:"Una historia familiar para estudiantes de la Universidad de Korea y la Universidad de Hongik en el campus de Sejong, estudiantes de intercambio, personal y residentes cercanos.",
  problem1Title:"Ausentes o apenas listados en los mapas",
  problem1Body:"Los restaurantes locales de toda la vida suelen estar completamente ausentes de Naver/Kakao Map, o aparecen listados sin siquiera una foto, por lo que ni siquiera aparecen al buscar.",
  problem2Title:"Siempre el mismo comedor",
  problem2Body:"Hay restaurantes locales cercanos con mejor relación calidad-precio y más sabrosos, pero al no tener forma de encontrarlos, sigues eligiendo lo mismo de siempre.",
  problem3Title:"Necesitamos ayudarnos mutuamente",
  problem3Body:"Los clientes descubren joyas escondidas y los dueños obtienen más visibilidad y ventas: una estructura en la que todo nuestro barrio prospera junto.",
  discoverEyebrow:"PRÓXIMAMENTE", discoverTitle:"Tras el inicio del semestre, visitaremos en persona a los dueños locales",
  discoverBody:"Restaurantes locales reales que están completamente ausentes de los mapas, o listados con muy poca información: nuestro equipo de estudiantes recorrerá las callejuelas de Jochiwon-eup tras el inicio del semestre en septiembre, se reunirá con los dueños y los presentará aquí uno por uno. Los restaurantes con la insignia 🌐 de abajo son un adelanto de cómo se ve la integración en vivo de reseñas de Google; la lista real de restaurantes locales que hemos encontrado y ayudado personalmente llenará este espacio pronto.",
  discoverStep1:"Reconocimiento de campo en las callejuelas de Jochiwon-eup (tras el inicio del semestre de septiembre)",
  discoverStep2:"Localizar a dueños locales poco listados y completar su información",
  discoverStep3:"Publicarlos aquí como restaurantes locales reales, uno por uno",
  discoverBtn:"Reporta un restaurante local cerca de ti",
  mapEyebrow:"MAPA", mapTitle:"Mini mapa de Jochiwon",
  mapBody:"Ubicaciones de restaurantes que hemos confirmado realmente. Toca un pin para ver los detalles. El resto se añadirá poco a poco tras el reconocimiento de campo de septiembre.",
  mapCampusLabel:"🏫 Campus de Sejong de la Universidad de Korea",
  mapAuthFail:"No se pudo cargar el mapa.",
  eatLocalEyebrow:"COME LOCAL", eatLocalTitle:"¿Qué comemos hoy?",
  realGridTitle:"📍 Restaurantes reales confirmados · Reseñas de Google en vivo",
  realGridSub:"Restaurantes realmente registrados en Kakao/Google. Haz clic en uno para ver al instante calificaciones y reseñas reales.",
  liveSearchPh:"¿No encuentras un restaurante? Escribe un nombre para buscar cerca en tiempo real",
  liveSearchBtn:"Buscar",
  catAll:"Todos", catKorean:"Coreana", catWestern:"Occidental", catChinese:"China", catJapanese:"Japonesa", catSnack:"Bocadillos", catCafe:"Cafeterías",
  descVarCafe0:"Una cafetería con buen ambiente en un callejón de Jochiwon-eup",
  descVarCafe1:"Una cafetería de callejón para tomar algo rápido",
  descVarCafe2:"Una cafetería de callejón ideal para pasar entre clases",
  descVarCafe3:"Una cafetería en un callejón de Jochiwon-eup para acomodarte con calma",
  descVarCafe4:"Una cafetería en un callejón de Jochiwon-eup para tomar una taza más",
  descVarKorean0:"Un restaurante coreano de callejón en Jochiwon-eup que te llena de energía con arroz",
  descVarKorean1:"Una comida contundente en un callejón de Jochiwon-eup",
  descVarKorean2:"El restaurante coreano de callejón al que vas cuando no sabes qué comer hoy",
  descVarKorean3:"Un restaurante de callejón en Jochiwon-eup para cuando extrañas la comida casera",
  descVarWestern0:"Un acogedor restaurante occidental en un callejón de Jochiwon-eup",
  descVarWestern1:"Una comida con tenedor en un callejón de Jochiwon-eup",
  descVarWestern2:"Un restaurante occidental de callejón en Jochiwon-eup para un día un poco especial",
  descVarChinese0:"Un restaurante chino de callejón en Jochiwon-eup con sabor a wok",
  descVarChinese1:"Un plato de comida china en un callejón de Jochiwon-eup",
  descVarChinese2:"El local de callejón en Jochiwon-eup donde dudas entre jjajangmyeon y jjamppong",
  descVarJapanese0:"Un tranquilo restaurante japonés en un callejón de Jochiwon-eup",
  descVarJapanese1:"Un plato de comida japonesa en un callejón de Jochiwon-eup",
  descVarJapanese2:"Un restaurante japonés de callejón en Jochiwon-eup para vaciar de un sorbo",
  descVarSnack0:"Un puesto de bunsik lleno de nostalgia en un callejón de Jochiwon-eup",
  descVarSnack1:"Un puesto de bunsik de callejón para llenar el estómago con algo ligero",
  descVarSnack2:"Un callejón de Jochiwon-eup para cuando se te antoja tteokbokki",
  // 가게 이름 다국어 — restaurants[]에서 이전(rName()이 조회). id 순서 = restaurants[] 순서.
  "name_jochiwon-halmae-gukbap":"Gukbap de la Abuela de Jochiwon (조치원 할매국밥)",
  "name_yeokjeon-wang-donkatsu":"Yeokjeon Rey del Donkatsu (역전 왕돈까스)",
  "name_an-chef-jjambbong":"An-Chef Jjamppong de Carne y Mariscos (안쉐프고기해물짬뽕)",
  "name_jagal-dondon":"Jagal Dondon (자갈돈돈)",
  "name_wooridul-sikdang":"Wooridul Sikdang (우리들식당)",
  "name_paul-barna":"Paul, Barna (폴바나)",
  "name_donseu":"Donseu (돈스)",
  "name_the-ramen":"The Ramen (더라멘)",
  "name_sushi-power-plant-12g":"Planta de Energía del Sushi 12g (초밥발전소12g)",
  "name_halmoni-tteokbokki":"Tteokbokki de la Abuela (할머니 떡볶이)",
  "name_parangsae-bunsik":"Bunsik del Pájaro Azul (파랑새분식)",
  "name_sookine-bapsang":"La Mesa de Sooki (숙이네밥상)",
  "name_seochangri-181":"Seochang-ri 181 (서창리181)",
  "name_sammat-cafe":"Samat Cafe (삼맛카페)",
  "name_vanilla-garden":"Vanilla Garden (바닐라가든)",
  "name_dankong":"Dankong (단콩)",
  "name_paul-and-banabas":"Paul and Barnabas (폴앤바나바스)",
  "name_cafe-sujak":"Cafe Sujak (카페수작)",
  "name_cafe-calendar":"Cafe Calendar (카페캘린더)",
  "name_hong-cafe":"Hong Cafe (홍카페)",
  "name_matna-sikdang-bunsik":"Matna Restaurante y Bunsik (맛나식당분식)",
  "name_imone-dwaeji-gukbap":"Imone Dwaeji-gukbap (이모네돼지국밥)",
  "name_bundang-ilpum-guksu":"Bundang Ilpum Fideos (분당일품국수)",
  "name_urban-lounge":"Urban Lounge (어반라운지)",
  "name_gyodong-jjambbong":"Gyodong Jjamppong (교동짬뽕)",
  "name_naive":"Naive (나이브)",
  "name_yuram-coffee-roasters":"Yuram Coffee Roasters (유람 커피로스터스)",
  "name_daily-point":"Dilly Point (딜리포인트)",
  "name_hunminjeongeum":"Hunminjeongeum (훈민정음)",
  "name_siot":"Siot (시옷)",
  "name_vib":"Vibe (비브)",
  "name_neomeo":"Neomeo (너머)",
  "name_chas":"Chas (차스)",
  "name_second-road":"Second Road (세컨로드)",
  "name_merry-go-round":"Merry-Go-Round (메리고라운드)",
  "name_roastery-cafe-in":"Roastery Cafe IN (로스터리 카페IN)",
  "name_defense":"Defense (디펜스)",
  // 가게 설명 다국어 — descVariant()에 안 걸리는 가게만(rDesc()가 조회).
  "desc_jochiwon-halmae-gukbap":"Una casa de gukbap muy conocida, con 40 años de tradición y un caldo intenso",
  "desc_yeokjeon-wang-donkatsu":"Donkatsu grueso hecho a mano, con porciones generosas",
  "desc_an-chef-jjambbong":"Un local de jjamppong picante que sirve carne y mariscos a la vez",
  "desc_jagal-dondon":"Un restaurante de carne a la parrilla en un callejón de Jochiwon-eup",
  "desc_wooridul-sikdang":"Un restaurante de comidas caseras coreanas (baekban) en un callejón de Jochiwon-eup",
  "desc_donseu":"Un local de donkatsu y udon en un callejón de Jochiwon-eup",
  "desc_the-ramen":"Una tienda de ramen en un callejón de Jochiwon-eup",
  "desc_sushi-power-plant-12g":"Un especialista en sushi y rollos en un callejón de Jochiwon-eup",
  "desc_halmoni-tteokbokki":"Tteokbokki dulce y picante al estilo tradicional, el bocadillo favorito de los estudiantes",
  "desc_sookine-bapsang":"Un restaurante de comidas caseras coreanas (baekban) en un callejón de Jochiwon-eup",
  pagerAria:"Páginas de la lista de restaurantes", pagerPrev:"Página anterior", pagerNext:"Página siguiente",
  sortRecommend:"Recomendado", sortName:"Nombre (A-Z)", sortRating:"Mejor calificado", sortReviews:"Más reseñado", sortLatest:"Más reciente", sortDistance:"Más cercano",
  priceMin:"Mín", priceMax:"Máx", priceWon:"wones",
  filterEmpty:"Todavía no hay restaurantes que coincidan con estos filtros.",
  filterEmptySub:"¿Qué tal estos?", filterReset:"Borrar filtros y mostrar todo",
  filterEmptyKorean:"🍚 Coreana", filterEmptyJapanese:"🍜 Japonesa", filterEmptyWestern:"🍝 Occidental",
  exampleGridTitle:"🔎 Restaurantes de ejemplo (pendiente de reconocimiento de campo)",
  exampleGridSub:'Información de referencia hasta que se complete el reconocimiento de campo. Toca el corazón para guardar un lugar en "Quiero ir".',
  loadMore:'Mostrar más restaurantes <span class="badge-soon">Abre en septiembre</span>',
  reviewEyebrow:"RESEÑAS", reviewTitle:"Historias de quienes ya estuvieron allí",
  reviewSearchPh:"Buscar reseñas (nombre del restaurante, palabra clave)",
  reviewWriteBtn:"Escribe una reseña tú también",
  reviewSoon:"<strong>Los datos de reseñas llegarán pronto</strong> — una vez que se acumulen reseñas reales de visitas tras el inicio del semestre de septiembre, también se lanzará una función de resumen de reseñas con IA.",
  surveyTitle:"Cuéntanos un poco sobre tus gustos", surveyBody:"Responde una breve encuesta sobre nivel de picante, categorías favoritas y presupuesto para obtener recomendaciones de restaurantes a tu medida.", surveyBtn:"Iniciar la encuesta de gustos",
  shareEyebrow:"COMPARTIR", shareTitle:"Cuéntaselo también a tus amigos de la universidad",
  shareBody:'Las joyas escondidas son aún mejores cuando se comparten. Recomienda "Bap Meokeoreo Wa" a un amigo.',
  shareKakao:"Compartir en KakaoTalk", shareCopy:"Copiar enlace", shareText:"Compartir por mensaje", shareInsta:"Compartir en Instagram",
  joinEyebrow:"JUNTOS", joinTitle:"Construyamos esto juntos",
  joinBody:"Para los dueños, para nosotros, para los vecinos: hemos hecho espacio para cualquiera que quiera unirse a este proyecto.",
  join1Title:'¿Eres dueño de un restaurante?<span class="badge-soon">Abre en septiembre</span>',
  join1Body:"Un espacio de registro para dueños de restaurantes locales de Jochiwon que quieran que su restaurante aparezca destacado.",
  join2Title:"Échanos una mano", join2Body:"Buscamos personas para unirse como compañeros de equipo en planificación, desarrollo, diseño e investigación de campo.",
  join3Title:"Cuéntanos también sobre lugares locales en tu zona", join3Body:"Incluso fuera de Jochiwon, si te identificas con lo que hacemos, hablemos cuando quieras.",
  signupTitle:"Sé el primero en enterarte", signupBody:"Te enviaremos un correo antes que a nadie cuando se lance la beta y cuando se añadan nuevos restaurantes.",
  signupEmailPh:"Ingresa tu dirección de correo electrónico", signupBtn:"Regístrate anticipadamente",
  signupErrEmail:"¡Esa dirección de correo se ve un poco rara! 💌",
  signupMsg:"¡Ya estás registrado! Te avisaremos antes que a nadie cuando lancemos 🌾",
  footerAbout:'"KU-jodae! Ayudemos a los dueños locales" — un proyecto de contribución social de Matjip KU-jodae, un equipo de estudiantes del campus de Sejong de la Universidad de Korea, creado para crecer junto con la comunidad empresarial local.',
  footerServiceHead:"Servicio", footerMapLink:"Ver mapa", footerPassLink:'Bono de comida del nieto<span class="badge-live">Reservas abiertas</span>', footerSponsorLink:"Apóyanos",
  footerInfoHead:"Información", footerIntroLink:"Acerca de este servicio", footerFaqLink:"Contáctanos", footerSignupLink:"Suscríbete a las alertas de lanzamiento",
  footerAdminHead:"Administración", footerAnalyticsLink:"Análisis de uso", footerOwnerLink:"Página del dueño",
  adminGateTitle:"Verificación de administrador", adminGateBody:"Estás por ir a la página de análisis de uso. Por favor ingresa la contraseña.",
  adminGateOk:"Entrar", adminGateWrong:"Esa contraseña no coincide.",
  footerLegalHead:"Legal", footerPrivacyLink:"Política de privacidad", footerTermsLink:"Términos de servicio",
  footerOperator:"<b>Operador</b> Matjip KU-jodae, un equipo de estudiantes del campus de Sejong de la Universidad de Korea",
  footerProject:"<b>Nombre del proyecto</b> KU-jodae! Ayudemos a los dueños locales",
  footerServiceName:"<b>Nombre del servicio</b> Bap Meokeoreo Wa",
  footerEmail:"<b>Correo de contacto</b> (por anunciar)",
  footerOfficer:"<b>Encargado de privacidad</b> (por anunciar)",
  footerBottom:"© 2026 Bap Meokeoreo Wa · KU-jodae! Ayudemos a los dueños locales. Matjip KU-jodae (campus de Sejong de la Universidad de Korea).",
  a11yToggle:"🔍 Modo de texto grande",
  confirmOk:"Aceptar", confirmNo:"No",
  cardReviewPending:"🔎 Reseñas en vivo próximamente", cardVisitBadge:"✔ Visitado", cardLiveBadge:"🌐 Reseñas de Google en vivo", cardMockTag:"Datos de ejemplo",
  cardVisitedLabel:"✔ Visita registrada", cardMarkVisited:"Marcar como visitado", cardWantToVisit:"Añadir a quiero ir",
  filterCountTemplate:"{n} restaurantes",
  detailAddress:"📍 Dirección", detailHours:"🕐 Horario", detailClosed:"🚫 Cerrado", detailPhone:"☎️ Teléfono", detailReservation:"📅 Reservas",
  copyAddressBtn:"Copiar dirección", copyPhoneBtn:"Copiar teléfono",
  copyOkTitle:"Copiado", copyOkBody:"Ya está en tu portapapeles: pégalo donde lo necesites.",
  copyFailTitle:"No se pudo copiar", copyFailBody:"El navegador bloqueó la copia. Selecciona el texto y cópialo a mano.",
  detailCapacity:"🪑 Capacidad", detailParking:"🚗 Estacionamiento", detailMobilePay:"📱 Pago móvil", detailVouchers:"🎟️ Bonos/vales",
  detailMenuTitle:"Menú", detailOrigin:"Origen: ", detailExampleNote:"* Esta es información de ejemplo — los detalles reales se añadirán tras el reconocimiento de campo.",
  detailStubTitle:"Detalles próximamente", detailStubBody:" se añadirá tras el reconocimiento de campo de septiembre. Consulta la ficha de Gukbap de la Abuela de Jochiwon para ver un adelanto de lo que incluirá.",
  detailStubBodyFull:"Dirección, horario, menú y origen de los ingredientes",
  detailStubBodyPartial:"Horario, menú y origen de los ingredientes",
  closeBtn:"Cerrar",
  googleReviewTitle:"Reseñas de Google", googleReviewLoading:"Cargando reseñas...", googleReviewError:"No se pudieron cargar las reseñas. Inténtalo de nuevo en un momento.",
  aiSummaryTitle:"Resumen de reseñas con IA", aiSummaryLoading:"🤖 Resumiendo reseñas...",
  detailMapFocus:"🗺️ Ver en el mapa",
  detailNoLocationNote:"🧭 Son datos de ejemplo sin ubicación real todavía, así que no se puede mostrar en el mapa.",
  googleReviewNotFound:"😢 No pudimos encontrar este restaurante en Google Maps.", googleReviewNone:"Aún no hay reseñas.",
  googleReviewLink:"Ver todas las reseñas en Google Maps →", googleReviewAnon:"Anónimo",
  liveSearchLoading:"Buscando...", liveSearchEmpty:"No se encontraron resultados.", liveSearchError:"La búsqueda falló. Inténtalo de nuevo en un momento.",
  searchNoResultsFor:"No hay resultados para \"{q}\".", searchDidYouMean:"¿Quisiste decir esto?",
  searchCheckSpelling:"Comprueba que el término de búsqueda sea correcto.", searchMaybeThisShop:"¿Buscabas alguno de estos locales?",
  confirmLoginTitle:"Se requiere iniciar sesión", confirmLoginBody:"Esta función requiere iniciar sesión. ¡Inicia sesión y crea tu propia lista de restaurantes!", confirmLoginOk:"Iniciar sesión", confirmLoginCancel:"Cerrar",
  discardTitle:"¿Salir sin terminar?", discardBody:"Lo que has elegido hasta ahora no se guardará.",
  discardOk:"Salir", discardCancel:"Continuar",
  confirmUnsave:"¿Quitar de tu lista de quiero ir?", confirmUnsaveVisited:"¿Quitar de tu lista de quiero ir? También se eliminará tu registro de visita a este lugar.", confirmSave:"¿Añadir este restaurante a tu lista de quiero ir?", confirmVisited:"¿Marcar este restaurante como visitado?",
  surveyPrev:"Anterior", surveyNext:"Siguiente", surveyResult:"Ver resultados",
  surveyResultTitle:"¿Qué tal estos?", surveyResultSub:"Restaurantes locales elegidos según tu gusto",
  gameTitle:"Decidamos qué comer, al estilo de un juego", gameSub:"¡Se acabó la indecisión! Elige uno de los dos",
  gameTarotName:"Tarot del menú de hoy", gameTarotDesc:"Saca una carta y revela tu destino gastronómico",
  gameRouletteName:"Ruleta de menú", gameRouletteDesc:"Escribe lo que se te antoja y deja que la ruleta decida",
  gameBack:"← Elegir otro juego",
  tarotTitle:"Tarot del menú de hoy", tarotSub:"{n} cartas están fluyendo. Toca para sacar la comida de hoy",
  tarotRedraw:"Sacar otra vez",
  rouletteTitle:"Ruleta de menú", rouletteSub:"Añade 2 o más antojos y luego gira",
  roulettePh:"ej. gukbap, pizza, malatang", rouletteAdd:"Añadir",
  rouletteEmpty:"Añade algunos platillos", rouletteMin:"Añade 2 o más platillos",
  rouletteReady:"{n} opciones para elegir", rouletteSpin:"🎡 Girar", rouletteRespin:"🎡 Girar de nuevo", rouletteSlotLabel:"Número de casillas",
  authIntentSave:"Para guardar lugares que quieres visitar, ¡primero conviértete en uno de nuestros nietos!",
  authIntentMypage:"Necesitarás registrarte para usar Mi Página.",
  authIntentReview:"Por favor regístrate primero para dejar una reseña.",
  authIntentPass:"Los bonos de comida se guardan en tu cuenta, así que por favor regístrate primero.",
  authIntentLogin:"¡Bienvenido de nuevo! Por favor inicia sesión en tu cuenta.",
  authTitle:"Conviértete en uno de nuestros nietos", authTabSignup:"Registrarse", authTabLogin:"Iniciar sesión",
  authNameLabel:"Nombre", authNamePh:"¿Cómo debemos llamarte?",
  authIdLabel:"Correo electrónico", authIdPh:"ejemplo@correo.com",
  authPwLabel:"Contraseña", authPwPh:"Contraseña",
  authPw2Label:"Confirmar contraseña", authPw2Ph:"Ingresa tu contraseña de nuevo",
  authSubmitSignup:"Registrarme y empezar", authSubmitLogin:"Iniciar sesión",
  authErrFormat:"Por favor ingresa una dirección de correo electrónico válida.",
  authErrPwMismatch:"Las contraseñas no coinciden. Por favor verifica de nuevo.",
  authErrDupe:'Esta cuenta ya existe. Por favor inicia sesión desde la pestaña "Iniciar sesión".',
  authErrNotFound:'No se encontró ninguna cuenta. Por favor regístrate primero desde la pestaña "Registrarse".',
  authErrPwShort:"La contraseña debe tener al menos 6 caracteres.",
  mypageResetSaved:"Borrar lista de quiero ir", mypageResetVisited:"Borrar lista de visitados", mypageResetPass:"Borrar reservas de bonos",
  resetSavedTitle:"Borrar lista de quiero ir", resetSavedBody:"Esto borra todos los lugares que guardaste. Tu lista de visitados y tus reservas de bonos se conservan.",
  resetVisitedTitle:"Borrar lista de visitados", resetVisitedBody:"Esto borra todas las marcas de visitado. Tu lista de guardados y tus reseñas se conservan.",
  resetPassTitle:"Borrar reservas de bonos", resetPassBody:"Esto borra todas las reservas de bonos. Tus listas de guardados y visitados se conservan.",
  authErrPwEmpty:"Por favor ingresa tu contraseña.",
  authErrNameEmpty:"Por favor dinos cómo llamarte.",
  authErrNotConfirmed:"Tu correo aún no está verificado. Por favor revisa tu bandeja de entrada.",
  authErrNeedConfirm:"Te enviamos un correo de confirmación. Por favor verifícalo y luego inicia sesión.",
  authErrRate:"Demasiadas solicitudes. Por favor inténtalo de nuevo en un momento.",
  authErrNetwork:"La conexión falló. Por favor inténtalo de nuevo en un momento.",
  authErrOffline:"No podemos conectar con el servidor de inicio de sesión en este momento. Por favor inténtalo de nuevo en un momento.",
  authErrGeneric:"Algo salió mal. Por favor inténtalo de nuevo en un momento.",
  authErrWrongPw:"Contraseña incorrecta.",
  authWelcomeTitle:"¡Bienvenido, {name}!", authWelcomeBody:"Registro completo. Te avisaremos antes que a nadie cuando lancemos oficialmente.",
  authWelcomeBodyLogin:"¡Bienvenido de nuevo! Qué bueno verte otra vez.",
  authWelcomeMypageBtn:"Ir a Mi Página",
  headerAuthSavedLabel:"Mis lugares guardados", headerAuthMypageTitle:"Mi Página de {name}",
  logoutTitle:"¿Cerrar sesión?", logoutBody:"Después de cerrar sesión, necesitarás iniciar sesión de nuevo para usar las listas guardadas, escribir reseñas y más.",
  logoutOk:"Cerrar sesión", logoutCancel:"Cancelar",
  mypageTitle:"Mi Página de {name}", mypageTitleGeneric:"Mi Página",
  mypageTabSaved:"Quiero ir", mypageTabVisited:"Visitados", mypageTabPass:"Bonos de comida",
  allergyTitle:"🥜 Configuración de alergias", allergySub:"Te avisaremos antes de abrir un lugar que pueda usar lo que elijas.",
  allergyWarnTitle:"Ten en cuenta antes de entrar", allergyWarnBody:"Este lugar puede servir platos que contienen {list}. Por favor confirma con el dueño antes de pedir.",
  allergyWarnOk:"Entendido, mostrar",
  allergen_shellfish:"Mariscos con caparazón", allergen_fish:"Pescado y mariscos", allergen_milk:"Leche", allergen_wheat:"Trigo y gluten",
  allergen_nuts:"Frutos secos", allergen_pork:"Cerdo", allergen_beef:"Res", allergen_egg:"Huevo",
  mypageResetLink:"Restablecer toda mi actividad", mypageLogoutBtn:"Cerrar sesión",
  mypageEmptySaved:"Aún no hay restaurantes guardados.", mypageEmptyVisited:"Aún no hay registros de visitas.",
  mypageEmptyPass:"Aún no hay bonos de comida reservados.<br>Elige un restaurante que te guste en la sección de bono de comida del nieto.",
  mypageRemoveSavedTitle:"Quitar de quiero ir", mypageRemoveVisitedTitle:"Cancelar registro de visita",
  mypageConfirmUnvisit:"¿Cancelar este registro de visita?",
  mypageCancelPassTitle:"Cancelar reserva", mypageConfirmCancelPass:"¿Cancelar esta reserva de bono de comida?", mypageCancelPassOk:"Cancelar reserva",
  resetTitle:"Restablecer mi actividad", resetBody:"Esto borra tus lugares guardados, registros de visita, tus reseñas y reservas de bonos de comida. Esto no se puede deshacer.",
  resetOk:"Restablecer", resetCancel:"Cancelar",
  reviewFormTitle:"Escribe una reseña tú también", reviewFormSub:"Comparte una reseña honesta de un restaurante que hayas visitado.",
  reviewFormNoVisitTitle:"Aún no puedes escribir una reseña", reviewFormNoVisitBody:"Solo puedes reseñar restaurantes que hayas marcado como visitados.",
  reviewFormNoVisitOk:"Explorar restaurantes",
  reviewRatingLabel:"Calificación", reviewPlaceLabel:"Restaurante visitado",
  reviewVisibilityLabel:"Mostrar como", reviewVisibilityReal:"Nombre real ({name})", reviewVisibilityAnon:"Anónimo",
  reviewPhotoLabel:"Adjuntar una foto", reviewOptional:"Opcional",
  visitVerifyTitle:"Verifica tu visita",
  visitVerifySub:"¿Realmente fuiste a {name}? Sube un recibo o una foto del letrero del local.",
  visitVerifyNote:"Solo puedes reseñar lugares donde realmente hayas estado. La foto se usa solo para la verificación y no se almacena.",
  visitVerifyPhotoLabel:"Recibo o foto del letrero del local",
  visitVerifySubmit:"Verificar", visitVerifyChecking:"Verificando...",
  visitVerifyPreviewAlt:"Vista previa de la foto que subiste",
  visitVerifyErrNoPhoto:"Por favor sube una foto primero.",
  visitVerifyErrRead:"No pudimos leer esa foto. Por favor intenta con otra.",
  visitVerifyErrServer:"La verificación no está disponible en este momento. Por favor inténtalo de nuevo en un momento.",
  visitVerifyFailKind:"Esto no parece un recibo ni una foto del letrero del local.",
  visitVerifyFailName:"No pudimos encontrar el nombre de este restaurante en la foto.",
  reviewContentLabel:"Reseña", reviewContentPh:"¿Qué te gustó de este lugar?",
  reviewSubmitBtn:"Publicar reseña", reviewErrEmpty:"Por favor escribe tu reseña.",
  reviewSuccessTitle:"¡Tu reseña está publicada!",
  reviewSuccessBodyOk:"¡Gracias por compartir! Ya está publicada en la lista de reseñas.",
  reviewSuccessBodyFail:"Añadida a la lista de reseñas. Sin embargo, la foto era demasiado grande para guardarse — podría desaparecer al recargar.",
  anonReviewerName:"Nieto anónimo", namedReviewerSuffix:" (nieto)", defaultReviewerName:"Un nieto",
  introSub:"Descubrimiento de restaurantes locales en Jochiwon-eup",
  introVision:"Encontrar restaurantes de barrio reales que están ausentes o mal listados en los mapas, y construir un ecosistema de negocios locales donde clientes y dueños prosperen juntos",
  introOverviewHead:"Resumen del proyecto",
  introOverviewBody:'"KU-jodae! Ayudemos a los dueños locales" — un servicio liderado por estudiantes que comenzó como un proyecto de contribución social del campus de Sejong de la Universidad de Korea. Estudiantes y residentes encuentran y presentan personalmente restaurantes locales de Jochiwon-eup que están ausentes de Naver/Kakao Map, o listados con muy poca información.',
  introMakerHead:"Quién lo hizo",
  introMakerBody:"Un proyecto de contribución social planificado y creado por Matjip KU-jodae, un equipo de estudiantes de Política Económica del campus de Sejong de la Universidad de Korea.",
  introProgressHead:"Progreso",
  introProgressBody:"Actualmente estamos en la etapa previa al lanzamiento, recibiendo registros anticipados. Planeamos iniciar el servicio completo después de completar datos reales de restaurantes mediante un reconocimiento de campo tras el inicio del semestre de septiembre.",
  introFaqBtn:"Preguntas frecuentes",
  faqTitle:"Contáctanos", faqSub:"Consulta primero las preguntas frecuentes para obtener una respuesta rápida.",
  faqQ1:"¿Qué es Bap Meokeoreo Wa?",
  faqA1:'Es un servicio creado por el proyecto "KU-jodae! Ayudemos a los dueños locales". Estudiantes y residentes encuentran y presentan personalmente restaurantes locales de Jochiwon-eup que están ausentes de mapas en línea como Naver/Kakao Map, o listados con muy poca información.',
  faqQ2:"¿Esto es antes del lanzamiento oficial?",
  faqA2:"Sí, actualmente estamos recibiendo registros anticipados en una etapa de preparación, y planeamos lanzar el servicio completo con datos reales de restaurantes tras el inicio del semestre de septiembre.",
  faqQ3:"¿Puede mi restaurante también aparecer listado?",
  faqA3:'¡Sí! Estamos preparando una página de registro para dueños. Te guiaremos a través del botón "¿Eres dueño de un restaurante?" en cuanto esté disponible.',
  faqQ4:"¿Cualquiera puede escribir una reseña?",
  faqA4:"Solo los miembros con sesión iniciada pueden escribir una reseña, y solo para restaurantes que hayan marcado como visitados — una salvaguarda mínima contra reseñas falsas.",
  faqQ5:"¿Cómo se usa mi información personal?",
  faqA5:"Se usa solo para los fines indicados en nuestra Política de Privacidad (identificación de miembros, prestación del servicio), y se gestiona de forma segura conforme a las leyes pertinentes.",
  faqQ6:"Me gustaría ser voluntario o unirme como miembro del equipo.",
  faqA6:'Deja una consulta a través del menú "Échanos una mano" y te guiaremos en los próximos pasos.',
  faqFootPrefix:"¿No encontraste tu respuesta? Contáctanos a través de ", faqFootBold:"Échanos una mano", faqFootSuffix:".",
  faqContactBtn:"Enviar una consulta",
  supportTitle:"Échanos una mano", supportSub:"Estamos esperando manos amigas para este proyecto.",
  supportTeamTitle:"Me gustaría unirme como miembro del equipo", supportTeamDesc:"Desde investigación de campo hasta planificación y desarrollo — hay un lugar para ti.",
  supportSponsorTitle:"Me gustaría apoyar este proyecto", supportSponsorDesc:"Ayuda a impulsar un proyecto que se gestiona sin fines de lucro.",
  contactNameLabel:"Nombre", contactNamePh:"Nombre o apodo",
  contactReachLabel:"Contacto / correo electrónico", contactReachPh:"Correo electrónico o número de teléfono para contactarte",
  contactMessageOptional:"Opcional", contactSubmitBtn:"Enviar consulta",
  contactErrName:"Por favor ingresa tu nombre.", contactErrReach:"Por favor ingresa un correo electrónico o número de teléfono válido.",
  contactBack:"Atrás", contactSuccessTitle:"¡Tu consulta fue enviada!",
  contactSuccessBody:"Gracias, {name}. Te daremos seguimiento usando la información de contacto que dejaste.<br>({type})",
  ct_team_title:"Me gustaría unirme como miembro del equipo", ct_team_sub:"Estamos esperando compañeros de equipo que nos ayuden a construir esto juntos.",
  ct_team_note:"Planificación, desarrollo, diseño, investigación de campo — cualquier rol es bienvenido. Te contactaremos usando la información que dejes.",
  ct_team_field:"Área en la que te gustaría ayudar",
  ct_team_opt1:"Investigación de campo (encontrar restaurantes)", ct_team_opt2:"Planificación / Operaciones", ct_team_opt3:"Diseño", ct_team_opt4:"Desarrollo", ct_team_opt5:"Marketing / Contenido", ct_team_opt6:"Aún no lo sé",
  ct_team_msgLabel:"Algo más que quieras compartir", ct_team_msgPh:"Siéntete libre de compartir por qué te gustaría unirte o cuándo estás disponible.",
  ct_sponsor_title:"Me gustaría apoyar este proyecto", ct_sponsor_sub:"Cada aporte nos ayuda a encontrar un restaurante local más.",
  ct_sponsor_note:"Este proyecto actualmente funciona sin fines de lucro, por lo que las donaciones se usarán solo para investigación de campo y costos operativos.",
  ct_sponsor_field:"Tipo de apoyo",
  ct_sponsor_opt1:"Donación única", ct_sponsor_opt2:"Donación recurrente", ct_sponsor_opt3:"Donación en especie / habilidades", ct_sponsor_opt4:"Solo quiero preguntar primero",
  ct_sponsor_msgLabel:"Mensaje sobre tu apoyo", ct_sponsor_msgPh:"Comparte cualquier pregunta o idea sobre apoyarnos.",
  ct_partnerStore_title:"Solicitud de asociación para dueños", ct_partnerStore_sub:"Preparemos juntos bonos de comida y beneficios para estudiantes.",
  ct_partnerStore_note:"El registro y las solicitudes de asociación son gratuitos. Tú defines los beneficios del bono de comida y el período de validez; la estructura de tarifas aún está en discusión.",
  ct_partnerStore_field:"Beneficio preferido",
  ct_partnerStore_opt1:"Bono de comida 10+1", ct_partnerStore_opt2:"Descuento para estudiantes", ct_partnerStore_opt3:"Descuento en menú fijo", ct_partnerStore_opt4:"Solo quiero preguntar primero",
  ct_partnerStore_msgLabel:"Sobre tu restaurante / cualquier otra cosa", ct_partnerStore_msgPh:"Comparte el nombre de tu restaurante, ubicación y qué beneficio estás considerando.",
  ct_partnerOrg_title:"Consulta de asociación para consejo estudiantil / club", ct_partnerOrg_sub:"Creemos beneficios para los miembros de tu organización.",
  ct_partnerOrg_note:"El campus de Sejong de la Universidad de Korea ya tiene restaurantes asociados como el programa KU Membership. Queremos ayudar a que los restaurantes locales que no están en el mapa se unan a ese mismo espacio — los términos aún están en discusión.",
  ct_partnerOrg_field:"Tipo de organización",
  ct_partnerOrg_opt1:"Consejo estudiantil", ct_partnerOrg_opt2:"Club", ct_partnerOrg_opt3:"Organización del campus", ct_partnerOrg_opt4:"Otro grupo",
  ct_partnerOrg_msgLabel:"Qué tipo de asociación te gustaría", ct_partnerOrg_msgPh:"Comparte el nombre de tu organización, su tamaño y qué beneficio te gustaría.",
  ct_expand_title:"Encuentra también restaurantes locales en mi zona", ct_expand_sub:"Incluso fuera de Jochiwon, si te identificas con lo que hacemos.",
  ct_expand_note:"El modelo de ingresos aún no está definido. Actualmente estamos discutiendo la expansión sin fines de lucro y buscando cómo trabajar juntos.",
  ct_expand_field:"Zona que sugieres", ct_expand_fieldPh:"ej. Dodam-dong Sejong, Sachang-dong Cheongju",
  ct_expand_msgLabel:"Tu sugerencia", ct_expand_msgPh:"Cuéntanos sobre el barrio y por qué este servicio ayudaría allí.",
  passPerUnit:"por bono", passValidDays:"Válido por {n} días", passBuyBtn:"Reservar bono de comida",
  passSelectTitle:"Bono de comida de {name}", passHowMany:"¿Cuántos te gustaría?",
  passSummaryCount:"{n} bonos", passSummaryBonus:"Bono extra del dueño +{n}", passSummaryTotal:"Bonos que recibirás", passSummaryAmount:"Monto a pagar",
  passNextBtn:"Siguiente", passConfirmTitle:"¿Reservar así?", passConfirmSub:"Enviaremos una reserva con los siguientes detalles.",
  passSummaryStore:"Restaurante", passSummaryBought:"Bonos comprados", passSummaryValid:"Período de validez", passSummaryValidVal:"{n} días desde el primer uso",
  passPrepayNote:"Esto solo envía un <b>pre-pedido</b> por ahora. El pago real se activará en el lanzamiento oficial — no se cobra dinero en esta etapa.",
  passSubmitBtn:"Enviar pre-pedido", passBackBtn:"Atrás",
  passSuccessTitle:"¡Tu reserva está lista!",
  passSuccessBodyOk:"Guardamos {n} bonos para {name}. Te avisaremos sobre el pago cuando lancemos oficialmente.",
  passSuccessBodyFail:"Guardamos tu bono de {name}, pero el almacenamiento estaba lleno y no pudimos registrarlo — podría desaparecer al recargar.",
  passSeeMyPasses:"Ver mis bonos de comida",
  passInfoTitle:'Bono de comida del nieto<span class="badge-live">Reservas abiertas</span>',
  passInfoBody:"Precarga un bono de comida para un restaurante que te guste. Obtén bonos adicionales según lo que ofrezca el dueño, y usa uno en cada visita.",
  passBenefit1Title:"Compra 10, lleva 1 gratis", passBenefit1Body:"Compra al por mayor y obtén bonos adicionales fijados por el dueño. Los beneficios varían según el restaurante.",
  passBenefit2Title:"Prepaga tus comidas", passBenefit2Body:"Prepaga en lugar de pagar comida por comida, y aligera la carga de tu bolsillo.",
  passBenefit3Title:"Los dueños ganan clientes habituales", passBenefit3Body:"Los restaurantes reciben ingresos por adelantado y ganan clientes habituales — beneficioso para ambas partes.",
  passListTitle:"Restaurantes preparando bonos de comida",
  passMoreNote:"Más restaurantes abrirán bonos gradualmente tras conversar con los dueños durante el reconocimiento de campo de septiembre.",
  passPartnerTitle:"También estamos preparando asociaciones",
  passPartnerBody:"El campus de Sejong de la Universidad de Korea ya tiene restaurantes asociados como el programa KU Membership. Creemos que los restaurantes locales que no están en el mapa pueden unirse a ese mismo espacio una vez que sean descubiertos.",
  passPartnerStoreBtn:"Solicitud de asociación para dueños", passPartnerOrgBtn:"Consulta de asociación para consejo estudiantil / club",
  passNotice:"<strong>El pago aún no está disponible.</strong> Esta es actualmente una etapa de preparación sin fines de lucro, por lo que los bonos de comida solo aceptan <b>pre-pedidos</b> — la integración de pago real se lanzará oficialmente más adelante. Los beneficios y períodos de validez son definidos por el dueño.",
  join4Title:"Únete a nuestra comunidad", join4Body:"La conversación en tiempo real ocurre en nuestro grupo de redes sociales externo.",
  communityTitle:"Únete a nuestra comunidad",
  communityBody:"La conversación en tiempo real ocurre en un grupo de redes sociales externo como KakaoTalk o Instagram. Este sitio solo proporciona el enlace de acceso y el código QR.",
  communityJoinBtn:"Unirse al grupo",
  communityQrReady:"Escanea el código QR de abajo o toca el botón para unirte.",
  communityQrSoon:"El grupo aún no se ha creado. Una vez que esté abierto, aparecerá aquí un código QR.",
  grandchildDefaultName:"Nieto", mealPassWord:"Bono de comida", ownerBonusLabel:"Bono del dueño",
  mypagePassBonusWord:"bono", mypagePassDateLine:"Reservado el {date}", reviewCharUnit:"",
}, fr: {
  pageTitle:"Bap Meokeoreo Wa — Découvrez les restaurants de quartier de Jochiwon",
  navSearch:"Rechercher", navGame:"Roulette des menus", navSurvey:"Questionnaire de goûts", navLang:"Langue", navTheme:"Basculer entre le mode clair et le mode sombre", navLogin:"Se connecter",
  mapFilterAria:"Type d'affichage de la carte", mapFilterAll:"Tout", mapFilterFood:"Restaurants", mapFilterCafe:"Cafés",
  navMenuAria:"Sections principales", navMenuEat:"Restaurants", navMenuMap:"Carte", navMenuAbout:"À propos", navMenuJoin:"Participer",
  navLogout:"Se déconnecter",
  headerSearchPh:"Cherchez un restaurant, un ticket repas, un partenaire, une page",
  heroEyebrow:"KU-jodae ! Aidons les patrons du quartier",
  heroTitle:"Saviez-vous qu'il existe d'excellents restaurants absents de Naver, ou à peine référencés ? <span>Maintenant, vous le savez.</span>",
  heroBody:"Une équipe d'étudiants du campus de Sejong de l'université de Corée, <b>Matjip KU-jodae</b>, arpente les ruelles de Jochiwon-eup pour les dénicher. Nous commençons par repérer les vrais restaurants de quartier qui n'apparaissent pas du tout sur Naver/Kakao Map, ou qui n'y figurent qu'avec très peu d'informations. Découvrez des restaurants de quartier au rapport qualité-prix imbattable, à partager entre étudiants du campus de Sejong des universités de Corée et de Hongik et habitants du coin.",
  heroBrowse:"Voir les restaurants", heroNotify:"Prévenez-moi au lancement",
  heroQuickpick:"Sauvetage des indécis · Je choisis pour vous en 3 secondes", heroSpeech:"Venez manger avec nous !",
  problemEyebrow:"POURQUOI BAP MEOKEOREO WA", problemTitle:"À ne se fier qu'aux applis de cartes, on passe à côté du meilleur",
  problemSub:"Une histoire bien connue des étudiants du campus de Sejong des universités de Corée et de Hongik, des étudiants en échange, du personnel et des habitants du quartier.",
  problem1Title:"Absents des cartes, ou à peine référencés",
  problem1Body:"Les restaurants de quartier tenus depuis des décennies sont souvent totalement absents de Naver/Kakao Map, ou référencés sans la moindre photo : impossible de tomber dessus, même en cherchant.",
  problem2Title:"Toujours le même restaurant",
  problem2Body:"Il y a tout près des restaurants de quartier meilleurs et moins chers, mais faute de moyen de les trouver, on retombe toujours sur les mêmes.",
  problem3Title:"On a besoin les uns des autres",
  problem3Body:"Les clients découvrent des pépites, les patrons gagnent en visibilité et en chiffre d'affaires : tout le quartier avance ensemble.",
  discoverEyebrow:"BIENTÔT", discoverTitle:"Dès la rentrée, nous irons à la rencontre des patrons du quartier",
  discoverBody:"Des restaurants de quartier bien réels, totalement absents des cartes ou référencés avec très peu d'informations : après la rentrée de septembre, notre équipe d'étudiants arpentera les ruelles de Jochiwon-eup, rencontrera les patrons et les présentera ici un par un. Les restaurants portant le badge 🌐 ci-dessous donnent un aperçu de l'intégration en direct des avis Google ; la vraie liste des restaurants de quartier que nous aurons trouvés et accompagnés nous-mêmes remplira bientôt cet espace.",
  discoverStep1:"Repérage sur le terrain dans les ruelles de Jochiwon-eup (après la rentrée de septembre)",
  discoverStep2:"Trouver les patrons du quartier peu référencés et compléter leurs informations",
  discoverStep3:"Les publier ici comme vrais restaurants de quartier, un par un",
  discoverBtn:"Signalez un restaurant de quartier près de chez vous",
  mapEyebrow:"CARTE", mapTitle:"Mini-carte de Jochiwon",
  mapBody:"Les emplacements des restaurants que nous avons réellement vérifiés. Touchez un repère pour voir le détail. Les autres viendront peu à peu après le repérage de terrain de septembre.",
  mapCampusLabel:"🏫 Campus de Sejong de l'université de Corée",
  mapAuthFail:"Impossible de charger la carte.",
  eatLocalEyebrow:"MANGER LOCAL", eatLocalTitle:"On mange quoi aujourd'hui ?",
  realGridTitle:"📍 Restaurants réels vérifiés · Avis Google en direct",
  realGridSub:"Des restaurants réellement enregistrés sur Kakao/Google. Cliquez sur l'un d'eux pour voir aussitôt les notes et les avis réels.",
  liveSearchPh:"Vous ne trouvez pas un restaurant ? Tapez un nom pour chercher autour de vous en temps réel",
  liveSearchBtn:"Rechercher",
  catAll:"Tout", catKorean:"Coréen", catWestern:"Occidental", catChinese:"Chinois", catJapanese:"Japonais", catSnack:"Snacks", catCafe:"Cafés",
  descVarCafe0:"Un café au cadre agréable dans une ruelle de Jochiwon-eup",
  descVarCafe1:"Un café de ruelle où l'on boit vite fait avant de repartir",
  descVarCafe2:"Un café de ruelle idéal pour un passage entre deux cours",
  descVarCafe3:"Un café d'une ruelle de Jochiwon-eup où l'on s'installe tranquillement",
  descVarCafe4:"Un café de ruelle à Jochiwon-eup pour prendre une tasse en passant",
  descVarKorean0:"Un restaurant coréen de ruelle à Jochiwon-eup qui vous remet d'aplomb",
  descVarKorean1:"Un repas qui tient au corps, dans une ruelle de Jochiwon-eup",
  descVarKorean2:"Le restaurant coréen de ruelle où l'on va quand on ne sait pas quoi manger",
  descVarKorean3:"Une ruelle de Jochiwon-eup, pour quand la cuisine de la maison vous manque",
  descVarWestern0:"Un petit restaurant occidental niché dans une ruelle de Jochiwon-eup",
  descVarWestern1:"Un repas à la fourchette dans une ruelle de Jochiwon-eup",
  descVarWestern2:"Un restaurant occidental de ruelle à Jochiwon-eup, pour un jour un peu spécial",
  descVarChinese0:"Un restaurant chinois de ruelle à Jochiwon-eup au bon goût de wok",
  descVarChinese1:"Un bol de cuisine chinoise dans une ruelle de Jochiwon-eup",
  descVarChinese2:"La ruelle de Jochiwon-eup où l'on hésite entre jjajangmyeon et jjamppong",
  descVarJapanese0:"Un restaurant japonais tout tranquille dans une ruelle de Jochiwon-eup",
  descVarJapanese1:"Un bol de cuisine japonaise dans une ruelle de Jochiwon-eup",
  descVarJapanese2:"Un restaurant japonais de ruelle à Jochiwon-eup, que l'on vide d'une traite",
  descVarSnack0:"Un bunsik plein de nostalgie dans une ruelle de Jochiwon-eup",
  descVarSnack1:"Un bunsik de ruelle pour se caler l'estomac sans se ruiner",
  descVarSnack2:"Une ruelle de Jochiwon-eup, pour quand on a envie de tteokbokki",
  // 가게 이름 다국어 — restaurants[]에서 이전(rName()이 조회). id 순서 = restaurants[] 순서.
  "name_jochiwon-halmae-gukbap":"Gukbap de la Grand-mère de Jochiwon (조치원 할매국밥)",
  "name_yeokjeon-wang-donkatsu":"Yeokjeon Roi du Donkatsu (역전 왕돈까스)",
  "name_an-chef-jjambbong":"An-Chef Jjamppong Viande et Fruits de Mer (안쉐프고기해물짬뽕)",
  "name_jagal-dondon":"Jagal Dondon (자갈돈돈)",
  "name_wooridul-sikdang":"Wooridul Sikdang (우리들식당)",
  "name_paul-barna":"Paul, Barna (폴바나)",
  "name_donseu":"Donseu (돈스)",
  "name_the-ramen":"The Ramen (더라멘)",
  "name_sushi-power-plant-12g":"Centrale du Sushi 12g (초밥발전소12g)",
  "name_halmoni-tteokbokki":"Tteokbokki de la Grand-mère (할머니 떡볶이)",
  "name_parangsae-bunsik":"Bunsik de l'Oiseau Bleu (파랑새분식)",
  "name_sookine-bapsang":"La Table de Sooki (숙이네밥상)",
  "name_seochangri-181":"Seochang-ri 181 (서창리181)",
  "name_sammat-cafe":"Samat Cafe (삼맛카페)",
  "name_vanilla-garden":"Vanilla Garden (바닐라가든)",
  "name_dankong":"Dankong (단콩)",
  "name_paul-and-banabas":"Paul and Barnabas (폴앤바나바스)",
  "name_cafe-sujak":"Cafe Sujak (카페수작)",
  "name_cafe-calendar":"Cafe Calendar (카페캘린더)",
  "name_hong-cafe":"Hong Cafe (홍카페)",
  "name_matna-sikdang-bunsik":"Matna Restaurant et Bunsik (맛나식당분식)",
  "name_imone-dwaeji-gukbap":"Imone Dwaeji-gukbap (이모네돼지국밥)",
  "name_bundang-ilpum-guksu":"Bundang Ilpum Nouilles (분당일품국수)",
  "name_urban-lounge":"Urban Lounge (어반라운지)",
  "name_gyodong-jjambbong":"Gyodong Jjamppong (교동짬뽕)",
  "name_naive":"Naive (나이브)",
  "name_yuram-coffee-roasters":"Yuram Coffee Roasters (유람 커피로스터스)",
  "name_daily-point":"Dilly Point (딜리포인트)",
  "name_hunminjeongeum":"Hunminjeongeum (훈민정음)",
  "name_siot":"Siot (시옷)",
  "name_vib":"Vibe (비브)",
  "name_neomeo":"Neomeo (너머)",
  "name_chas":"Chas (차스)",
  "name_second-road":"Second Road (세컨로드)",
  "name_merry-go-round":"Merry-Go-Round (메리고라운드)",
  "name_roastery-cafe-in":"Roastery Cafe IN (로스터리 카페IN)",
  "name_defense":"Defense (디펜스)",
  // 가게 설명 다국어 — descVariant()에 안 걸리는 가게만(rDesc()가 조회).
  "desc_jochiwon-halmae-gukbap":"Une adresse à gukbap réputée, 40 ans de tradition et un bouillon corsé",
  "desc_yeokjeon-wang-donkatsu":"Un donkatsu épais fait maison, servi en portions généreuses",
  "desc_an-chef-jjambbong":"Un jjamppong bien relevé qui réunit viande et fruits de mer",
  "desc_jagal-dondon":"Un grill de viande dans une ruelle de Jochiwon-eup",
  "desc_wooridul-sikdang":"Un restaurant de cuisine familiale coréenne (baekban) dans une ruelle de Jochiwon-eup",
  "desc_donseu":"Une adresse à donkatsu et udon dans une ruelle de Jochiwon-eup",
  "desc_the-ramen":"Une boutique de ramen dans une ruelle de Jochiwon-eup",
  "desc_sushi-power-plant-12g":"Un spécialiste des sushis et makis dans une ruelle de Jochiwon-eup",
  "desc_halmoni-tteokbokki":"Un tteokbokki sucré-piquant à l'ancienne, le goûter préféré des étudiants",
  "desc_sookine-bapsang":"Un restaurant de cuisine familiale coréenne (baekban) dans une ruelle de Jochiwon-eup",
  pagerAria:"Pages de la liste des restaurants", pagerPrev:"Page précédente", pagerNext:"Page suivante",
  sortRecommend:"Recommandés", sortName:"Nom (A-Z)", sortRating:"Mieux notés", sortReviews:"Plus commentés", sortLatest:"Plus récents", sortDistance:"Plus proches",
  priceMin:"Min", priceMax:"Max", priceWon:"wons",
  filterEmpty:"Aucun restaurant ne correspond encore à ces filtres.",
  filterEmptySub:"Et ceux-là ?", filterReset:"Effacer les filtres et tout afficher",
  filterEmptyKorean:"🍚 Coréen", filterEmptyJapanese:"🍜 Japonais", filterEmptyWestern:"🍝 Occidental",
  exampleGridTitle:"🔎 Restaurants d'exemple (en attente du repérage de terrain)",
  exampleGridSub:"Informations de référence en attendant la fin du repérage de terrain. Touchez le cœur pour ajouter un lieu à vos envies d'y aller.",
  loadMore:'Afficher plus de restaurants <span class="badge-soon">Ouverture en septembre</span>',
  reviewEyebrow:"AVIS", reviewTitle:"Les récits de celles et ceux qui y sont allés",
  reviewSearchPh:"Rechercher dans les avis (nom du restaurant, mot-clé)",
  reviewWriteBtn:"Écrivez votre avis vous aussi",
  reviewSoon:"<strong>Les données d'avis arrivent bientôt</strong> — dès que de vrais avis de visite s'accumuleront après la rentrée de septembre, une fonction de résumé des avis par IA sera lancée elle aussi.",
  surveyTitle:"Parlez-nous un peu de vos goûts", surveyBody:"Répondez à un court questionnaire sur le niveau de piquant, vos catégories préférées et votre budget pour recevoir des recommandations sur mesure.", surveyBtn:"Commencer le questionnaire de goûts",
  shareEyebrow:"PARTAGER", shareTitle:"Parlez-en aussi à vos amis de la fac",
  shareBody:"Les pépites sont encore meilleures quand on les partage. Recommandez « Bap Meokeoreo Wa » à un ami.",
  shareKakao:"Partager sur KakaoTalk", shareCopy:"Copier le lien", shareText:"Partager par message", shareInsta:"Partager sur Instagram",
  joinEyebrow:"ENSEMBLE", joinTitle:"Construisons-le ensemble",
  joinBody:"Pour les patrons, pour nous, pour le quartier : nous avons fait de la place à toutes celles et ceux qui veulent rejoindre ce projet.",
  join1Title:'Vous tenez un restaurant ?<span class="badge-soon">Ouverture en septembre</span>',
  join1Body:"Un espace d'inscription pour les patrons de restaurants de quartier de Jochiwon qui souhaitent mettre leur établissement en avant.",
  join2Title:"Donnez-nous un coup de main", join2Body:"Nous cherchons des personnes prêtes à nous rejoindre en planification, développement, design et enquête de terrain.",
  join3Title:"Parlez-nous aussi des adresses de votre quartier", join3Body:"Même en dehors de Jochiwon, si notre démarche vous parle, écrivez-nous quand vous voulez.",
  signupTitle:"Soyez les premiers informés", signupBody:"Nous vous enverrons un e-mail avant tout le monde au lancement de la bêta et à chaque nouveau restaurant ajouté.",
  signupEmailPh:"Saisissez votre adresse e-mail", signupBtn:"S'inscrire en avant-première",
  signupErrEmail:"Cette adresse e-mail a l'air un peu bizarre ! 💌",
  signupMsg:"C'est enregistré ! Nous vous préviendrons avant tout le monde au lancement 🌾",
  footerAbout:"« KU-jodae ! Aidons les patrons du quartier » — un projet de contribution sociale de Matjip KU-jodae, une équipe d'étudiants du campus de Sejong de l'université de Corée, né pour grandir avec les commerces du quartier.",
  footerServiceHead:"Service", footerMapLink:"Voir la carte", footerPassLink:'Ticket repas du petit-enfant<span class="badge-live">Réservations ouvertes</span>', footerSponsorLink:"Nous soutenir",
  footerInfoHead:"Informations", footerIntroLink:"À propos du service", footerFaqLink:"Nous contacter", footerSignupLink:"S'abonner aux alertes de lancement",
  footerAdminHead:"Administration", footerAnalyticsLink:"Statistiques d'utilisation", footerOwnerLink:"Espace patron",
  adminGateTitle:"Vérification administrateur", adminGateBody:"Vous allez accéder à la page des statistiques d'utilisation. Veuillez saisir le mot de passe.",
  adminGateOk:"Entrer", adminGateWrong:"Ce mot de passe ne correspond pas.",
  footerLegalHead:"Mentions légales", footerPrivacyLink:"Politique de confidentialité", footerTermsLink:"Conditions d'utilisation",
  footerOperator:"<b>Exploitant</b> Matjip KU-jodae, une équipe d'étudiants du campus de Sejong de l'université de Corée",
  footerProject:"<b>Nom du projet</b> KU-jodae ! Aidons les patrons du quartier",
  footerServiceName:"<b>Nom du service</b> Bap Meokeoreo Wa",
  footerEmail:"<b>E-mail de contact</b> (à venir)",
  footerOfficer:"<b>Responsable de la protection des données</b> (à venir)",
  footerBottom:"© 2026 Bap Meokeoreo Wa · KU-jodae ! Aidons les patrons du quartier. Matjip KU-jodae (campus de Sejong de l'université de Corée).",
  a11yToggle:"🔍 Mode gros caractères",
  confirmOk:"OK", confirmNo:"Non",
  cardReviewPending:"🔎 Avis en direct bientôt disponibles", cardVisitBadge:"✔ Visité", cardLiveBadge:"🌐 Avis Google en direct", cardMockTag:"Données d'exemple",
  cardVisitedLabel:"✔ Visite enregistrée", cardMarkVisited:"Marquer comme visité", cardWantToVisit:"Ajouter à mes envies d'y aller",
  filterCountTemplate:"{n} restaurants",
  detailAddress:"📍 Adresse", detailHours:"🕐 Horaires", detailClosed:"🚫 Fermeture", detailPhone:"☎️ Téléphone", detailReservation:"📅 Réservation",
  copyAddressBtn:"Copier l'adresse", copyPhoneBtn:"Copier le numéro",
  copyOkTitle:"Copié", copyOkBody:"C'est dans votre presse-papiers : collez-le où vous en avez besoin.",
  copyFailTitle:"Copie impossible", copyFailBody:"Le navigateur a bloqué la copie. Sélectionnez le texte et copiez-le à la main.",
  detailCapacity:"🪑 Capacité", detailParking:"🚗 Stationnement", detailMobilePay:"📱 Paiement mobile", detailVouchers:"🎟️ Bons et chèques",
  detailMenuTitle:"Menu", detailOrigin:"Origine : ", detailExampleNote:"* Ces informations ne sont qu'un exemple — le détail réel sera ajouté après le repérage de terrain.",
  detailStubTitle:"Détails à venir", detailStubBody:" seront ajoutés après le repérage de terrain de septembre. Jetez un œil à la fiche du Gukbap de la Grand-mère de Jochiwon pour un aperçu de ce qui vous attend.",
  detailStubBodyFull:"L'adresse, les horaires, le menu et l'origine des ingrédients",
  detailStubBodyPartial:"Les horaires, le menu et l'origine des ingrédients",
  closeBtn:"Fermer",
  googleReviewTitle:"Avis Google", googleReviewLoading:"Chargement des avis…", googleReviewError:"Impossible de charger les avis. Réessayez dans un instant.",
  aiSummaryTitle:"Résumé des avis par IA", aiSummaryLoading:"🤖 Résumé des avis en cours…",
  detailMapFocus:"🗺️ Voir sur la carte",
  detailNoLocationNote:"🧭 Ce sont des données d'exemple, sans emplacement réel pour l'instant : impossible de l'afficher sur la carte.",
  googleReviewNotFound:"😢 Nous n'avons pas trouvé ce restaurant sur Google Maps.", googleReviewNone:"Aucun avis pour l'instant.",
  googleReviewLink:"Voir tous les avis sur Google Maps →", googleReviewAnon:"Anonyme",
  liveSearchLoading:"Recherche en cours…", liveSearchEmpty:"Aucun résultat trouvé.", liveSearchError:"La recherche a échoué. Réessayez dans un instant.",
  searchNoResultsFor:"Aucun résultat pour « {q} ».", searchDidYouMean:"Cherchiez-vous ceci ?",
  searchCheckSpelling:"Vérifiez l'orthographe de votre recherche.", searchMaybeThisShop:"Cherchiez-vous l'une de ces boutiques ?",
  confirmLoginTitle:"Connexion requise", confirmLoginBody:"Cette fonction demande d'être connecté. Connectez-vous et composez votre propre liste de restaurants !", confirmLoginOk:"Se connecter", confirmLoginCancel:"Fermer",
  discardTitle:"Quitter sans terminer ?", discardBody:"Ce que vous avez choisi jusqu'ici ne sera pas enregistré.",
  discardOk:"Quitter", discardCancel:"Continuer",
  confirmUnsave:"Retirer de vos envies d'y aller ?", confirmUnsaveVisited:"Retirer de vos envies d'y aller ? Votre visite enregistrée pour ce lieu sera supprimée elle aussi.", confirmSave:"Ajouter ce restaurant à vos envies d'y aller ?", confirmVisited:"Marquer ce restaurant comme visité ?",
  surveyPrev:"Précédent", surveyNext:"Suivant", surveyResult:"Voir les résultats",
  surveyResultTitle:"Et ceux-là ?", surveyResultSub:"Des restaurants de quartier choisis selon vos goûts",
  gameTitle:"Choisissons quoi manger, façon jeu", gameSub:"Fini l'indécision ! Choisissez l'un des deux",
  gameTarotName:"Tarot du menu du jour", gameTarotDesc:"Tirez une carte et découvrez votre destin culinaire",
  gameRouletteName:"Roulette des menus", gameRouletteDesc:"Écrivez vos envies et laissez la roulette décider",
  gameBack:"← Choisir un autre jeu",
  tarotTitle:"Tarot du menu du jour", tarotSub:"{n} cartes défilent. Touchez pour tirer le plat du jour",
  tarotRedraw:"Tirer à nouveau",
  rouletteTitle:"Roulette des menus", rouletteSub:"Ajoutez au moins 2 envies, puis lancez",
  roulettePh:"ex. gukbap, pizza, malatang", rouletteAdd:"Ajouter",
  rouletteEmpty:"Ajoutez quelques plats", rouletteMin:"Ajoutez au moins 2 plats",
  rouletteReady:"{n} options parmi lesquelles choisir", rouletteSpin:"🎡 Lancer", rouletteRespin:"🎡 Relancer", rouletteSlotLabel:"Nombre de cases",
  authIntentSave:"Pour garder les lieux où vous voulez aller, devenez d'abord l'un de nos petits-enfants !",
  authIntentMypage:"Il faut vous inscrire pour utiliser Mon espace.",
  authIntentReview:"Inscrivez-vous d'abord pour laisser un avis.",
  authIntentPass:"Les tickets repas sont rattachés à votre compte, alors inscrivez-vous d'abord.",
  authIntentLogin:"Content de vous revoir ! Connectez-vous à votre compte.",
  authTitle:"Devenez l'un de nos petits-enfants", authTabSignup:"S'inscrire", authTabLogin:"Se connecter",
  authNameLabel:"Nom", authNamePh:"Comment doit-on vous appeler ?",
  authIdLabel:"Adresse e-mail", authIdPh:"exemple@courriel.com",
  authPwLabel:"Mot de passe", authPwPh:"Mot de passe",
  authPw2Label:"Confirmer le mot de passe", authPw2Ph:"Saisissez à nouveau votre mot de passe",
  authSubmitSignup:"M'inscrire et commencer", authSubmitLogin:"Se connecter",
  authErrFormat:"Veuillez saisir une adresse e-mail valide.",
  authErrPwMismatch:"Les mots de passe ne correspondent pas. Veuillez vérifier.",
  authErrDupe:"Ce compte existe déjà. Connectez-vous depuis l'onglet « Se connecter ».",
  authErrNotFound:"Aucun compte trouvé. Inscrivez-vous d'abord depuis l'onglet « S'inscrire ».",
  authErrPwShort:"Le mot de passe doit comporter au moins 6 caractères.",
  mypageResetSaved:"Effacer mes envies d'y aller", mypageResetVisited:"Effacer mes visites", mypageResetPass:"Effacer mes réservations de tickets",
  resetSavedTitle:"Effacer mes envies d'y aller", resetSavedBody:"Cela efface tous les lieux que vous avez gardés. Vos visites et vos réservations de tickets sont conservées.",
  resetVisitedTitle:"Effacer mes visites", resetVisitedBody:"Cela efface toutes les marques de visite. Vos lieux gardés et vos avis sont conservés.",
  resetPassTitle:"Effacer mes réservations de tickets", resetPassBody:"Cela efface toutes les réservations de tickets. Vos lieux gardés et vos visites sont conservés.",
  authErrPwEmpty:"Veuillez saisir votre mot de passe.",
  authErrNameEmpty:"Dites-nous comment vous appeler.",
  authErrNotConfirmed:"Votre e-mail n'est pas encore vérifié. Consultez votre boîte de réception.",
  authErrNeedConfirm:"Nous vous avons envoyé un e-mail de confirmation. Vérifiez-le, puis connectez-vous.",
  authErrRate:"Trop de tentatives. Réessayez dans un instant.",
  authErrNetwork:"La connexion a échoué. Réessayez dans un instant.",
  authErrOffline:"Nous n'arrivons pas à joindre le serveur de connexion pour le moment. Réessayez dans un instant.",
  authErrGeneric:"Une erreur est survenue. Réessayez dans un instant.",
  authErrWrongPw:"Mot de passe incorrect.",
  authWelcomeTitle:"Bienvenue, {name} !", authWelcomeBody:"Inscription terminée. Nous vous préviendrons avant tout le monde lors du lancement officiel.",
  authWelcomeBodyLogin:"Content de vous revoir ! Ravi de vous retrouver.",
  authWelcomeMypageBtn:"Aller à Mon espace",
  headerAuthSavedLabel:"Mes lieux gardés", headerAuthMypageTitle:"Mon espace de {name}",
  logoutTitle:"Se déconnecter ?", logoutBody:"Après la déconnexion, il faudra vous reconnecter pour retrouver vos listes, écrire des avis, etc.",
  logoutOk:"Se déconnecter", logoutCancel:"Annuler",
  mypageTitle:"Mon espace de {name}", mypageTitleGeneric:"Mon espace",
  mypageTabSaved:"Envies d'y aller", mypageTabVisited:"Visités", mypageTabPass:"Tickets repas",
  allergyTitle:"🥜 Réglage des allergies", allergySub:"Nous vous préviendrons avant d'ouvrir un lieu susceptible d'utiliser ce que vous cochez.",
  allergyWarnTitle:"À savoir avant d'entrer", allergyWarnBody:"Ce lieu peut servir des plats contenant {list}. Vérifiez auprès du patron avant de commander.",
  allergyWarnOk:"Compris, afficher",
  allergen_shellfish:"Crustacés", allergen_fish:"Poissons et fruits de mer", allergen_milk:"Lait", allergen_wheat:"Blé et gluten",
  allergen_nuts:"Fruits à coque", allergen_pork:"Porc", allergen_beef:"Bœuf", allergen_egg:"Œuf",
  mypageResetLink:"Réinitialiser toute mon activité", mypageLogoutBtn:"Se déconnecter",
  mypageEmptySaved:"Aucun restaurant gardé pour l'instant.", mypageEmptyVisited:"Aucune visite enregistrée pour l'instant.",
  mypageEmptyPass:"Aucun ticket repas réservé pour l'instant.<br>Choisissez un restaurant qui vous plaît dans la section Ticket repas du petit-enfant.",
  mypageRemoveSavedTitle:"Retirer de mes envies d'y aller", mypageRemoveVisitedTitle:"Annuler la visite enregistrée",
  mypageConfirmUnvisit:"Annuler cette visite enregistrée ?",
  mypageCancelPassTitle:"Annuler la réservation", mypageConfirmCancelPass:"Annuler cette réservation de ticket repas ?", mypageCancelPassOk:"Annuler la réservation",
  resetTitle:"Réinitialiser mon activité", resetBody:"Cela efface vos lieux gardés, vos visites, vos avis et vos réservations de tickets repas. C'est irréversible.",
  resetOk:"Réinitialiser", resetCancel:"Annuler",
  reviewFormTitle:"Écrivez votre avis vous aussi", reviewFormSub:"Partagez un avis sincère sur un restaurant où vous êtes allé.",
  reviewFormNoVisitTitle:"Vous ne pouvez pas encore écrire d'avis", reviewFormNoVisitBody:"Vous ne pouvez commenter que les restaurants que vous avez marqués comme visités.",
  reviewFormNoVisitOk:"Parcourir les restaurants",
  reviewRatingLabel:"Note", reviewPlaceLabel:"Restaurant visité",
  reviewVisibilityLabel:"Afficher sous", reviewVisibilityReal:"Nom réel ({name})", reviewVisibilityAnon:"Anonyme",
  reviewPhotoLabel:"Joindre une photo", reviewOptional:"Facultatif",
  visitVerifyTitle:"Vérifiez votre visite",
  visitVerifySub:"Êtes-vous vraiment allé chez {name} ? Envoyez un reçu ou une photo de l'enseigne.",
  visitVerifyNote:"Vous ne pouvez commenter que les lieux où vous êtes réellement allé. La photo sert uniquement à la vérification et n'est pas conservée.",
  visitVerifyPhotoLabel:"Reçu ou photo de l'enseigne",
  visitVerifySubmit:"Vérifier", visitVerifyChecking:"Vérification en cours…",
  visitVerifyPreviewAlt:"Aperçu de la photo que vous avez envoyée",
  visitVerifyErrNoPhoto:"Veuillez d'abord envoyer une photo.",
  visitVerifyErrRead:"Nous n'avons pas pu lire cette photo. Essayez-en une autre.",
  visitVerifyErrServer:"La vérification n'est pas disponible pour le moment. Réessayez dans un instant.",
  visitVerifyFailKind:"Cela ne ressemble ni à un reçu ni à une photo d'enseigne.",
  visitVerifyFailName:"Nous n'avons pas retrouvé le nom de ce restaurant sur la photo.",
  reviewContentLabel:"Avis", reviewContentPh:"Qu'est-ce qui vous a plu dans ce lieu ?",
  reviewSubmitBtn:"Publier l'avis", reviewErrEmpty:"Veuillez écrire votre avis.",
  reviewSuccessTitle:"Votre avis est publié !",
  reviewSuccessBodyOk:"Merci du partage ! Il figure déjà dans la liste des avis.",
  reviewSuccessBodyFail:"Ajouté à la liste des avis. En revanche, la photo était trop lourde pour être enregistrée — elle pourrait disparaître au rechargement.",
  anonReviewerName:"Petit-enfant anonyme", namedReviewerSuffix:" (petit-enfant)", defaultReviewerName:"Un petit-enfant",
  introSub:"À la découverte des restaurants de quartier de Jochiwon-eup",
  introVision:"Retrouver les vrais restaurants de quartier absents ou mal référencés sur les cartes, et bâtir un écosystème de commerces locaux où clients et patrons prospèrent ensemble",
  introOverviewHead:"Présentation du projet",
  introOverviewBody:"« KU-jodae ! Aidons les patrons du quartier » — un service porté par des étudiants, né d'un projet de contribution sociale du campus de Sejong de l'université de Corée. Étudiants et habitants trouvent et présentent eux-mêmes les restaurants de quartier de Jochiwon-eup absents de Naver/Kakao Map, ou référencés avec très peu d'informations.",
  introMakerHead:"Qui l'a créé",
  introMakerBody:"Un projet de contribution sociale conçu et réalisé par Matjip KU-jodae, une équipe d'étudiants en politique économique du campus de Sejong de l'université de Corée.",
  introProgressHead:"Avancement",
  introProgressBody:"Nous sommes actuellement en phase de pré-lancement et recueillons les inscriptions anticipées. Nous prévoyons d'ouvrir le service complet après avoir complété les données réelles des restaurants lors d'un repérage de terrain, après la rentrée de septembre.",
  introFaqBtn:"Questions fréquentes",
  faqTitle:"Nous contacter", faqSub:"Consultez d'abord les questions fréquentes pour une réponse rapide.",
  faqQ1:"Qu'est-ce que Bap Meokeoreo Wa ?",
  faqA1:"C'est un service né du projet « KU-jodae ! Aidons les patrons du quartier ». Étudiants et habitants trouvent et présentent eux-mêmes les restaurants de quartier de Jochiwon-eup absents des cartes en ligne comme Naver/Kakao Map, ou référencés avec très peu d'informations.",
  faqQ2:"Sommes-nous avant le lancement officiel ?",
  faqA2:"Oui, nous recueillons pour l'instant les inscriptions anticipées en phase de préparation, et prévoyons d'ouvrir le service complet avec de vraies données de restaurants après la rentrée de septembre.",
  faqQ3:"Mon restaurant peut-il être référencé lui aussi ?",
  faqA3:"Oui ! Nous préparons une page d'inscription pour les patrons. Nous vous guiderons via le bouton « Vous tenez un restaurant ? » dès qu'elle sera prête.",
  faqQ4:"Tout le monde peut-il écrire un avis ?",
  faqA4:"Seuls les membres connectés peuvent écrire un avis, et uniquement pour les restaurants qu'ils ont marqués comme visités — une protection minimale contre les faux avis.",
  faqQ5:"Comment mes données personnelles sont-elles utilisées ?",
  faqA5:"Elles servent uniquement aux finalités indiquées dans notre politique de confidentialité (identification des membres, fourniture du service) et sont gérées en toute sécurité, conformément à la réglementation applicable.",
  faqQ6:"J'aimerais donner un coup de main ou rejoindre l'équipe.",
  faqA6:"Laissez-nous un message via le menu « Donnez-nous un coup de main » et nous vous indiquerons la suite.",
  faqFootPrefix:"Vous n'avez pas trouvé votre réponse ? Écrivez-nous via ", faqFootBold:"Donnez-nous un coup de main", faqFootSuffix:".",
  faqContactBtn:"Envoyer une demande",
  supportTitle:"Donnez-nous un coup de main", supportSub:"Ce projet attend des mains amies.",
  supportTeamTitle:"J'aimerais rejoindre l'équipe", supportTeamDesc:"De l'enquête de terrain à la planification et au développement — il y a une place pour vous.",
  supportSponsorTitle:"J'aimerais soutenir ce projet", supportSponsorDesc:"Aidez à faire avancer un projet mené sans but lucratif.",
  contactNameLabel:"Nom", contactNamePh:"Nom ou pseudo",
  contactReachLabel:"Contact / e-mail", contactReachPh:"E-mail ou numéro de téléphone pour vous joindre",
  contactMessageOptional:"Facultatif", contactSubmitBtn:"Envoyer la demande",
  contactErrName:"Veuillez saisir votre nom.", contactErrReach:"Veuillez saisir un e-mail ou un numéro de téléphone valide.",
  contactBack:"Retour", contactSuccessTitle:"Votre demande est bien partie !",
  contactSuccessBody:"Merci, {name}. Nous vous recontacterons avec les coordonnées que vous avez laissées.<br>({type})",
  ct_team_title:"J'aimerais rejoindre l'équipe", ct_team_sub:"Nous attendons des coéquipiers pour construire tout ça ensemble.",
  ct_team_note:"Planification, développement, design, enquête de terrain — tous les rôles sont les bienvenus. Nous vous contacterons avec les coordonnées que vous laisserez.",
  ct_team_field:"Domaine dans lequel vous aimeriez aider",
  ct_team_opt1:"Enquête de terrain (trouver des restaurants)", ct_team_opt2:"Planification / Exploitation", ct_team_opt3:"Design", ct_team_opt4:"Développement", ct_team_opt5:"Marketing / Contenu", ct_team_opt6:"Je ne sais pas encore",
  ct_team_msgLabel:"Autre chose à nous dire", ct_team_msgPh:"Dites-nous librement pourquoi vous aimeriez nous rejoindre, ou quand vous êtes disponible.",
  ct_sponsor_title:"J'aimerais soutenir ce projet", ct_sponsor_sub:"Chaque contribution nous aide à trouver un restaurant de quartier de plus.",
  ct_sponsor_note:"Ce projet est pour l'instant mené sans but lucratif : les dons servent uniquement à l'enquête de terrain et aux frais de fonctionnement.",
  ct_sponsor_field:"Type de soutien",
  ct_sponsor_opt1:"Don ponctuel", ct_sponsor_opt2:"Don régulier", ct_sponsor_opt3:"Don en nature / en compétences", ct_sponsor_opt4:"Je préfère d'abord poser une question",
  ct_sponsor_msgLabel:"Message à propos de votre soutien", ct_sponsor_msgPh:"Partagez vos questions ou vos idées sur la façon de nous soutenir.",
  ct_partnerStore_title:"Demande de partenariat pour les patrons", ct_partnerStore_sub:"Préparons ensemble des tickets repas et des avantages pour les étudiants.",
  ct_partnerStore_note:"L'inscription et les demandes de partenariat sont gratuites. Vous fixez vous-même les avantages du ticket repas et sa durée de validité ; le modèle de commission est encore en discussion.",
  ct_partnerStore_field:"Avantage souhaité",
  ct_partnerStore_opt1:"Ticket repas 10+1", ct_partnerStore_opt2:"Réduction étudiante", ct_partnerStore_opt3:"Réduction sur un menu fixe", ct_partnerStore_opt4:"Je préfère d'abord poser une question",
  ct_partnerStore_msgLabel:"À propos de votre restaurant / autre chose", ct_partnerStore_msgPh:"Indiquez le nom de votre restaurant, son emplacement et l'avantage que vous envisagez.",
  ct_partnerOrg_title:"Partenariat avec une association étudiante ou un club", ct_partnerOrg_sub:"Créons des avantages pour les membres de votre organisation.",
  ct_partnerOrg_note:"Le campus de Sejong de l'université de Corée a déjà des restaurants partenaires, comme le programme KU Membership. Nous voulons aider les restaurants de quartier absents des cartes à rejoindre ce même espace — les conditions sont encore en discussion.",
  ct_partnerOrg_field:"Type d'organisation",
  ct_partnerOrg_opt1:"Association étudiante", ct_partnerOrg_opt2:"Club", ct_partnerOrg_opt3:"Organisation du campus", ct_partnerOrg_opt4:"Autre groupe",
  ct_partnerOrg_msgLabel:"Le type de partenariat souhaité", ct_partnerOrg_msgPh:"Indiquez le nom de votre organisation, sa taille et l'avantage que vous aimeriez.",
  ct_expand_title:"Trouvez aussi les restaurants de quartier chez moi", ct_expand_sub:"Même en dehors de Jochiwon, si notre démarche vous parle.",
  ct_expand_note:"Le modèle économique n'est pas encore défini. Nous réfléchissons pour l'instant à une extension sans but lucratif et cherchons comment travailler ensemble.",
  ct_expand_field:"Quartier que vous proposez", ct_expand_fieldPh:"ex. Dodam-dong à Sejong, Sachang-dong à Cheongju",
  ct_expand_msgLabel:"Votre proposition", ct_expand_msgPh:"Parlez-nous du quartier et de ce que ce service y apporterait.",
  passPerUnit:"par ticket", passValidDays:"Valable {n} jours", passBuyBtn:"Réserver un ticket repas",
  passSelectTitle:"Ticket repas de {name}", passHowMany:"Combien en voulez-vous ?",
  passSummaryCount:"{n} tickets", passSummaryBonus:"Bonus du patron +{n}", passSummaryTotal:"Tickets que vous recevrez", passSummaryAmount:"Montant à payer",
  passNextBtn:"Suivant", passConfirmTitle:"On réserve comme ça ?", passConfirmSub:"Nous enverrons une réservation avec le détail suivant.",
  passSummaryStore:"Restaurant", passSummaryBought:"Tickets achetés", passSummaryValid:"Durée de validité", passSummaryValidVal:"{n} jours à partir de la première utilisation",
  passPrepayNote:"Pour l'instant, cela n'envoie qu'une <b>pré-commande</b>. Le paiement réel sera activé au lancement officiel — aucune somme n'est prélevée à ce stade.",
  passSubmitBtn:"Envoyer la pré-commande", passBackBtn:"Retour",
  passSuccessTitle:"Votre réservation est enregistrée !",
  passSuccessBodyOk:"Nous avons mis {n} tickets de côté pour {name}. Nous vous préviendrons pour le paiement au lancement officiel.",
  passSuccessBodyFail:"Nous avons enregistré votre ticket pour {name}, mais le stockage était plein et nous n'avons pas pu le consigner — il pourrait disparaître au rechargement.",
  passSeeMyPasses:"Voir mes tickets repas",
  passInfoTitle:'Ticket repas du petit-enfant<span class="badge-live">Réservations ouvertes</span>',
  passInfoBody:"Préchargez un ticket repas chez un restaurant que vous aimez. Recevez des tickets supplémentaires selon l'offre du patron, et utilisez-en un à chaque visite.",
  passBenefit1Title:"10 achetés, 1 offert", passBenefit1Body:"Achetez en lot et recevez les tickets supplémentaires fixés par le patron. Les avantages varient d'un restaurant à l'autre.",
  passBenefit2Title:"Payez vos repas d'avance", passBenefit2Body:"Payez d'avance au lieu de régler repas après repas, et allégez la charge sur votre porte-monnaie.",
  passBenefit3Title:"Les patrons gagnent des habitués", passBenefit3Body:"Les restaurants encaissent à l'avance et gagnent des clients réguliers — tout le monde y gagne.",
  passListTitle:"Restaurants qui préparent des tickets repas",
  passMoreNote:"D'autres restaurants ouvriront progressivement des tickets, après nos échanges avec les patrons lors du repérage de terrain de septembre.",
  passPartnerTitle:"Nous préparons aussi des partenariats",
  passPartnerBody:"Le campus de Sejong de l'université de Corée a déjà des restaurants partenaires, comme le programme KU Membership. Nous pensons que les restaurants de quartier absents des cartes peuvent rejoindre ce même espace une fois qu'on les aura découverts.",
  passPartnerStoreBtn:"Demande de partenariat pour les patrons", passPartnerOrgBtn:"Partenariat avec une association étudiante ou un club",
  passNotice:"<strong>Le paiement n'est pas encore disponible.</strong> Nous sommes pour l'instant dans une phase de préparation sans but lucratif : les tickets repas n'acceptent donc que des <b>pré-commandes</b> — l'intégration du paiement réel arrivera au lancement officiel. Les avantages et les durées de validité sont fixés par le patron.",
  join4Title:"Rejoignez notre communauté", join4Body:"Les échanges en temps réel se passent dans notre groupe sur un réseau social externe.",
  communityTitle:"Rejoignez notre communauté",
  communityBody:"Les échanges en temps réel se passent dans un groupe sur un réseau social externe comme KakaoTalk ou Instagram. Ce site fournit seulement le lien d'accès et le QR code.",
  communityJoinBtn:"Rejoindre le groupe",
  communityQrReady:"Scannez le QR code ci-dessous ou touchez le bouton pour nous rejoindre.",
  communityQrSoon:"Le groupe n'est pas encore créé. Dès qu'il sera ouvert, un QR code apparaîtra ici.",
  grandchildDefaultName:"Petit-enfant", mealPassWord:"Ticket repas", ownerBonusLabel:"Bonus du patron",
  mypagePassBonusWord:"bonus", mypagePassDateLine:"Réservé le {date}", reviewCharUnit:"",
}, de: {
  pageTitle:"Bap Meokeoreo Wa — Entdecke Jochiwons lokale Restaurants",
  navSearch:"Suche", navGame:"Menü-Roulette-Spiel", navSurvey:"Geschmacksumfrage", navLang:"Sprache", navTheme:"Hell-/Dunkelmodus wechseln", navLogin:"Anmelden",
  mapFilterAria:"Kartenanzeigetyp", mapFilterAll:"Alle", mapFilterFood:"Essen", mapFilterCafe:"Cafés",
  navMenuAria:"Hauptbereiche", navMenuEat:"Restaurants", navMenuMap:"Karte", navMenuAbout:"Über uns", navMenuJoin:"Mitmachen",
  navLogout:"Abmelden",
  headerSearchPh:"Restaurants, Essensgutscheine, Partner, Seiten suchen",
  heroEyebrow:"KU-jodae! Helft den lokalen Wirten",
  heroTitle:'Wusstest du, dass es tolle Restaurants gibt, die bei Naver fehlen oder kaum gelistet sind? <span>Jetzt weißt du es.</span>',
  heroBody:'Ein Studententeam vom Sejong-Campus der Korea University, <b>Matjip KU-jodae</b>, durchstreift die Seitengassen von Jochiwon-eup, um sie zu finden. Wir beginnen damit, echte lokale Restaurants aufzuspüren, die entweder komplett auf Naver/Kakao Map fehlen oder nur mit sehr wenigen Informationen gelistet sind. Entdecke preiswerte lokale Restaurants, die Studierende der Korea University und Hongik University am Sejong-Campus sowie Anwohner:innen gemeinsam genießen können.',
  heroBrowse:"Restaurants durchsuchen", heroNotify:"Beim Start benachrichtigen",
  heroQuickpick:"Entscheidungshilfe · Wähle in 3 Sekunden für mich", heroSpeech:"Komm mit uns essen!",
  problemEyebrow:"WARUM BAP MEOKEOREO WA", problemTitle:"Wer nur Karten-Apps vertraut, verpasst gutes Essen",
  problemSub:"Eine vertraute Geschichte für Studierende der Korea University und Hongik University am Sejong-Campus, Austauschstudierende, Mitarbeitende und Anwohner:innen.",
  problem1Title:"Fehlt auf Karten oder kaum gelistet",
  problem1Body:"Alteingesessene lokale Restaurants fehlen oft komplett auf Naver/Kakao Map oder sind ohne ein einziges Foto gelistet – so tauchen sie nicht einmal bei der Suche auf.",
  problem2Title:"Immer dieselbe Mensa",
  problem2Body:"In der Nähe gibt es preiswertere, leckerere lokale Restaurants, aber ohne Möglichkeit, sie zu finden, triffst du immer wieder dieselbe Wahl.",
  problem3Title:"Wir müssen einander helfen",
  problem3Body:"Kund:innen entdecken versteckte Perlen, und Wirte gewinnen mehr Sichtbarkeit und Umsatz – eine Struktur, in der unsere ganze Nachbarschaft gemeinsam wächst.",
  discoverEyebrow:"DEMNÄCHST", discoverTitle:"Nach Semesterbeginn besuchen wir die lokalen Wirte persönlich",
  discoverBody:"Echte lokale Restaurants, die komplett unlisted sind oder kaum Informationen haben – unser Studententeam wird nach dem Semesterbeginn im September die Seitengassen von Jochiwon-eup durchstreifen, die Wirte treffen und sie hier nach und nach vorstellen. Restaurants mit dem 🌐-Abzeichen unten zeigen als Vorschau, wie die Live-Google-Bewertungsintegration aussieht; die echte Liste der lokalen Restaurants, die wir selbst gefunden und unterstützt haben, füllt diesen Platz bald.",
  discoverStep1:"Feldrecherche in den Seitengassen von Jochiwon-eup (nach Semesterbeginn im September)",
  discoverStep2:"Wenig gelistete lokale Wirte finden und ihre Infos ergänzen",
  discoverStep3:"Sie hier nach und nach als echte lokale Restaurants veröffentlichen",
  discoverBtn:"Melde ein lokales Restaurant in deiner Nähe",
  mapEyebrow:"KARTE", mapTitle:"Jochiwon-Minikarte",
  mapBody:"Standorte von Restaurants, die wir tatsächlich bestätigt haben. Tippe auf eine Markierung für Details. Der Rest kommt nach der Feldrecherche im September nach und nach dazu.",
  mapCampusLabel:"🏫 Sejong-Campus der Korea University",
  mapAuthFail:"Die Karte konnte nicht geladen werden.",
  eatLocalEyebrow:"LOKAL ESSEN", eatLocalTitle:"Was gibt's heute zu essen?",
  realGridTitle:"📍 Bestätigte echte Restaurants · Live-Google-Bewertungen",
  realGridSub:"Restaurants, die tatsächlich bei Kakao/Google registriert sind. Klick auf eines, um sofort echte Bewertungen und Rezensionen zu sehen.",
  liveSearchPh:"Findest du ein Restaurant nicht? Gib einen Namen ein, um in Echtzeit in der Nähe zu suchen",
  liveSearchBtn:"Suchen",
  catAll:"Alle", catKorean:"Koreanisch", catWestern:"Westlich", catChinese:"Chinesisch", catJapanese:"Japanisch", catSnack:"Snacks", catCafe:"Cafés",
  descVarCafe0:"Ein Café mit guter Atmosphäre in einer Seitengasse von Jochiwon-eup",
  descVarCafe1:"Ein Café in der Seitengasse für einen schnellen Kaffee",
  descVarCafe2:"Ein Café in der Seitengasse, ideal für zwischen den Vorlesungen",
  descVarCafe3:"Ein Café in einer Seitengasse von Jochiwon-eup zum Verweilen",
  descVarCafe4:"Ein Café in einer Seitengasse von Jochiwon-eup für noch eine Tasse",
  descVarKorean0:"Ein herzhaftes koreanisches Lokal in einer Seitengasse von Jochiwon-eup",
  descVarKorean1:"Eine sättigende Mahlzeit in einer Seitengasse von Jochiwon-eup",
  descVarKorean2:"Das koreanische Lokal in der Seitengasse für „Was esse ich heute“",
  descVarKorean3:"Ein Lokal in einer Seitengasse von Jochiwon-eup für Hausmannskost-Sehnsucht",
  descVarWestern0:"Ein gemütliches westliches Restaurant in einer Seitengasse von Jochiwon-eup",
  descVarWestern1:"Eine Mahlzeit mit Messer und Gabel in einer Seitengasse von Jochiwon-eup",
  descVarWestern2:"Ein westliches Lokal in der Seitengasse von Jochiwon-eup für einen besonderen Tag",
  descVarChinese0:"Ein chinesisches Lokal mit Wok-Aroma in einer Seitengasse von Jochiwon-eup",
  descVarChinese1:"Eine Schüssel chinesisches Essen in einer Seitengasse von Jochiwon-eup",
  descVarChinese2:"Das Lokal in der Seitengasse von Jochiwon-eup für die Jjajangmyeon-oder-Jjamppong-Debatte",
  descVarJapanese0:"Ein ruhiges japanisches Restaurant in einer Seitengasse von Jochiwon-eup",
  descVarJapanese1:"Eine Schüssel japanisches Essen in einer Seitengasse von Jochiwon-eup",
  descVarJapanese2:"Ein japanisches Lokal in der Seitengasse von Jochiwon-eup, das man restlos leert",
  descVarSnack0:"Ein nostalgischer Bunsik-Laden in einer Seitengasse von Jochiwon-eup",
  descVarSnack1:"Ein Bunsik-Laden in der Seitengasse für einen leichten Snack",
  descVarSnack2:"Ein Lokal in einer Seitengasse von Jochiwon-eup für Tteokbokki-Lust",
  // 가게 이름 다국어 — restaurants[]에서 이전(rName()이 조회). id 순서 = restaurants[] 순서.
  "name_jochiwon-halmae-gukbap":"Jochiwon Omas Gukbap (조치원 할매국밥)",
  "name_yeokjeon-wang-donkatsu":"Yeokjeon König des Donkatsu (역전 왕돈까스)",
  "name_an-chef-jjambbong":"An-Chef Fleisch- und Meeresfrüchte-Jjamppong (안쉐프고기해물짬뽕)",
  "name_jagal-dondon":"Jagal Dondon (자갈돈돈)",
  "name_wooridul-sikdang":"Wooridul Sikdang (우리들식당)",
  "name_paul-barna":"Paul, Barna (폴바나)",
  "name_donseu":"Donseu (돈스)",
  "name_the-ramen":"The Ramen (더라멘)",
  "name_sushi-power-plant-12g":"Sushi-Kraftwerk 12g (초밥발전소12g)",
  "name_halmoni-tteokbokki":"Omas Tteokbokki (할머니 떡볶이)",
  "name_parangsae-bunsik":"Blauvogel-Bunsik (파랑새분식)",
  "name_sookine-bapsang":"Sookis Tisch (숙이네밥상)",
  "name_seochangri-181":"Seochang-ri 181 (서창리181)",
  "name_sammat-cafe":"Samat Cafe (삼맛카페)",
  "name_vanilla-garden":"Vanilla Garden (바닐라가든)",
  "name_dankong":"Dankong (단콩)",
  "name_paul-and-banabas":"Paul and Barnabas (폴앤바나바스)",
  "name_cafe-sujak":"Cafe Sujak (카페수작)",
  "name_cafe-calendar":"Cafe Calendar (카페캘린더)",
  "name_hong-cafe":"Hong Cafe (홍카페)",
  "name_matna-sikdang-bunsik":"Matna Restaurant & Bunsik (맛나식당분식)",
  "name_imone-dwaeji-gukbap":"Imones Schweine-Gukbap (이모네돼지국밥)",
  "name_bundang-ilpum-guksu":"Bundang Ilpum Nudeln (분당일품국수)",
  "name_urban-lounge":"Urban Lounge (어반라운지)",
  "name_gyodong-jjambbong":"Gyodong Jjamppong (교동짬뽕)",
  "name_naive":"Naive (나이브)",
  "name_yuram-coffee-roasters":"Yuram Coffee Roasters (유람 커피로스터스)",
  "name_daily-point":"Dilly Point (딜리포인트)",
  "name_hunminjeongeum":"Hunminjeongeum (훈민정음)",
  "name_siot":"Siot (시옷)",
  "name_vib":"Vibe (비브)",
  "name_neomeo":"Neomeo (너머)",
  "name_chas":"Chas (차스)",
  "name_second-road":"Second Road (세컨로드)",
  "name_merry-go-round":"Merry-Go-Round (메리고라운드)",
  "name_roastery-cafe-in":"Roastery Cafe IN (로스터리 카페IN)",
  "name_defense":"Defense (디펜스)",
  // 가게 설명 다국어 — descVariant()에 안 걸리는 가게만(rDesc()가 조회).
  "desc_jochiwon-halmae-gukbap":"Ein bekanntes Gukbap-Lokal mit 40 Jahren Tradition und kräftiger Brühe",
  "desc_yeokjeon-wang-donkatsu":"Dicker, handgemachter Donkatsu in großzügigen Portionen",
  "desc_an-chef-jjambbong":"Ein scharfes Jjamppong-Lokal mit Fleisch und Meeresfrüchten",
  "desc_jagal-dondon":"Ein Grillrestaurant in einer Seitengasse von Jochiwon-eup",
  "desc_wooridul-sikdang":"Ein koreanisches Hausmannskost-Restaurant in einer Seitengasse von Jochiwon-eup",
  "desc_donseu":"Ein Donkatsu- und Udon-Lokal in einer Seitengasse von Jochiwon-eup",
  "desc_the-ramen":"Ein Ramen-Laden in einer Seitengasse von Jochiwon-eup",
  "desc_sushi-power-plant-12g":"Ein Sushi- und Maki-Spezialist in einer Seitengasse von Jochiwon-eup",
  "desc_halmoni-tteokbokki":"Süß-scharfes Tteokbokki nach altem Rezept, der Lieblingssnack der Studierenden",
  "desc_sookine-bapsang":"Ein koreanisches Hausmannskost-Restaurant in einer Seitengasse von Jochiwon-eup",
  pagerAria:"Seiten der Restaurantliste", pagerPrev:"Vorherige Seite", pagerNext:"Nächste Seite",
  sortRecommend:"Empfohlen", sortName:"Name (A-Z)", sortRating:"Bestbewertet", sortReviews:"Meiste Bewertungen", sortLatest:"Neueste", sortDistance:"Nächstgelegen",
  priceMin:"Min", priceMax:"Max", priceWon:"Won",
  filterEmpty:"Noch keine Restaurants passen zu diesen Filtern.",
  filterEmptySub:"Wie wäre es mit diesen?", filterReset:"Filter zurücksetzen und alles anzeigen",
  filterEmptyKorean:"🍚 Koreanisch", filterEmptyJapanese:"🍜 Japanisch", filterEmptyWestern:"🍝 Westlich",
  exampleGridTitle:"🔎 Beispielrestaurants (Feldrecherche steht noch aus)",
  exampleGridSub:'Platzhalterinfos, bis die Feldrecherche abgeschlossen ist. Tippe aufs Herz, um einen Ort bei „Möchte ich besuchen“ zu speichern.',
  loadMore:'Mehr Restaurants anzeigen <span class="badge-soon">Start im September</span>',
  reviewEyebrow:"BEWERTUNG", reviewTitle:"Geschichten von Leuten, die schon da waren",
  reviewSearchPh:"Bewertungen durchsuchen (Restaurantname, Stichwort)",
  reviewWriteBtn:"Schreib auch du eine Bewertung",
  reviewSoon:"<strong>Bewertungsdaten kommen bald</strong> — sobald sich nach dem Semesterbeginn im September echte Besuchsbewertungen ansammeln, startet auch eine KI-Bewertungszusammenfassung.",
  surveyTitle:"Erzähl uns etwas über deinen Geschmack", surveyBody:"Beantworte eine kurze Umfrage zu Schärfegrad, Lieblingskategorien und Budget, um passende Restaurantvorschläge zu erhalten.", surveyBtn:"Geschmacksumfrage starten",
  shareEyebrow:"TEILEN", shareTitle:"Erzähl es auch deinen Freund:innen an der Uni",
  shareBody:'Versteckte Perlen werden noch besser, je mehr sie geteilt werden. Empfiehl „Bap Meokeoreo Wa“ einem Freund oder einer Freundin.',
  shareKakao:"Auf KakaoTalk teilen", shareCopy:"Link kopieren", shareText:"Per SMS teilen", shareInsta:"Auf Instagram teilen",
  joinEyebrow:"GEMEINSAM", joinTitle:"Lass uns das gemeinsam aufbauen",
  joinBody:"Für Wirte, für uns, für Nachbar:innen – wir haben Platz für alle geschaffen, die bei diesem Projekt mitmachen wollen.",
  join1Title:'Bist du Restaurantbesitzer:in?<span class="badge-soon">Start im September</span>',
  join1Body:"Ein Anmeldebereich für lokale Wirte in Jochiwon, die ihr Restaurant vorgestellt haben möchten.",
  join2Title:"Hilf uns", join2Body:"Wir suchen Leute, die als Teammitglieder bei Planung, Entwicklung, Design und Feldrecherche mitmachen.",
  join3Title:"Erzähl uns auch von lokalen Orten in deiner Gegend", join3Body:"Auch außerhalb von Jochiwon – wenn dich unsere Idee anspricht, melde dich jederzeit.",
  signupTitle:"Sei als Erste:r informiert", signupBody:"Wir schicken dir zuerst eine E-Mail, wenn die Beta startet und wenn neue Restaurants hinzukommen.",
  signupEmailPh:"Gib deine E-Mail-Adresse ein", signupBtn:"Früh registrieren",
  signupErrEmail:"Diese E-Mail-Adresse sieht etwas seltsam aus! 💌",
  signupMsg:"Du bist angemeldet! Wir informieren dich zuerst, wenn wir starten 🌾",
  footerAbout:'„KU-jodae! Helft den lokalen Wirten“ — ein Sozialprojekt von Matjip KU-jodae, einem Studententeam vom Sejong-Campus der Korea University, das gemeinsam mit dem lokalen Gewerbe wachsen soll.',
  footerServiceHead:"Service", footerMapLink:"Karte ansehen", footerPassLink:'Enkel-Essensgutschein<span class="badge-live">Reservierung möglich</span>', footerSponsorLink:"Unterstütze uns",
  footerInfoHead:"Info", footerIntroLink:"Über diesen Service", footerFaqLink:"Kontakt", footerSignupLink:"Für Start-Benachrichtigung anmelden",
  footerAdminHead:"Verwaltung", footerAnalyticsLink:"Nutzungsstatistik", footerOwnerLink:"Wirte-Seite",
  adminGateTitle:"Admin-Prüfung", adminGateBody:"Du gehst zur Nutzungsstatistik-Seite. Bitte gib das Passwort ein.",
  adminGateOk:"Bestätigen", adminGateWrong:"Dieses Passwort stimmt nicht.",
  footerLegalHead:"Rechtliches", footerPrivacyLink:"Datenschutzerklärung", footerTermsLink:"Nutzungsbedingungen",
  footerOperator:"<b>Betreiber</b> Matjip KU-jodae, ein Studententeam vom Sejong-Campus der Korea University",
  footerProject:"<b>Projektname</b> KU-jodae! Helft den lokalen Wirten",
  footerServiceName:"<b>Servicename</b> Bap Meokeoreo Wa",
  footerEmail:"<b>Kontakt-E-Mail</b> (wird noch bekannt gegeben)",
  footerOfficer:"<b>Datenschutzbeauftragte:r</b> (wird noch bekannt gegeben)",
  footerBottom:"© 2026 Bap Meokeoreo Wa · KU-jodae! Helft den lokalen Wirten. Matjip KU-jodae (Sejong-Campus der Korea University).",
  a11yToggle:"🔍 Großschrift-Modus",
  confirmOk:"OK", confirmNo:"Nein",
  cardReviewPending:"🔎 Live-Bewertungen kommen bald", cardVisitBadge:"✔ Besucht", cardLiveBadge:"🌐 Live-Google-Bewertungen", cardMockTag:"Beispieldaten",
  cardVisitedLabel:"✔ Besuch erfasst", cardMarkVisited:"Als besucht markieren", cardWantToVisit:"Zu „Möchte ich besuchen“ hinzufügen",
  filterCountTemplate:"{n} Restaurants",
  detailAddress:"📍 Adresse", detailHours:"🕐 Öffnungszeiten", detailClosed:"🚫 Geschlossen", detailPhone:"☎️ Telefon", detailReservation:"📅 Reservierung",
  copyAddressBtn:"Adresse kopieren", copyPhoneBtn:"Telefonnummer kopieren",
  copyOkTitle:"Kopiert", copyOkBody:"In der Zwischenablage — füg es ein, wo du es brauchst.",
  copyFailTitle:"Kopieren fehlgeschlagen", copyFailBody:"Der Browser hat das Kopieren blockiert. Bitte markiere den Text und kopiere ihn von Hand.",
  detailCapacity:"🪑 Kapazität", detailParking:"🚗 Parken", detailMobilePay:"📱 Mobiles Bezahlen", detailVouchers:"🎟️ Gutscheine/Karten",
  detailMenuTitle:"Menü", detailOrigin:"Herkunft: ", detailExampleNote:"* Dies sind Beispielinfos — echte Details folgen nach der Feldrecherche.",
  detailStubTitle:"Details folgen bald", detailStubBody:" wird nach der Feldrecherche im September ergänzt. Schau dir die Karte von Jochiwon Omas Gukbap für eine Vorschau an, was enthalten sein wird.",
  detailStubBodyFull:"Adresse, Öffnungszeiten, Menü und Zutatenherkunft",
  detailStubBodyPartial:"Öffnungszeiten, Menü und Zutatenherkunft",
  closeBtn:"Schließen",
  googleReviewTitle:"Google-Bewertungen", googleReviewLoading:"Bewertungen werden geladen...", googleReviewError:"Bewertungen konnten nicht geladen werden. Bitte versuch es gleich noch einmal.",
  aiSummaryTitle:"KI-Bewertungszusammenfassung", aiSummaryLoading:"🤖 Bewertungen werden zusammengefasst...",
  detailMapFocus:"🗺️ Auf der Karte ansehen",
  detailNoLocationNote:"🧭 Dies sind Beispieldaten ohne echten Standort, daher kann es nicht auf der Karte angezeigt werden.",
  googleReviewNotFound:"😢 Wir konnten dieses Restaurant nicht auf Google Maps finden.", googleReviewNone:"Noch keine Bewertungen.",
  googleReviewLink:"Alle Bewertungen auf Google Maps ansehen →", googleReviewAnon:"Anonym",
  liveSearchLoading:"Suche läuft...", liveSearchEmpty:"Keine Ergebnisse gefunden.", liveSearchError:"Suche fehlgeschlagen. Bitte versuch es gleich noch einmal.",
  searchNoResultsFor:"Keine Ergebnisse für \"{q}\".", searchDidYouMean:"Meintest du das?",
  searchCheckSpelling:"Bitte prüfe, ob dein Suchbegriff richtig geschrieben ist.", searchMaybeThisShop:"Meintest du eines dieser Lokale?",
  confirmLoginTitle:"Anmeldung erforderlich", confirmLoginBody:"Diese Funktion erfordert eine Anmeldung. Melde dich an und erstelle deine eigene Restaurantliste!", confirmLoginOk:"Anmelden", confirmLoginCancel:"Schließen",
  discardTitle:"Ohne Abschluss verlassen?", discardBody:"Deine bisherige Auswahl wird nicht gespeichert.",
  discardOk:"Verlassen", discardCancel:"Weitermachen",
  confirmUnsave:"Aus deiner „Möchte ich besuchen“-Liste entfernen?", confirmUnsaveVisited:"Aus deiner „Möchte ich besuchen“-Liste entfernen? Dein Besuchseintrag für diesen Ort wird ebenfalls gelöscht.", confirmSave:"Dieses Restaurant zu deiner „Möchte ich besuchen“-Liste hinzufügen?", confirmVisited:"Dieses Restaurant als besucht markieren?",
  surveyPrev:"Zurück", surveyNext:"Weiter", surveyResult:"Ergebnisse ansehen",
  surveyResultTitle:"Wie wäre es mit diesen?", surveyResultSub:"Lokale Restaurants, passend zu deinem Geschmack ausgewählt",
  gameTitle:"Lass uns spielerisch entscheiden, was wir essen", gameSub:"Schluss mit der Unentschlossenheit! Wähle eines von beiden",
  gameTarotName:"Tarot des heutigen Menüs", gameTarotDesc:"Zieh eine Karte und enthülle dein Restaurant-Schicksal",
  gameRouletteName:"Menü-Roulette", gameRouletteDesc:"Gib ein, worauf du Lust hast, und lass das Roulette entscheiden",
  gameBack:"← Anderes Spiel wählen",
  tarotTitle:"Tarot des heutigen Menüs", tarotSub:"{n} Karten ziehen vorbei. Tippe, um dein heutiges Essen zu ziehen",
  tarotRedraw:"Erneut ziehen",
  rouletteTitle:"Menü-Roulette", rouletteSub:"Füge 2 oder mehr Gerichte hinzu, auf die du Lust hast, und dreh dann",
  roulettePh:"z. B. Gukbap, Pizza, Malatang", rouletteAdd:"Hinzufügen",
  rouletteEmpty:"Füge ein paar Gerichte hinzu", rouletteMin:"Füge 2 oder mehr Gerichte hinzu",
  rouletteReady:"{n} Optionen zur Auswahl", rouletteSpin:"🎡 Drehen", rouletteRespin:"🎡 Noch mal drehen", rouletteSlotLabel:"Anzahl der Felder",
  authIntentSave:"Um Orte zu speichern, die du besuchen möchtest, werde zuerst eines unserer Enkelkinder!",
  authIntentMypage:"Du musst dich registrieren, um Meine Seite zu nutzen.",
  authIntentReview:"Bitte registriere dich zuerst, um eine Bewertung zu hinterlassen.",
  authIntentPass:"Essensgutscheine werden in deinem Konto gespeichert, bitte registriere dich zuerst.",
  authIntentLogin:"Willkommen zurück! Bitte melde dich in deinem Konto an.",
  authTitle:"Werde eines unserer Enkelkinder", authTabSignup:"Registrieren", authTabLogin:"Anmelden",
  authNameLabel:"Name", authNamePh:"Wie sollen wir dich nennen?",
  authIdLabel:"E-Mail", authIdPh:"beispiel@mail.com",
  authPwLabel:"Passwort", authPwPh:"Passwort",
  authPw2Label:"Passwort bestätigen", authPw2Ph:"Gib dein Passwort erneut ein",
  authSubmitSignup:"Registrieren und loslegen", authSubmitLogin:"Anmelden",
  authErrFormat:"Bitte gib eine gültige E-Mail-Adresse ein.",
  authErrPwMismatch:"Die Passwörter stimmen nicht überein. Bitte überprüfe sie noch einmal.",
  authErrDupe:'Dieses Konto existiert bereits. Bitte melde dich über den Tab „Anmelden“ an.',
  authErrNotFound:'Kein Konto gefunden. Bitte registriere dich zuerst über den Tab „Registrieren“.',
  authErrPwShort:"Das Passwort muss mindestens 6 Zeichen lang sein.",
  mypageResetSaved:"Möchte-ich-besuchen-Liste leeren", mypageResetVisited:"Besuchsliste leeren", mypageResetPass:"Gutschein-Reservierungen leeren",
  resetSavedTitle:"Möchte-ich-besuchen-Liste leeren", resetSavedBody:"Damit werden alle gespeicherten Orte gelöscht. Deine Besuchsliste und Gutschein-Reservierungen bleiben erhalten.",
  resetVisitedTitle:"Besuchsliste leeren", resetVisitedBody:"Damit werden alle Besuchsmarkierungen gelöscht. Deine gespeicherte Liste und deine Bewertungen bleiben erhalten.",
  resetPassTitle:"Gutschein-Reservierungen leeren", resetPassBody:"Damit werden alle Gutschein-Reservierungen gelöscht. Deine gespeicherte Liste und Besuchsliste bleiben erhalten.",
  authErrPwEmpty:"Bitte gib dein Passwort ein.",
  authErrNameEmpty:"Bitte sag uns, wie wir dich nennen sollen.",
  authErrNotConfirmed:"Deine E-Mail ist noch nicht bestätigt. Bitte überprüfe dein Postfach.",
  authErrNeedConfirm:"Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte bestätige sie und melde dich dann an.",
  authErrRate:"Zu viele Anfragen. Bitte versuch es gleich noch einmal.",
  authErrNetwork:"Verbindung fehlgeschlagen. Bitte versuch es gleich noch einmal.",
  authErrOffline:"Der Anmeldeserver ist gerade nicht erreichbar. Bitte versuch es gleich noch einmal.",
  authErrGeneric:"Etwas ist schiefgelaufen. Bitte versuch es gleich noch einmal.",
  authErrWrongPw:"Falsches Passwort.",
  authWelcomeTitle:"Willkommen, {name}!", authWelcomeBody:"Registrierung abgeschlossen. Wir informieren dich zuerst, wenn wir offiziell starten.",
  authWelcomeBodyLogin:"Willkommen zurück! Schön, dich wiederzusehen.",
  authWelcomeMypageBtn:"Zu Meiner Seite",
  headerAuthSavedLabel:"Meine gespeicherten Orte", headerAuthMypageTitle:"{name}s Meine Seite",
  logoutTitle:"Abmelden?", logoutBody:"Nach dem Abmelden musst du dich erneut anmelden, um gespeicherte Listen zu nutzen, Bewertungen zu schreiben und mehr.",
  logoutOk:"Abmelden", logoutCancel:"Abbrechen",
  mypageTitle:"{name}s Meine Seite", mypageTitleGeneric:"Meine Seite",
  mypageTabSaved:"Möchte ich besuchen", mypageTabVisited:"Besucht", mypageTabPass:"Essensgutscheine",
  allergyTitle:"🥜 Allergie-Einstellungen", allergySub:"Wir warnen dich, bevor du einen Ort öffnest, der deine Auswahl verwenden könnte.",
  allergyWarnTitle:"Vor dem Betreten beachten", allergyWarnBody:"Dieser Ort könnte Gerichte mit {list} servieren. Bitte frag den Wirt vor der Bestellung.",
  allergyWarnOk:"Verstanden, weiter",
  allergen_shellfish:"Schalentiere", allergen_fish:"Fisch & Meeresfrüchte", allergen_milk:"Milch", allergen_wheat:"Weizen & Gluten",
  allergen_nuts:"Nüsse", allergen_pork:"Schweinefleisch", allergen_beef:"Rindfleisch", allergen_egg:"Ei",
  mypageResetLink:"Meine gesamte Aktivität zurücksetzen", mypageLogoutBtn:"Abmelden",
  mypageEmptySaved:"Noch keine gespeicherten Restaurants.", mypageEmptyVisited:"Noch keine Besuchseinträge.",
  mypageEmptyPass:"Noch keine Essensgutscheine reserviert.<br>Wähle im Bereich Enkel-Essensgutschein ein Restaurant, das dir gefällt.",
  mypageRemoveSavedTitle:"Aus „Möchte ich besuchen“ entfernen", mypageRemoveVisitedTitle:"Besuchseintrag stornieren",
  mypageConfirmUnvisit:"Diesen Besuchseintrag stornieren?",
  mypageCancelPassTitle:"Reservierung stornieren", mypageConfirmCancelPass:"Diese Essensgutschein-Reservierung stornieren?", mypageCancelPassOk:"Reservierung stornieren",
  resetTitle:"Meine Aktivität zurücksetzen", resetBody:"Damit werden deine gespeicherten Orte, Besuchseinträge, deine Bewertungen und Essensgutschein-Reservierungen gelöscht. Das kann nicht rückgängig gemacht werden.",
  resetOk:"Zurücksetzen", resetCancel:"Abbrechen",
  reviewFormTitle:"Schreib auch du eine Bewertung", reviewFormSub:"Teile eine ehrliche Bewertung eines Restaurants, das du besucht hast.",
  reviewFormNoVisitTitle:"Du kannst noch keine Bewertung schreiben", reviewFormNoVisitBody:"Du kannst nur Restaurants bewerten, die du als besucht markiert hast.",
  reviewFormNoVisitOk:"Restaurants durchsuchen",
  reviewRatingLabel:"Bewertung", reviewPlaceLabel:"Besuchtes Restaurant",
  reviewVisibilityLabel:"Anzeigen als", reviewVisibilityReal:"Echter Name ({name})", reviewVisibilityAnon:"Anonym",
  reviewPhotoLabel:"Foto anhängen", reviewOptional:"Optional",
  visitVerifyTitle:"Bestätige deinen Besuch",
  visitVerifySub:"Warst du wirklich bei {name}? Lade einen Kassenbon oder ein Foto des Ladenschilds hoch.",
  visitVerifyNote:"Du kannst nur Orte bewerten, an denen du wirklich warst. Das Foto wird nur zur Prüfung verwendet und nicht gespeichert.",
  visitVerifyPhotoLabel:"Kassenbon oder Foto der Fassade",
  visitVerifySubmit:"Bestätigen", visitVerifyChecking:"Wird geprüft...",
  visitVerifyPreviewAlt:"Vorschau des hochgeladenen Fotos",
  visitVerifyErrNoPhoto:"Bitte lade zuerst ein Foto hoch.",
  visitVerifyErrRead:"Wir konnten dieses Foto nicht lesen. Bitte versuch es mit einem anderen.",
  visitVerifyErrServer:"Die Bestätigung ist gerade nicht verfügbar. Bitte versuch es gleich noch einmal.",
  visitVerifyFailKind:"Das sieht nicht wie ein Kassenbon oder ein Foto des Ladenschilds aus.",
  visitVerifyFailName:"Wir konnten den Namen dieses Restaurants auf dem Foto nicht finden.",
  reviewContentLabel:"Bewertung", reviewContentPh:"Was hat dir hier gefallen?",
  reviewSubmitBtn:"Bewertung veröffentlichen", reviewErrEmpty:"Bitte schreib deine Bewertung.",
  reviewSuccessTitle:"Deine Bewertung wurde veröffentlicht!",
  reviewSuccessBodyOk:"Danke fürs Teilen! Sie ist jetzt in der Bewertungsliste sichtbar.",
  reviewSuccessBodyFail:"Zur Bewertungsliste hinzugefügt. Das Foto war jedoch zu groß zum Speichern — es könnte beim Neuladen verschwinden.",
  anonReviewerName:"Anonymes Enkelkind", namedReviewerSuffix:" (Enkelkind)", defaultReviewerName:"Ein Enkelkind",
  introSub:"Entdeckung lokaler Restaurants in Jochiwon-eup",
  introVision:"Echte Nachbarschaftsrestaurants finden, die auf Karten fehlen oder schlecht gelistet sind, und ein lokales Gewerbe-Ökosystem aufbauen, in dem Kund:innen und Wirte gemeinsam gedeihen",
  introOverviewHead:"Projektübersicht",
  introOverviewBody:'„KU-jodae! Helft den lokalen Wirten“ — ein von Studierenden geleiteter Service, der als Sozialprojekt am Sejong-Campus der Korea University begann. Studierende und Anwohner:innen finden und stellen persönlich lokale Restaurants in Jochiwon-eup vor, die auf Naver/Kakao Map fehlen oder kaum gelistet sind.',
  introMakerHead:"Wer das gemacht hat",
  introMakerBody:"Ein Sozialprojekt, geplant und aufgebaut von Matjip KU-jodae, einem Studententeam für Wirtschaftspolitik am Sejong-Campus der Korea University.",
  introProgressHead:"Fortschritt",
  introProgressBody:"Wir befinden uns aktuell in der Vorstartphase mit früher Anmeldung. Wir planen, den vollständigen Service zu starten, sobald echte Restaurantdaten durch eine Feldrecherche nach dem Semesterbeginn im September vorliegen.",
  introFaqBtn:"Häufig gestellte Fragen",
  faqTitle:"Kontakt", faqSub:"Schau zuerst in den FAQ für eine schnelle Antwort.",
  faqQ1:"Was ist Bap Meokeoreo Wa?",
  faqA1:'Es ist ein Service des Projekts „KU-jodae! Helft den lokalen Wirten“. Studierende und Anwohner:innen finden und stellen persönlich lokale Restaurants in Jochiwon-eup vor, die auf Online-Karten wie Naver/Kakao Map fehlen oder kaum gelistet sind.',
  faqQ2:"Ist das vor dem offiziellen Start?",
  faqA2:"Ja, wir nehmen aktuell in einer Vorbereitungsphase frühe Anmeldungen entgegen und planen, den vollständigen Service mit echten Restaurantdaten nach dem Semesterbeginn im September zu starten.",
  faqQ3:"Kann mein Restaurant auch gelistet werden?",
  faqA3:'Ja! Wir bereiten eine Registrierungsseite für Wirte vor. Sobald sie verfügbar ist, führen wir dich über den Button „Bist du Restaurantbesitzer:in?“ durch den Prozess.',
  faqQ4:"Kann jede:r eine Bewertung schreiben?",
  faqA4:"Nur angemeldete Mitglieder können eine Bewertung schreiben, und nur für Restaurants, die sie als besucht markiert haben — eine minimale Absicherung gegen gefälschte Bewertungen.",
  faqQ5:"Wie werden meine persönlichen Daten verwendet?",
  faqA5:"Sie werden nur für die in unserer Datenschutzerklärung genannten Zwecke verwendet (Mitgliederidentifikation, Bereitstellung des Service) und gemäß den geltenden Gesetzen sicher verwaltet.",
  faqQ6:"Ich möchte mich ehrenamtlich engagieren oder als Teammitglied mitmachen.",
  faqA6:'Hinterlasse eine Anfrage über das Menü „Hilf uns“, und wir führen dich durch die nächsten Schritte.',
  faqFootPrefix:"Deine Antwort nicht gefunden? Wende dich über ", faqFootBold:"Hilf uns", faqFootSuffix:" an uns.",
  faqContactBtn:"Anfrage senden",
  supportTitle:"Hilf uns", supportSub:"Wir warten auf helfende Hände für dieses Projekt.",
  supportTeamTitle:"Ich möchte als Teammitglied mitmachen", supportTeamDesc:"Von Feldrecherche bis Planung und Entwicklung — es gibt einen Platz für dich.",
  supportSponsorTitle:"Ich möchte dieses Projekt unterstützen", supportSponsorDesc:"Hilf mit, ein nicht gewinnorientiertes Projekt zu ermöglichen.",
  contactNameLabel:"Name", contactNamePh:"Name oder Spitzname",
  contactReachLabel:"Kontakt / E-Mail", contactReachPh:"E-Mail oder Telefonnummer, unter der wir dich erreichen",
  contactMessageOptional:"Optional", contactSubmitBtn:"Anfrage senden",
  contactErrName:"Bitte gib deinen Namen ein.", contactErrReach:"Bitte gib eine gültige E-Mail-Adresse oder Telefonnummer ein.",
  contactBack:"Zurück", contactSuccessTitle:"Deine Anfrage ist eingegangen!",
  contactSuccessBody:"Danke, {name}. Wir melden uns über die von dir angegebenen Kontaktdaten.<br>({type})",
  ct_team_title:"Ich möchte als Teammitglied mitmachen", ct_team_sub:"Wir warten auf Teammitglieder, die uns beim Aufbau helfen.",
  ct_team_note:"Planung, Entwicklung, Design, Feldrecherche — jede Rolle ist willkommen. Wir melden uns über die von dir hinterlassenen Kontaktdaten.",
  ct_team_field:"Bereich, in dem du helfen möchtest",
  ct_team_opt1:"Feldrecherche (Restaurants finden)", ct_team_opt2:"Planung / Betrieb", ct_team_opt3:"Design", ct_team_opt4:"Entwicklung", ct_team_opt5:"Marketing / Inhalte", ct_team_opt6:"Noch unsicher",
  ct_team_msgLabel:"Möchtest du noch etwas mitteilen", ct_team_msgPh:"Erzähl uns gern, warum du mitmachen möchtest oder wann du Zeit hast.",
  ct_sponsor_title:"Ich möchte dieses Projekt unterstützen", ct_sponsor_sub:"Jede Unterstützung hilft uns, ein weiteres lokales Restaurant zu finden.",
  ct_sponsor_note:"Dieses Projekt läuft aktuell nicht gewinnorientiert, daher werden Spenden nur für Feldrecherche und Betriebskosten verwendet.",
  ct_sponsor_field:"Art der Unterstützung",
  ct_sponsor_opt1:"Einmalige Spende", ct_sponsor_opt2:"Regelmäßige Spende", ct_sponsor_opt3:"Sach- / Kompetenzspende", ct_sponsor_opt4:"Möchte erst mal nur fragen",
  ct_sponsor_msgLabel:"Nachricht zu deiner Unterstützung", ct_sponsor_msgPh:"Teile gern Fragen oder Gedanken zur Unterstützung mit.",
  ct_partnerStore_title:"Partnerschaftsantrag für Wirte", ct_partnerStore_sub:"Lass uns gemeinsam Essensgutscheine und Studentenvorteile vorbereiten.",
  ct_partnerStore_note:"Listung und Partnerschaftsanträge sind kostenlos. Du legst die Gutschein-Vorteile und die Gültigkeitsdauer fest; die Gebührenstruktur wird noch diskutiert.",
  ct_partnerStore_field:"Bevorzugter Vorteil",
  ct_partnerStore_opt1:"10+1-Essensgutschein", ct_partnerStore_opt2:"Studentenrabatt", ct_partnerStore_opt3:"Set-Menü-Rabatt", ct_partnerStore_opt4:"Möchte erst mal nur fragen",
  ct_partnerStore_msgLabel:"Zu deinem Restaurant / sonstiges", ct_partnerStore_msgPh:"Teile den Namen deines Restaurants, den Standort und welchen Vorteil du erwägst.",
  ct_partnerOrg_title:"Anfrage: Partnerschaft mit Studierendenrat / Club", ct_partnerOrg_sub:"Lass uns Vorteile für die Mitglieder deiner Organisation schaffen.",
  ct_partnerOrg_note:"Der Sejong-Campus der Korea University hat bereits Partnerrestaurants wie das KU-Membership-Programm. Wir möchten lokalen Restaurants, die nicht auf der Karte sind, helfen, demselben Bereich beizutreten — die Bedingungen werden noch diskutiert.",
  ct_partnerOrg_field:"Art der Organisation",
  ct_partnerOrg_opt1:"Studierendenrat", ct_partnerOrg_opt2:"Club", ct_partnerOrg_opt3:"Campus-Organisation", ct_partnerOrg_opt4:"Andere Gruppe",
  ct_partnerOrg_msgLabel:"Welche Art von Partnerschaft du dir wünschst", ct_partnerOrg_msgPh:"Teile den Namen deiner Organisation, ihre Größe und welchen Vorteil du dir wünschst.",
  ct_expand_title:"Finde auch lokale Restaurants in meiner Gegend", ct_expand_sub:"Auch außerhalb von Jochiwon, wenn dich unsere Idee anspricht.",
  ct_expand_note:"Das Erlösmodell ist noch nicht festgelegt. Wir diskutieren aktuell eine nicht gewinnorientierte Expansion und wie wir zusammenarbeiten können.",
  ct_expand_field:"Vorgeschlagene Gegend", ct_expand_fieldPh:"z. B. Dodam-dong Sejong, Sachang-dong Cheongju",
  ct_expand_msgLabel:"Dein Vorschlag", ct_expand_msgPh:"Erzähl uns von der Nachbarschaft und warum dieser Service dort helfen würde.",
  passPerUnit:"pro Gutschein", passValidDays:"Gültig für {n} Tage", passBuyBtn:"Essensgutschein reservieren",
  passSelectTitle:"{name} Essensgutschein", passHowMany:"Wie viele möchtest du?",
  passSummaryCount:"{n} Gutscheine", passSummaryBonus:"Wirtebonus +{n} Gutscheine", passSummaryTotal:"Gutscheine, die du erhältst", passSummaryAmount:"Zu zahlender Betrag",
  passNextBtn:"Weiter", passConfirmTitle:"So reservieren?", passConfirmSub:"Wir reichen eine Reservierung mit den folgenden Angaben ein.",
  passSummaryStore:"Restaurant", passSummaryBought:"Gekaufte Gutscheine", passSummaryValid:"Gültigkeitsdauer", passSummaryValidVal:"{n} Tage ab erster Nutzung",
  passPrepayNote:"Damit wird nur eine <b>Vorbestellung</b> eingereicht. Die echte Zahlung wird beim offiziellen Start freigeschaltet — in dieser Phase wird kein Geld abgebucht.",
  passSubmitBtn:"Vorbestellung senden", passBackBtn:"Zurück",
  passSuccessTitle:"Deine Reservierung ist eingegangen!",
  passSuccessBodyOk:"Wir haben {n} Gutscheine für {name} reserviert. Wir informieren dich zur Zahlung, sobald wir offiziell starten.",
  passSuccessBodyFail:"Wir haben deinen {name}-Gutschein gespeichert, aber der Speicher war voll und wir konnten ihn nicht erfassen — er könnte beim Neuladen verschwinden.",
  passSeeMyPasses:"Meine Essensgutscheine ansehen",
  passInfoTitle:'Enkel-Essensgutschein<span class="badge-live">Reservierung möglich</span>',
  passInfoBody:"Lade im Voraus einen Essensgutschein für ein Restaurant auf, das dir gefällt. Erhalte je nach Angebot des Wirts zusätzliche Gutscheine und nutze bei jedem Besuch einen davon.",
  passBenefit1Title:"10 kaufen, 1 gratis", passBenefit1Body:"Kaufe im Großhandel und erhalte zusätzliche, vom Wirt festgelegte Gutscheine. Die Vorteile variieren je nach Restaurant.",
  passBenefit2Title:"Mahlzeiten im Voraus bezahlen", passBenefit2Body:"Zahle im Voraus statt Mahlzeit für Mahlzeit und entlaste deinen Geldbeutel.",
  passBenefit3Title:"Wirte gewinnen Stammgäste", passBenefit3Body:"Restaurants erhalten Einnahmen im Voraus und gewinnen Stammgäste — ein Gewinn für beide Seiten.",
  passListTitle:"Restaurants, die Essensgutscheine vorbereiten",
  passMoreNote:"Weitere Restaurants öffnen nach und nach Gutscheine, nachdem sie während der Feldrecherche im September mit den Wirten gesprochen haben.",
  passPartnerTitle:"Wir bereiten auch Partnerschaften vor",
  passPartnerBody:"Der Sejong-Campus der Korea University hat bereits Partnerrestaurants wie das KU-Membership-Programm. Wir glauben, dass lokale Restaurants, die nicht auf der Karte sind, demselben Bereich beitreten können, sobald sie entdeckt werden.",
  passPartnerStoreBtn:"Partnerschaftsantrag für Wirte", passPartnerOrgBtn:"Anfrage: Partnerschaft mit Studierendenrat / Club",
  passNotice:"<strong>Zahlung ist noch nicht möglich.</strong> Dies ist aktuell eine nicht gewinnorientierte Vorbereitungsphase, daher akzeptieren Essensgutscheine nur <b>Vorbestellungen</b> — die echte Zahlungsintegration wird später offiziell starten. Vorteile und Gültigkeitsdauer werden vom Wirt festgelegt.",
  join4Title:"Tritt unserer Community bei", join4Body:"Der Echtzeit-Austausch findet in unserer externen Social-Media-Gruppe statt.",
  communityTitle:"Tritt unserer Community bei",
  communityBody:"Der Echtzeit-Austausch findet in einer externen Social-Media-Gruppe wie KakaoTalk oder Instagram statt. Diese Seite bietet nur den Beitrittslink und den QR-Code.",
  communityJoinBtn:"Der Gruppe beitreten",
  communityQrReady:"Scanne den QR-Code unten oder tippe auf den Button, um beizutreten.",
  communityQrSoon:"Die Gruppe wurde noch nicht erstellt. Sobald sie eröffnet ist, erscheint hier ein QR-Code.",
  grandchildDefaultName:"Enkelkind", mealPassWord:"Essensgutschein", ownerBonusLabel:"Wirtebonus",
  mypagePassBonusWord:"Bonus", mypagePassDateLine:"Reserviert am {date}", reviewCharUnit:"",
}, ja: {
  pageTitle:"Bap Meokeoreo Wa — チョチウォンの地元グルメを発見",
  navSearch:"検索", navGame:"メニュールーレットゲーム", navSurvey:"好み診断", navLang:"言語", navTheme:"ライト/ダークモード切替", navLogin:"ログイン",
  mapFilterAria:"地図表示タイプ", mapFilterAll:"すべて", mapFilterFood:"飲食店", mapFilterCafe:"カフェ",
  navMenuAria:"主要セクション", navMenuEat:"グルメ", navMenuMap:"地図", navMenuAbout:"サービス紹介", navMenuJoin:"参加する",
  navLogout:"ログアウト",
  headerSearchPh:"店舗・食事券・提携・ページを検索",
  heroEyebrow:"KU助隊！オーナーさんを助けよう",
  heroTitle:'Naverでは見つからない、または情報がほとんどない名店があるって知ってた？<span>これで、もう知ってるね。</span>',
  heroBody:'高麗大学世宗キャンパスの学生チーム<b>マッチプKU助隊</b>が、チョチウォン邑の路地裏を歩いて名店を探しています。Naver/Kakaoマップに全く登録されていない、または情報がほとんどない本物の地元グルメを見つけることから始めています。高麗大学・弘益大学世宗キャンパスの学生や近隣住民がともに楽しめる、コスパの良い地元グルメを発見しよう。',
  heroBrowse:"グルメを見る", heroNotify:"リリース通知を受け取る",
  heroQuickpick:"優柔不断レスキュー · 3秒で選んであげる", heroSpeech:"一緒にごはん食べよう！",
  problemEyebrow:"なぜBap Meokeoreo Waなのか", problemTitle:"地図アプリだけ信じていると、おいしいお店を見逃してしまう",
  problemSub:"高麗大学・弘益大学世宗キャンパスの学生、交換留学生、教職員、近隣住民にとって、よくある話です。",
  problem1Title:"地図に載っていない、または情報がほとんどない",
  problem1Body:"昔からある地元の名店は、Naver/Kakaoマップに全く登録されていなかったり、写真が一枚もない状態で登録されていたりして、検索しても出てこないことが多いです。",
  problem2Title:"いつも同じ学食",
  problem2Body:"近くにコスパが良くておいしい地元のお店があっても、見つける方法がないので、いつも同じ選択を繰り返してしまいます。",
  problem3Title:"お互いに助け合う必要があります",
  problem3Body:"お客さんは隠れた名店を発見でき、オーナーさんはより多くの認知度と売上を得られる——地域全体が一緒に成長できる仕組みです。",
  discoverEyebrow:"近日公開", discoverTitle:"新学期が始まったら、地元のオーナーさんを直接訪ねます",
  discoverBody:"地図に全く登録されていない、または情報がほとんどない本物の地元グルメ——学生チームが9月の新学期開始後にチョチウォン邑の路地裏を歩き、オーナーさんに会って、ここで一軒ずつ紹介していきます。下の🌐バッジが付いた店舗は、Googleレビューのリアルタイム連携がどんな感じかのプレビューです。実際に私たちが発掘し、応援している地元グルメのリストは、まもなくここに追加されていきます。",
  discoverStep1:"チョチウォン邑路地裏の現地調査（9月の新学期開始後）",
  discoverStep2:"情報の少ない地元オーナーさんを見つけて情報を補完",
  discoverStep3:"本物の地元グルメとして、ここで一軒ずつ公開",
  discoverBtn:"近くの地元グルメを教えてください",
  mapEyebrow:"地図", mapTitle:"チョチウォン ミニマップ",
  mapBody:"実際に確認済みの店舗の位置です。ピンをタップすると詳細が見られます。残りの店舗も9月の現地調査後、順次追加されます。",
  mapCampusLabel:"🏫 高麗大学世宗キャンパス",
  mapAuthFail:"地図を読み込めませんでした。",
  eatLocalEyebrow:"地元グルメ", eatLocalTitle:"今日は何食べる？",
  realGridTitle:"📍 確認済みの実在店舗 · Googleレビュー連携",
  realGridSub:"Kakao/Googleに実際に登録されている店舗です。クリックするとリアルタイムの評価とレビューがすぐに見られます。",
  liveSearchPh:"見つからないお店がある？店名を入力してリアルタイムで周辺検索",
  liveSearchBtn:"検索",
  catAll:"すべて", catKorean:"韓食", catWestern:"洋食", catChinese:"中華", catJapanese:"和食", catSnack:"軽食", catCafe:"カフェ",
  descVarCafe0:"チョチウォン邑の路地裏にある雰囲気の良いカフェ",
  descVarCafe1:"さっと一杯飲んで帰れる路地裏のカフェ",
  descVarCafe2:"授業の合間に立ち寄りやすい路地裏カフェ",
  descVarCafe3:"チョチウォン邑の路地裏で、腰を落ち着けられるカフェ",
  descVarCafe4:"もう一杯飲んでいきたくなるチョチウォン邑路地裏のカフェ",
  descVarKorean0:"チョチウォン邑路地裏の、力が湧く韓食堂",
  descVarKorean1:"チョチウォン邑路地裏でしっかり食べられる一食",
  descVarKorean2:"「今日何食べよう」と迷った時に行く路地裏の韓食堂",
  descVarKorean3:"チョチウォン邑路地裏、家庭の味が恋しい時に",
  descVarWestern0:"チョチウォン邑路地裏の、こぢんまりした洋食店",
  descVarWestern1:"チョチウォン邑路地裏でナイフとフォークでいただく一食",
  descVarWestern2:"チョチウォン邑路地裏、ちょっと特別な日の洋食店",
  descVarChinese0:"チョチウォン邑路地裏の、鍋の香ばしさが自慢の中華料理店",
  descVarChinese1:"チョチウォン邑路地裏の一杯の中華料理",
  descVarChinese2:"ジャージャー麺かチャンポンか迷ってしまう路地裏の中華店",
  descVarJapanese0:"チョチウォン邑路地裏の、静かな和食店",
  descVarJapanese1:"チョチウォン邑路地裏の一杯の和食",
  descVarJapanese2:"ズルズルっと食べきってしまうチョチウォン邑路地裏の和食店",
  descVarSnack0:"チョチウォン邑路地裏の、懐かしさあふれる粉食店",
  descVarSnack1:"路地裏で軽くお腹を満たせる粉食店",
  descVarSnack2:"トッポギが食べたくなった時のチョチウォン邑路地裏の店",
  // 가게 이름 다국어 — restaurants[]에서 이전(rName()이 조회). id 순서 = restaurants[] 순서.
  "name_jochiwon-halmae-gukbap":"チョチウォンおばあちゃんクッパ (조치원 할매국밥)",
  "name_yeokjeon-wang-donkatsu":"駅前キング豚カツ (역전 왕돈까스)",
  "name_an-chef-jjambbong":"アンシェフ肉海鮮チャンポン (안쉐프고기해물짬뽕)",
  "name_jagal-dondon":"チャガルトンドン (자갈돈돈)",
  "name_wooridul-sikdang":"ウリドゥル食堂 (우리들식당)",
  "name_paul-barna":"ポール・バルナ (폴바나)",
  "name_donseu":"ドンス (돈스)",
  "name_the-ramen":"ザ・ラーメン (더라멘)",
  "name_sushi-power-plant-12g":"寿司発電所12g (초밥발전소12g)",
  "name_halmoni-tteokbokki":"おばあちゃんのトッポギ (할머니 떡볶이)",
  "name_parangsae-bunsik":"青い鳥粉食 (파랑새분식)",
  "name_sookine-bapsang":"スギネご飯膳 (숙이네밥상)",
  "name_seochangri-181":"ソチャンリ181 (서창리181)",
  "name_sammat-cafe":"サンマッカフェ (삼맛카페)",
  "name_vanilla-garden":"バニラガーデン (바닐라가든)",
  "name_dankong":"タンコン (단콩)",
  "name_paul-and-banabas":"ポール＆バルナバス (폴앤바나바스)",
  "name_cafe-sujak":"カフェスジャク (카페수작)",
  "name_cafe-calendar":"カフェカレンダー (카페캘린더)",
  "name_hong-cafe":"ホンカフェ (홍카페)",
  "name_matna-sikdang-bunsik":"マンナ食堂粉食 (맛나식당분식)",
  "name_imone-dwaeji-gukbap":"イモネ豚クッパ (이모네돼지국밥)",
  "name_bundang-ilpum-guksu":"パンダン一品麺 (분당일품국수)",
  "name_urban-lounge":"アーバンラウンジ (어반라운지)",
  "name_gyodong-jjambbong":"キョドンチャンポン (교동짬뽕)",
  "name_naive":"ナイーブ (나이브)",
  "name_yuram-coffee-roasters":"ユラムコーヒーロースターズ (유람 커피로스터스)",
  "name_daily-point":"デイリーポイント (딜리포인트)",
  "name_hunminjeongeum":"訓民正音 (훈민정음)",
  "name_siot":"シオッ (시옷)",
  "name_vib":"ヴァイブ (비브)",
  "name_neomeo":"ノモ (너머)",
  "name_chas":"チャス (차스)",
  "name_second-road":"セカンドロード (세컨로드)",
  "name_merry-go-round":"メリーゴーラウンド (메리고라운드)",
  "name_roastery-cafe-in":"ロースタリーカフェIN (로스터리 카페IN)",
  "name_defense":"ディフェンス (디펜스)",
  // 가게 설명 다국어 — descVariant()에 안 걸리는 가게만(rDesc()가 조회).
  "desc_jochiwon-halmae-gukbap":"40年の伝統と濃厚なスープが自慢の有名クッパ店",
  "desc_yeokjeon-wang-donkatsu":"厚切りの手作り豚カツ、ボリューム満点",
  "desc_an-chef-jjambbong":"肉と海鮮を一緒に楽しめる辛口チャンポン店",
  "desc_jagal-dondon":"チョチウォン邑路地裏の焼肉店",
  "desc_wooridul-sikdang":"チョチウォン邑路地裏の家庭料理定食店",
  "desc_donseu":"チョチウォン邑路地裏の豚カツ・うどん店",
  "desc_the-ramen":"チョチウォン邑路地裏のラーメン店",
  "desc_sushi-power-plant-12g":"チョチウォン邑路地裏の寿司・巻き寿司専門店",
  "desc_halmoni-tteokbokki":"甘辛い昔ながらのトッポギ、学生に大人気のおやつ",
  "desc_sookine-bapsang":"チョチウォン邑路地裏の家庭料理定食店",
  pagerAria:"店舗リストのページ", pagerPrev:"前のページ", pagerNext:"次のページ",
  sortRecommend:"おすすめ順", sortName:"名前順（A-Z）", sortRating:"評価が高い順", sortReviews:"レビューが多い順", sortLatest:"新着順", sortDistance:"近い順",
  priceMin:"最低", priceMax:"最高", priceWon:"ウォン",
  filterEmpty:"この条件に合うお店はまだありません。",
  filterEmptySub:"こちらはいかがですか？", filterReset:"フィルターをリセットしてすべて表示",
  filterEmptyKorean:"🍚 韓食", filterEmptyJapanese:"🍜 和食", filterEmptyWestern:"🍝 洋食",
  exampleGridTitle:"🔎 サンプル店舗（現地調査待ち）",
  exampleGridSub:'現地調査が完了するまでの仮の情報です。ハートをタップすると「行きたい場所」に保存できます。',
  loadMore:'もっと見る <span class="badge-soon">9月オープン予定</span>',
  reviewEyebrow:"レビュー", reviewTitle:"実際に行った人たちのストーリー",
  reviewSearchPh:"レビューを検索（店名・キーワード）",
  reviewWriteBtn:"あなたもレビューを書く",
  reviewSoon:"<strong>レビューデータは近日公開</strong> — 9月の新学期開始後、実際の来店レビューが集まり次第、AIレビュー要約機能もリリースされます。",
  surveyTitle:"あなたの好みを教えてください", surveyBody:"辛さのレベル、好きなジャンル、予算について簡単なアンケートに答えて、あなたにぴったりのお店を見つけましょう。", surveyBtn:"好み診断を始める",
  shareEyebrow:"シェア", shareTitle:"学校の友達にも教えてあげよう",
  shareBody:'隠れた名店は、シェアするほどもっと良くなります。「Bap Meokeoreo Wa」を友達におすすめしよう。',
  shareKakao:"KakaoTalkでシェア", shareCopy:"リンクをコピー", shareText:"メッセージでシェア", shareInsta:"Instagramでシェア",
  joinEyebrow:"一緒に", joinTitle:"一緒に作っていきましょう",
  joinBody:"オーナーさんのために、私たちのために、地域のために——このプロジェクトに参加したいすべての人のための場所を用意しました。",
  join1Title:'あなたはお店のオーナーさんですか？<span class="badge-soon">9月オープン予定</span>',
  join1Body:"自分のお店を紹介してほしいチョチウォンの地元オーナーさんのための登録窓口です。",
  join2Title:"力を貸してください", join2Body:"企画・開発・デザイン・現地調査で一緒に活動してくれる仲間を探しています。",
  join3Title:"あなたの地域のお店についても教えてください", join3Body:"チョチウォン以外でも、私たちの活動に共感していただけたら、いつでもご連絡ください。",
  signupTitle:"誰よりも早くお知らせします", signupBody:"ベータ版のリリース時や新しいお店が追加された時、真っ先にメールでお知らせします。",
  signupEmailPh:"メールアドレスを入力", signupBtn:"事前登録する",
  signupErrEmail:"メールアドレスの形式が少しおかしいようです！💌",
  signupMsg:"登録完了！リリース時には真っ先にお知らせします 🌾",
  footerAbout:'「KU助隊！オーナーさんを助けよう」——高麗大学世宗キャンパスの学生チーム、マッチプKU助隊による社会貢献プロジェクトです。地域商圏とともに成長することを目指しています。',
  footerServiceHead:"サービス", footerMapLink:"地図を見る", footerPassLink:'孫の食事券<span class="badge-live">予約受付中</span>', footerSponsorLink:"応援する",
  footerInfoHead:"情報", footerIntroLink:"サービス紹介", footerFaqLink:"お問い合わせ", footerSignupLink:"リリース通知登録",
  footerAdminHead:"管理者", footerAnalyticsLink:"利用統計", footerOwnerLink:"オーナーページ",
  adminGateTitle:"管理者確認", adminGateBody:"利用統計ページに移動します。パスワードを入力してください。",
  adminGateOk:"確認", adminGateWrong:"パスワードが一致しません。",
  footerLegalHead:"法的情報", footerPrivacyLink:"プライバシーポリシー", footerTermsLink:"利用規約",
  footerOperator:"<b>運営</b> 高麗大学世宗キャンパス学生チーム マッチプKU助隊",
  footerProject:"<b>プロジェクト名</b> KU助隊！オーナーさんを助けよう",
  footerServiceName:"<b>サービス名</b> Bap Meokeoreo Wa",
  footerEmail:"<b>お問い合わせメール</b>（後日公開予定）",
  footerOfficer:"<b>個人情報保護責任者</b>（後日公開予定）",
  footerBottom:"© 2026 Bap Meokeoreo Wa · KU助隊！オーナーさんを助けよう。マッチプKU助隊（高麗大学世宗キャンパス）。",
  a11yToggle:"🔍 文字拡大モード",
  confirmOk:"OK", confirmNo:"いいえ",
  cardReviewPending:"🔎 リアルタイムレビュー準備中", cardVisitBadge:"✔ 訪問済み", cardLiveBadge:"🌐 Googleレビュー連携", cardMockTag:"サンプルデータ",
  cardVisitedLabel:"✔ 訪問記録あり", cardMarkVisited:"訪問済みにする", cardWantToVisit:"行きたい場所に追加",
  filterCountTemplate:"{n}件のお店",
  detailAddress:"📍 住所", detailHours:"🕐 営業時間", detailClosed:"🚫 定休日", detailPhone:"☎️ 電話番号", detailReservation:"📅 予約",
  copyAddressBtn:"住所をコピー", copyPhoneBtn:"電話番号をコピー",
  copyOkTitle:"コピーしました", copyOkBody:"クリップボードにコピーされました。必要な場所に貼り付けてください。",
  copyFailTitle:"コピーできませんでした", copyFailBody:"ブラウザによってコピーがブロックされました。テキストを選択して手動でコピーしてください。",
  detailCapacity:"🪑 収容人数", detailParking:"🚗 駐車場", detailMobilePay:"📱 モバイル決済", detailVouchers:"🎟️ 商品券・チケット",
  detailMenuTitle:"メニュー", detailOrigin:"産地：", detailExampleNote:"※これはサンプル情報です。実際の詳細は現地調査後に追加されます。",
  detailStubTitle:"詳細情報は近日公開", detailStubBody:"は9月の現地調査後に追加されます。チョチウォンおばあちゃんクッパのカードで、どんな情報が入るかプレビューできます。",
  detailStubBodyFull:"住所、営業時間、メニュー構成、食材の産地",
  detailStubBodyPartial:"営業時間、メニュー構成、食材の産地",
  closeBtn:"閉じる",
  googleReviewTitle:"Googleレビュー", googleReviewLoading:"レビューを読み込み中...", googleReviewError:"レビューを読み込めませんでした。しばらくしてから再度お試しください。",
  aiSummaryTitle:"AIレビュー要約", aiSummaryLoading:"🤖 レビューを要約中...",
  detailMapFocus:"🗺️ 地図で見る",
  detailNoLocationNote:"🧭 これはサンプルデータで実際の位置情報がまだないため、地図には表示できません。",
  googleReviewNotFound:"😢 Googleマップでこのお店が見つかりませんでした。", googleReviewNone:"まだレビューがありません。",
  googleReviewLink:"Googleマップですべてのレビューを見る →", googleReviewAnon:"匿名",
  liveSearchLoading:"検索中...", liveSearchEmpty:"結果が見つかりませんでした。", liveSearchError:"検索に失敗しました。しばらくしてから再度お試しください。",
  searchNoResultsFor:"「{q}」の検索結果はありません。", searchDidYouMean:"もしかして？",
  searchCheckSpelling:"検索キーワードのスペルをご確認ください。", searchMaybeThisShop:"こちらのお店ではありませんか？",
  confirmLoginTitle:"ログインが必要です", confirmLoginBody:"この機能を使うにはログインが必要です。ログインして自分だけのお店リストを作りましょう！", confirmLoginOk:"ログイン", confirmLoginCancel:"閉じる",
  discardTitle:"途中で終了しますか？", discardBody:"ここまで選んだ内容は保存されません。",
  discardOk:"終了する", discardCancel:"続ける",
  confirmUnsave:"「行きたい場所」から削除しますか？", confirmUnsaveVisited:"「行きたい場所」から削除しますか？このお店の訪問記録も一緒に削除されます。", confirmSave:"このお店を「行きたい場所」に追加しますか？", confirmVisited:"このお店を訪問済みにしますか？",
  surveyPrev:"戻る", surveyNext:"次へ", surveyResult:"結果を見る",
  surveyResultTitle:"こちらはいかがですか？", surveyResultSub:"あなたの好みに合わせて選んだ地元グルメ",
  gameTitle:"ゲーム感覚で何を食べるか決めよう", gameSub:"もう迷わない！2択から選ぶだけ",
  gameTarotName:"今日のメニュータロット", gameTarotDesc:"カードを引いて今日の運命のお店を見つけよう",
  gameRouletteName:"メニュールーレット", gameRouletteDesc:"食べたいものを入力してルーレットに決めてもらおう",
  gameBack:"← 別のゲームを選ぶ",
  tarotTitle:"今日のメニュータロット", tarotSub:"{n}枚のカードが流れています。タップして今日の一食を引きましょう",
  tarotRedraw:"もう一度引く",
  rouletteTitle:"メニュールーレット", rouletteSub:"食べたいものを2つ以上追加してから回してください",
  roulettePh:"例：クッパ、ピザ、マーラータン", rouletteAdd:"追加",
  rouletteEmpty:"メニューを追加してください", rouletteMin:"メニューを2つ以上追加してください",
  rouletteReady:"{n}個の選択肢があります", rouletteSpin:"🎡 回す", rouletteRespin:"🎡 もう一度回す", rouletteSlotLabel:"コマ数",
  authIntentSave:"行きたい場所を保存するには、まず私たちの「孫」になってください！",
  authIntentMypage:"マイページを利用するには登録が必要です。",
  authIntentReview:"レビューを書くには、先に登録してください。",
  authIntentPass:"食事券はアカウントに保存されるので、先に登録してください。",
  authIntentLogin:"おかえりなさい！アカウントにログインしてください。",
  authTitle:"私たちの「孫」になろう", authTabSignup:"新規登録", authTabLogin:"ログイン",
  authNameLabel:"お名前", authNamePh:"何とお呼びすればいいですか？",
  authIdLabel:"メールアドレス", authIdPh:"example@mail.com",
  authPwLabel:"パスワード", authPwPh:"パスワード",
  authPw2Label:"パスワード確認", authPw2Ph:"パスワードをもう一度入力してください",
  authSubmitSignup:"登録して始める", authSubmitLogin:"ログイン",
  authErrFormat:"有効なメールアドレスを入力してください。",
  authErrPwMismatch:"パスワードが一致しません。もう一度ご確認ください。",
  authErrDupe:'このアカウントはすでに存在します。「ログイン」タブからログインしてください。',
  authErrNotFound:'アカウントが見つかりません。「新規登録」タブから先に登録してください。',
  authErrPwShort:"パスワードは6文字以上で入力してください。",
  mypageResetSaved:"行きたい場所リストを空にする", mypageResetVisited:"訪問済みリストを空にする", mypageResetPass:"食事券の予約を空にする",
  resetSavedTitle:"行きたい場所リストを空にする", resetSavedBody:"保存したすべての場所が削除されます。訪問済みリストと食事券の予約は保持されます。",
  resetVisitedTitle:"訪問済みリストを空にする", resetVisitedBody:"訪問済みのマークがすべて削除されます。保存リストとレビューは保持されます。",
  resetPassTitle:"食事券の予約を空にする", resetPassBody:"食事券の予約がすべて削除されます。保存リストと訪問済みリストは保持されます。",
  authErrPwEmpty:"パスワードを入力してください。",
  authErrNameEmpty:"お呼びする名前を教えてください。",
  authErrNotConfirmed:"メールアドレスがまだ確認されていません。受信箱をご確認ください。",
  authErrNeedConfirm:"確認メールを送信しました。確認後にログインしてください。",
  authErrRate:"リクエストが多すぎます。しばらくしてから再度お試しください。",
  authErrNetwork:"接続に失敗しました。しばらくしてから再度お試しください。",
  authErrOffline:"現在ログインサーバーに接続できません。しばらくしてから再度お試しください。",
  authErrGeneric:"エラーが発生しました。しばらくしてから再度お試しください。",
  authErrWrongPw:"パスワードが正しくありません。",
  authWelcomeTitle:"ようこそ、{name}さん！", authWelcomeBody:"登録が完了しました。正式リリース時には真っ先にお知らせします。",
  authWelcomeBodyLogin:"おかえりなさい！また会えて嬉しいです。",
  authWelcomeMypageBtn:"マイページへ",
  headerAuthSavedLabel:"保存した場所", headerAuthMypageTitle:"{name}さんのマイページ",
  logoutTitle:"ログアウトしますか？", logoutBody:"ログアウト後は、保存リストの利用やレビュー作成などに再度ログインが必要になります。",
  logoutOk:"ログアウト", logoutCancel:"キャンセル",
  mypageTitle:"{name}さんのマイページ", mypageTitleGeneric:"マイページ",
  mypageTabSaved:"行きたい場所", mypageTabVisited:"訪問済み", mypageTabPass:"食事券",
  allergyTitle:"🥜 アレルギー設定", allergySub:"選択した食材を使用している可能性のあるお店を開く前にお知らせします。",
  allergyWarnTitle:"ご来店前にご確認ください", allergyWarnBody:"このお店では{list}を含む料理が提供される場合があります。ご注文前にオーナーさんにご確認ください。",
  allergyWarnOk:"了解しました、表示する",
  allergen_shellfish:"甲殻類", allergen_fish:"魚介類", allergen_milk:"乳製品", allergen_wheat:"小麦・グルテン",
  allergen_nuts:"ナッツ類", allergen_pork:"豚肉", allergen_beef:"牛肉", allergen_egg:"卵",
  mypageResetLink:"すべての活動履歴をリセット", mypageLogoutBtn:"ログアウト",
  mypageEmptySaved:"保存されたお店はまだありません。", mypageEmptyVisited:"訪問記録はまだありません。",
  mypageEmptyPass:"予約された食事券はまだありません。<br>孫の食事券セクションでお好きなお店を選んでください。",
  mypageRemoveSavedTitle:"行きたい場所から削除", mypageRemoveVisitedTitle:"訪問記録を取り消す",
  mypageConfirmUnvisit:"この訪問記録を取り消しますか？",
  mypageCancelPassTitle:"予約を取り消す", mypageConfirmCancelPass:"この食事券の予約を取り消しますか？", mypageCancelPassOk:"予約を取り消す",
  resetTitle:"活動履歴をリセット", resetBody:"保存した場所、訪問記録、レビュー、食事券の予約がすべて削除されます。この操作は取り消せません。",
  resetOk:"リセット", resetCancel:"キャンセル",
  reviewFormTitle:"あなたもレビューを書く", reviewFormSub:"訪れたお店についての正直なレビューをシェアしてください。",
  reviewFormNoVisitTitle:"まだレビューを書けません", reviewFormNoVisitBody:"訪問済みにマークしたお店だけレビューを書くことができます。",
  reviewFormNoVisitOk:"お店を見る",
  reviewRatingLabel:"評価", reviewPlaceLabel:"訪問したお店",
  reviewVisibilityLabel:"表示方法", reviewVisibilityReal:"実名（{name}）", reviewVisibilityAnon:"匿名",
  reviewPhotoLabel:"写真を添付", reviewOptional:"任意",
  visitVerifyTitle:"来店確認",
  visitVerifySub:"本当に{name}に行きましたか？レシートまたはお店の看板の写真をアップロードしてください。",
  visitVerifyNote:"実際に訪れたお店だけレビューできます。写真は確認のみに使用され、保存されません。",
  visitVerifyPhotoLabel:"レシートまたは店舗外観の写真",
  visitVerifySubmit:"確認する", visitVerifyChecking:"確認中...",
  visitVerifyPreviewAlt:"アップロードした写真のプレビュー",
  visitVerifyErrNoPhoto:"先に写真をアップロードしてください。",
  visitVerifyErrRead:"この写真を読み込めませんでした。別の写真でお試しください。",
  visitVerifyErrServer:"現在確認機能を利用できません。しばらくしてから再度お試しください。",
  visitVerifyFailKind:"レシートまたはお店の看板の写真には見えません。",
  visitVerifyFailName:"写真からこのお店の名前を確認できませんでした。",
  reviewContentLabel:"レビュー内容", reviewContentPh:"どんなところが気に入りましたか？",
  reviewSubmitBtn:"レビューを投稿", reviewErrEmpty:"レビューを入力してください。",
  reviewSuccessTitle:"レビューが投稿されました！",
  reviewSuccessBodyOk:"シェアしてくれてありがとう！レビューリストに反映されました。",
  reviewSuccessBodyFail:"レビューリストには追加されましたが、写真のサイズが大きすぎて保存できませんでした——再読み込みすると消える可能性があります。",
  anonReviewerName:"匿名の孫", namedReviewerSuffix:"（孫）", defaultReviewerName:"ある孫",
  introSub:"チョチウォン邑の地元グルメ発見サービス",
  introVision:"地図に載っていない、または情報が不十分な本物の地元グルメを見つけ出し、お客さんとオーナーさんが一緒に繁栄する地域商圏エコシステムを作ること",
  introOverviewHead:"プロジェクト概要",
  introOverviewBody:'「KU助隊！オーナーさんを助けよう」——高麗大学世宗キャンパスの社会貢献プロジェクトとして始まった学生主導のサービスです。学生と住民が自ら、Naver/Kakaoマップに載っていない、または情報がほとんどないチョチウォン邑の地元グルメを見つけて紹介しています。',
  introMakerHead:"制作者について",
  introMakerBody:"高麗大学世宗キャンパスの経済政策学専攻の学生チーム、マッチプKU助隊が企画・制作した社会貢献プロジェクトです。",
  introProgressHead:"進捗状況",
  introProgressBody:"現在は正式リリース前の事前登録受付段階です。9月の新学期開始後、現地調査を通じて実際の店舗データを揃えてから本サービスを開始する予定です。",
  introFaqBtn:"よくある質問",
  faqTitle:"お問い合わせ", faqSub:"まずはよくある質問をご確認ください。すぐに答えが見つかるかもしれません。",
  faqQ1:"Bap Meokeoreo Waとは何ですか？",
  faqA1:'「KU助隊！オーナーさんを助けよう」プロジェクトによるサービスです。学生と住民が自ら、Naver/Kakaoマップなどのオンライン地図に載っていない、または情報がほとんどないチョチウォン邑の地元グルメを見つけて紹介しています。',
  faqQ2:"これは正式リリース前ですか？",
  faqA2:"はい、現在は準備段階として事前登録を受け付けており、9月の新学期開始後に実際の店舗データとともに本サービスをリリースする予定です。",
  faqQ3:"自分のお店も掲載できますか？",
  faqA3:'はい！現在オーナー登録ページを準備中です。ご利用可能になり次第、「あなたはお店のオーナーさんですか？」ボタンからご案内します。',
  faqQ4:"誰でもレビューを書けますか？",
  faqA4:"ログインしている会員のみ、かつ訪問済みにマークしたお店に限りレビューを書くことができます。これは偽レビューを防ぐための最低限の対策です。",
  faqQ5:"個人情報はどのように使われますか？",
  faqA5:"プライバシーポリシーに記載された目的（会員確認、サービス提供）のみに使用され、関連法令に基づき安全に管理されます。",
  faqQ6:"ボランティアやチームメンバーとして参加したいです。",
  faqA6:'「力を貸してください」メニューからお問い合わせいただければ、次のステップをご案内します。',
  faqFootPrefix:"答えが見つかりませんか？", faqFootBold:"力を貸してください", faqFootSuffix:"からお問い合わせください。",
  faqContactBtn:"お問い合わせを送る",
  supportTitle:"力を貸してください", supportSub:"このプロジェクトのために、助けてくれる方をお待ちしています。",
  supportTeamTitle:"チームメンバーとして参加したいです", supportTeamDesc:"現地調査から企画・開発まで——あなたの活躍できる場所があります。",
  supportSponsorTitle:"このプロジェクトを応援したいです", supportSponsorDesc:"非営利で運営されているプロジェクトを支えてください。",
  contactNameLabel:"お名前", contactNamePh:"名前またはニックネーム",
  contactReachLabel:"連絡先／メール", contactReachPh:"ご連絡先のメールアドレスまたは電話番号",
  contactMessageOptional:"任意", contactSubmitBtn:"お問い合わせを送る",
  contactErrName:"お名前を入力してください。", contactErrReach:"有効なメールアドレスまたは電話番号を入力してください。",
  contactBack:"戻る", contactSuccessTitle:"お問い合わせを受け付けました！",
  contactSuccessBody:"{name}様、ありがとうございます。ご記入いただいた連絡先にご連絡いたします。<br>（{type}）",
  ct_team_title:"チームメンバーとして参加したいです", ct_team_sub:"一緒に作ってくれる仲間をお待ちしています。",
  ct_team_note:"企画・開発・デザイン・現地調査——どの分野でも歓迎します。ご記入いただいた連絡先にご連絡します。",
  ct_team_field:"手伝いたい分野",
  ct_team_opt1:"現地調査（お店探し）", ct_team_opt2:"企画・運営", ct_team_opt3:"デザイン", ct_team_opt4:"開発", ct_team_opt5:"マーケティング・コンテンツ", ct_team_opt6:"まだ決めていない",
  ct_team_msgLabel:"その他伝えたいこと", ct_team_msgPh:"参加したい理由や活動可能な時期など、お気軽にお書きください。",
  ct_sponsor_title:"このプロジェクトを応援したいです", ct_sponsor_sub:"ご支援一つひとつが、もう一軒の地元グルメの発掘につながります。",
  ct_sponsor_note:"このプロジェクトは現在非営利で運営されており、ご支援は現地調査と運営費用にのみ使用されます。",
  ct_sponsor_field:"ご支援の種類",
  ct_sponsor_opt1:"単発の寄付", ct_sponsor_opt2:"継続的な寄付", ct_sponsor_opt3:"物品・スキル提供", ct_sponsor_opt4:"まずは質問したい",
  ct_sponsor_msgLabel:"ご支援についてのメッセージ", ct_sponsor_msgPh:"ご支援についてのご質問やお考えをお気軽にお書きください。",
  ct_partnerStore_title:"オーナー提携申請", ct_partnerStore_sub:"一緒に食事券や学生特典を準備しましょう。",
  ct_partnerStore_note:"掲載・提携申請は無料です。食事券の特典と有効期間はオーナー様が決められます。手数料体系については現在協議中です。",
  ct_partnerStore_field:"ご希望の特典",
  ct_partnerStore_opt1:"10＋1食事券", ct_partnerStore_opt2:"学生割引", ct_partnerStore_opt3:"セットメニュー割引", ct_partnerStore_opt4:"まずは質問したい",
  ct_partnerStore_msgLabel:"お店について／その他", ct_partnerStore_msgPh:"お店の名前、場所、ご検討中の特典についてお書きください。",
  ct_partnerOrg_title:"学生会・サークル提携のお問い合わせ", ct_partnerOrg_sub:"あなたの組織のメンバーのための特典を作りましょう。",
  ct_partnerOrg_note:"高麗大学世宗キャンパスには、すでにKUメンバーシップのような提携店舗があります。地図に載っていない地元グルメも、発掘され次第、同じ枠組みに参加できるようにしたいと考えています——条件については現在協議中です。",
  ct_partnerOrg_field:"組織の種類",
  ct_partnerOrg_opt1:"学生会", ct_partnerOrg_opt2:"サークル", ct_partnerOrg_opt3:"キャンパス組織", ct_partnerOrg_opt4:"その他の団体",
  ct_partnerOrg_msgLabel:"ご希望の提携形態", ct_partnerOrg_msgPh:"組織の名前、規模、ご希望の特典についてお書きください。",
  ct_expand_title:"私の地域の地元グルメも発掘してほしい", ct_expand_sub:"チョチウォン以外でも、私たちの活動に共感していただけたら。",
  ct_expand_note:"収益モデルはまだ確定していません。現在は非営利での拡大について協議し、協力方法を模索しています。",
  ct_expand_field:"ご提案の地域", ct_expand_fieldPh:"例：世宗市トダム洞、清州市サチャン洞",
  ct_expand_msgLabel:"あなたのご提案", ct_expand_msgPh:"その地域について、そしてこのサービスがそこでどう役立つかを教えてください。",
  passPerUnit:"1枚あたり", passValidDays:"有効期間{n}日間", passBuyBtn:"食事券を予約する",
  passSelectTitle:"{name}の食事券", passHowMany:"何枚ご希望ですか？",
  passSummaryCount:"{n}枚", passSummaryBonus:"オーナー特典 +{n}枚", passSummaryTotal:"受け取る食事券", passSummaryAmount:"お支払い金額",
  passNextBtn:"次へ", passConfirmTitle:"この内容で予約しますか？", passConfirmSub:"以下の内容で予約を送信します。",
  passSummaryStore:"お店", passSummaryBought:"購入する食事券", passSummaryValid:"有効期間", passSummaryValidVal:"初回利用から{n}日間",
  passPrepayNote:"現在は<b>事前予約</b>のみの受付です。実際の決済は正式リリース時に導入されます——この段階では料金は発生しません。",
  passSubmitBtn:"事前予約を送信", passBackBtn:"戻る",
  passSuccessTitle:"予約を受け付けました！",
  passSuccessBodyOk:"{name}の食事券{n}枚を保存しました。正式リリース時に決済についてお知らせします。",
  passSuccessBodyFail:"{name}の食事券は保存されましたが、容量不足のため記録できませんでした——再読み込みすると消える可能性があります。",
  passSeeMyPasses:"自分の食事券を見る",
  passInfoTitle:'孫の食事券<span class="badge-live">予約受付中</span>',
  passInfoBody:"お気に入りのお店の食事券を事前にチャージしましょう。オーナーさんの特典に応じてボーナス分の食事券がもらえ、来店ごとに1枚ずつ使えます。",
  passBenefit1Title:"10枚買うと1枚無料", passBenefit1Body:"まとめて購入すると、オーナーさんが設定した特典分の食事券がもらえます。特典はお店によって異なります。",
  passBenefit2Title:"食事代を前払い", passBenefit2Body:"その都度支払う代わりに前払いして、お財布の負担を軽くしましょう。",
  passBenefit3Title:"オーナーさんは常連客を獲得", passBenefit3Body:"お店は先に収益を得られ、常連客も獲得できます——双方にとってメリットのある仕組みです。",
  passListTitle:"食事券を準備中のお店",
  passMoreNote:"9月の現地調査中にオーナーさんと相談しながら、さらに多くのお店で食事券が順次開放されます。",
  passPartnerTitle:"提携プログラムも準備中です",
  passPartnerBody:"高麗大学世宗キャンパスには、すでにKUメンバーシップのような提携店舗があります。地図に載っていない地元グルメも、発掘され次第、同じ枠組みに参加できると考えています。",
  passPartnerStoreBtn:"オーナー提携申請", passPartnerOrgBtn:"学生会・サークル提携のお問い合わせ",
  passNotice:"<strong>決済はまだご利用いただけません。</strong>現在は非営利の準備段階のため、食事券は<b>事前予約</b>のみ受け付けています——実際の決済連携は後日正式にリリースされます。特典と有効期間はオーナーさんが設定します。",
  join4Title:"コミュニティに参加しよう", join4Body:"リアルタイムでの交流は外部SNSグループで行われます。",
  communityTitle:"コミュニティに参加しよう",
  communityBody:"リアルタイムでの交流はKakaoTalkやInstagramなどの外部SNSグループで行われます。このサイトでは参加リンクとQRコードのみ提供しています。",
  communityJoinBtn:"グループに参加する",
  communityQrReady:"下のQRコードをスキャンするか、ボタンをタップして参加してください。",
  communityQrSoon:"グループはまだ作成されていません。開設され次第、ここにQRコードが表示されます。",
  grandchildDefaultName:"孫", mealPassWord:"食事券", ownerBonusLabel:"オーナー特典",
  mypagePassBonusWord:"ボーナス", mypagePassDateLine:"{date}に予約", reviewCharUnit:"文字",
} };

let currentLang = 'ko';

function t(key){
  const dict = i18n[currentLang];
  return (dict && dict[key] !== undefined) ? dict[key] : null;
}

// 정적 HTML용 — [data-i18n] 등 태그된 요소를 currentLang 사전 값으로 바꾸거나 원래 한국어로 되돌린다
function applyStaticTranslations(){
  const dict = i18n[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if(el.dataset.i18nKoCache === undefined) el.dataset.i18nKoCache = el.innerHTML;
    el.innerHTML = (dict && dict[key] !== undefined) ? dict[key] : el.dataset.i18nKoCache;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if(el.dataset.i18nKoPhCache === undefined) el.dataset.i18nKoPhCache = el.placeholder;
    el.placeholder = (dict && dict[key] !== undefined) ? dict[key] : el.dataset.i18nKoPhCache;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if(el.dataset.i18nKoAriaCache === undefined) el.dataset.i18nKoAriaCache = el.getAttribute('aria-label') || '';
    el.setAttribute('aria-label', (dict && dict[key] !== undefined) ? dict[key] : el.dataset.i18nKoAriaCache);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if(el.dataset.i18nKoTitleCache === undefined) el.dataset.i18nKoTitleCache = el.title;
    el.title = (dict && dict[key] !== undefined) ? dict[key] : el.dataset.i18nKoTitleCache;
  });
  document.documentElement.lang = currentLang;
}

// 언어 전환의 실제 진입점 — 정적 텍스트 갱신 + 동적 렌더 함수 재실행 + 저장
function applyLanguage(lang){
  track('lang_change', { lang });
  currentLang = lang;
  applyStaticTranslations();
  if(typeof renderCards === 'function') renderCards();
  if(typeof renderExampleCards === 'function') renderExampleCards();
  if(typeof updateHeaderAuthUI === 'function') updateHeaderAuthUI();
  if(typeof renderPassCards === 'function') renderPassCards();
  // 지도 마커 툴팁도 가게 이름을 담고 있어서 같이 다시 그려야 한다
  if(typeof renderMarkers === 'function') renderMarkers();
  // 상세가 열려 있으면 그것도 다시 그린다 — AI 요약은 언어별로 따로 받아오므로
  // 여기서 다시 그리지 않으면 바꾸기 전 언어의 요약이 그대로 남는다.
  if(currentDetailIdx >= 0 && detailOverlay && detailOverlay.classList.contains('show')){
    openDetail(currentDetailIdx);
  }
  store.lang = currentLang;
  saveState();
}

loadState();
currentLang = store.lang || 'ko';
applyStaticTranslations();
applyState();
// 테마는 클래스만 먼저 건다 — 카드·지도는 아래에서 어차피 처음 그려진다.
// (여기서 applyTheme()을 부르면 아직 선언 전인 cardGrid를 건드려 TDZ 에러가 난다.)
document.documentElement.classList.toggle('dark', isDarkTheme());

// 로그인 상태는 renderCards()가 첫 렌더 때부터 참조하므로 여기서 선언한다
// (손주 로그인 섹션에서 선언하면 초기 renderCards() 호출 시점에 TDZ 에러가 난다).
// 여기 값은 지난 방문의 흔적일 뿐이고, 진짜 출처는 Supabase 세션이다 —
// syncAuthFromSession()이 세션을 확인한 뒤 덮어쓴다.
let isLoggedIn = store.auth.isLoggedIn;
let currentUserName = store.auth.name;
let currentUserId = store.auth.userId || '';

const cardGrid = document.getElementById('cardGrid');
const filterCount = document.getElementById('filterCount');
const filterEmpty = document.getElementById('filterEmpty');
const sortSelect = document.getElementById('sortSelect');
const priceMinInput = document.getElementById('priceMin');
const priceMaxInput = document.getElementById('priceMax');
let currentCat = "전체";
let currentSort = "recommend";
// "가까운 순" 정렬이 쓰는 현재 위치. 페이지 진입 시 자동으로 묻지 않고,
// "가까운 순"을 고르는 시점(사용자 행동)에만 요청한다.
let userLocation = null;

// 실제 가게는 r.rating이 전부 null이고 평점이 구글에서 온다 — 정렬도 카드 라벨과 같은 값을 봐야 한다.
// 평점이 아직 없는 곳은 -1로 두어 맨 뒤로 밀린다.
function ratingOf(r){ const lr = liveRating(r); return lr ? lr.rating : -1; }
function countOf(r){ const lr = liveRating(r); return lr ? lr.reviewCount : -1; }
// api/google-reviews.js의 haversine과 같은 식 — 좌표 간 거리(m)를 구하는 계산은 여기도 저기도 같다.
function haversineMeters(lat1, lng1, lat2, lng2){
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// 좌표 없는 가게나 위치를 아직 못 받은 상태는 맨 뒤로 밀린다(ratingOf의 -1과 같은 관례).
function distanceOf(r){
  if(!userLocation || !r.lat || !r.lng) return Infinity;
  return haversineMeters(userLocation.lat, userLocation.lng, r.lat, r.lng);
}

function getFilteredList(){
  // 카테고리/정렬 필터는 liveReview(실제 확인된) 가게에만 적용한다. 텍스트 검색은
  // "동네 가게 찾아보기"(runLiveSearch) 하나로 통일했다 — 예시(목업) 가게는
  // renderExampleCards()가 고정 3장으로 따로 보여준다.
  let list = restaurants.filter(r => r.liveReview && (currentCat === "전체" || r.cat === currentCat));
  const minP = priceMinInput.value ? Number(priceMinInput.value) : null;
  const maxP = priceMaxInput.value ? Number(priceMaxInput.value) : null;
  if(minP !== null) list = list.filter(r => r.priceValue >= minP);
  if(maxP !== null) list = list.filter(r => r.priceValue <= maxP);
  switch(currentSort){
    case "name":
      list = list.slice().sort((a,b) => a.name.localeCompare(b.name, 'ko'));
      break;
    case "rating":
      list = list.slice().sort((a,b) => ratingOf(b) - ratingOf(a));
      break;
    case "reviews":
      list = list.slice().sort((a,b) => countOf(b) - countOf(a));
      break;
    case "distance":
      list = list.slice().sort((a,b) => distanceOf(a) - distanceOf(b));
      break;
    default:
      list = list.slice().sort((a,b) => ratingOf(b) - ratingOf(a));
  }
  return list;
}

// 레스토랑 이름/설명 다국어 헬퍼 — 해당 언어 번역이 있을 때만 대체, 없으면 한국어 원문
// 이름 번역은 데이터가 아니라 i18n 사전(name_<id>)에 있다 — rCat()과 같은 패턴.
// currentLang==='ko'는 i18n.ko가 없어 t()가 항상 null을 돌려주므로 자동으로 r.name(원문)이 나온다.
function rName(r){ return t('name_' + r.id) || r.name; }
// 검색/퍼지매칭처럼 "지금 언어" 하나가 아니라 모든 번역을 한 번에 훑어야 하는 곳에서 쓴다.
function nameAllLangs(r){
  return `${r.name} ${i18n.en['name_'+r.id] || ''} ${i18n.zh['name_'+r.id] || ''} ${i18n.es['name_'+r.id] || ''} ${i18n.de['name_'+r.id] || ''} ${i18n.ja['name_'+r.id] || ''}`;
}
// 수집 스크립트가 카테고리에서 찍어낸 정형문 6종. 카페만 19곳이라 목록이 전부 같은 문장이었다.
// 이 문장을 그대로 쓰는 가게만 문구를 갈아끼운다 — "가정식 백반집", "초밥·롤 전문점"처럼
// 더 구체적으로 적힌 설명은 정보가 더 많으므로 건드리지 않는다.
const GENERIC_DESC = {
  '조치원읍 골목의 한식당':'Korean', '조치원읍 골목의 양식당':'Western',
  '조치원읍 골목의 중식당':'Chinese', '조치원읍 골목의 일식당':'Japanese',
  '조치원읍 골목의 분식집':'Snack',   '조치원읍 골목의 카페':'Cafe',
};
// 한국어 원문은 여기, 다른 언어는 i18n 사전의 같은 키(descVar<카테고리><번호>)에 둔다.
// 언어를 추가할 때 가게 데이터는 건드리지 않고 사전에 블록만 더하면 된다.
const DESC_VARIANTS = {
  Cafe: ['조치원읍 골목의 느낌 좋은 카페','호로록 마시고 가는 골목 카페','수업 사이에 들르기 좋은 골목 카페','조치원읍 골목, 자리 잡고 앉는 카페','한 잔 하고 가는 조치원읍 골목 카페'],
  Korean: ['밥심이 통하는 조치원읍 골목 한식당','조치원읍 골목의 든든한 한 끼','오늘 뭐 먹지 할 때 가는 골목 한식당','조치원읍 골목, 집밥 생각날 때'],
  Western: ['조치원읍 골목의 아담한 양식당','포크로 먹는 조치원읍 골목 한 끼','조치원읍 골목, 조금 특별한 날 양식당'],
  Chinese: ['불맛 나는 조치원읍 골목 중식당','조치원읍 골목의 한 그릇 중식','조치원읍 골목, 짬짜면 고민되는 집'],
  Japanese: ['조치원읍 골목의 조용한 일식당','조치원읍 골목, 한 그릇 일식','후루룩 비우는 조치원읍 골목 일식당'],
  Snack: ['조치원읍 골목의 추억 돋는 분식집','가볍게 배 채우는 골목 분식집','조치원읍 골목, 떡볶이 생각날 때'],
};
// id 슬러그 해시로 고른다 — 랜덤이면 다시 그릴 때마다 문구가 바뀌어 사이트가 불안정해 보인다.
function descVariant(r){
  const group = GENERIC_DESC[r.desc];
  if(!group || !r.id) return null;
  const pool = DESC_VARIANTS[group];
  let h = 0;
  for(let i = 0; i < r.id.length; i += 1) h = (h * 31 + r.id.charCodeAt(i)) >>> 0;
  const n = h % pool.length;
  return (currentLang === 'ko') ? pool[n] : (t('descVar' + group + n) || pool[n]);
}
// descVariant()에 안 걸리는(정형문이 아닌) 가게만 desc_<id> 사전 키를 갖는다.
function rDesc(r){
  const v = descVariant(r);
  if(v) return v;
  return t('desc_' + r.id) || r.desc;
}
function pBenefit(p){
  if(currentLang === 'en' && p.benefitEn) return p.benefitEn;
  if(currentLang === 'zh' && p.benefitZh) return p.benefitZh;
  if(currentLang === 'es' && p.benefitEs) return p.benefitEs;
  if(currentLang === 'fr' && p.benefitFr) return p.benefitFr;
  if(currentLang === 'de' && p.benefitDe) return p.benefitDe;
  if(currentLang === 'ja' && p.benefitJa) return p.benefitJa;
  return p.benefit;
}
function rCat(r){ return t('cat' + {'전체':'All','한식':'Korean','양식':'Western','중식':'Chinese','일식':'Japanese','분식':'Snack','카페':'Cafe'}[r.cat]) || r.cat; }

// 손주 식권 흐름 전용 — 통화/수량 단위 표기 헬퍼 (언어별 어순·단위가 달라 공용 함수로 뺐다)
function wonSuffix(n){
  if(currentLang === 'en') return `₩${n.toLocaleString()}`;
  if(currentLang === 'zh') return `${n.toLocaleString()}韩元`;
  if(currentLang === 'es') return `${n.toLocaleString()} wones`;
  if(currentLang === 'fr') return `${n.toLocaleString()} wons`;
  if(currentLang === 'de') return `${n.toLocaleString()} Won`;
  if(currentLang === 'ja') return `${n.toLocaleString()}ウォン`;
  return `${n.toLocaleString()}원`;
}
function passUnit(n){
  if(currentLang === 'en') return `${n}`;
  if(currentLang === 'zh') return `${n}张`;
  if(currentLang === 'es') return `${n}`;
  if(currentLang === 'fr') return `${n}`;
  if(currentLang === 'de') return `${n}`;
  if(currentLang === 'ja') return `${n}枚`;
  return `${n}장`;
}

// 결과가 0곳일 때 길을 잃지 않게 해주는 두 갈래.
// 카테고리/가격/정렬은 전부 getFilteredList()가 읽는 값이므로, 여기서는 그 값만 되돌리고
// renderCards()를 다시 부르면 된다 (필터 규칙을 여기에 복사하지 않는다).
function setCatChip(cat){
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
}

function resetFilters(){
  currentCat = '전체';
  setCatChip('전체');
  priceMinInput.value = '';
  priceMaxInput.value = '';
  currentSort = 'recommend';
  sortSelect.value = 'recommend';
  renderCards();
}

// "이런 맛집은 어때요?" 추천 칩 — 기존 카테고리 필터를 그대로 쓴다
function jumpCategory(cat){
  track('filter_use', { filter:'category', value:cat });
  currentCat = cat;
  setCatChip(cat);
  priceMinInput.value = '';
  priceMaxInput.value = '';
  renderCards();
}

// 가게가 30곳을 넘으면서 한 화면에 다 깔면 스크롤이 너무 길어졌다 — 페이지로 나눈다.
// 필터/정렬/카테고리를 바꾸면 1페이지로 돌아간다(2페이지를 보던 중 목록이 줄면 빈 화면이 된다).
const CARDS_PER_PAGE = 18;
let currentPage = 1;
// 필터가 바뀌면 1페이지로 되돌린다. 바꾸는 곳(칩·검색·가격·정렬·초기화)마다 리셋을 심는 대신
// 렌더 시점에 필터 조합이 달라졌는지 한 곳에서 본다 — 필터 축이 늘어도 여기만 고치면 된다.
let lastFilterSig = null;
function goToPage(n){
  currentPage = n;
  renderCards();
  // 페이지를 넘기면 목록 맨 위로 — 넘긴 뒤 화면이 그대로면 바뀐 걸 눈치채기 어렵다.
  const anchor = document.getElementById('restaurants');
  if(anchor) anchor.scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderCards(){
  cardGrid.innerHTML = "";
  const sig = [currentCat, currentSort, priceMinInput.value, priceMaxInput.value].join('|');
  if(sig !== lastFilterSig){ lastFilterSig = sig; currentPage = 1; }
  const all = getFilteredList();
  const pageCount = Math.max(1, Math.ceil(all.length / CARDS_PER_PAGE));
  if(currentPage > pageCount) currentPage = pageCount;   // 필터로 목록이 줄어든 경우
  const start = (currentPage - 1) * CARDS_PER_PAGE;
  const list = all.slice(start, start + CARDS_PER_PAGE);

  filterCount.textContent = (t('filterCountTemplate') || '{n}곳의 맛집').replace('{n}', all.length);
  filterEmpty.style.display = all.length === 0 ? 'block' : 'none';
  renderPager(pageCount);
  list.forEach((r, i) => {
    const idx = restaurants.indexOf(r);
    // 담기/방문 표시는 로그인한 손주 개인의 기록이므로, 비로그인 상태에서는
    // 카드를 전부 초기 상태(빈 하트 · 배지 없음 · "가보고 싶은 곳에 담기")로 통일해서 보여준다.
    const saved = isLoggedIn && r.saved;
    const visited = isLoggedIn && r.visited;
    const card = document.createElement('div');
    card.className = 'food-card';
    card.addEventListener('click', () => openDetail(idx));
    const lr = liveRating(r);
    const cardRatingHtml = lr
      ? `★ ${lr.rating} <span style="color:var(--ink-soft);font-weight:400;">(${lr.reviewCount})</span>`
      : `<span style="color:var(--ink-soft);font-weight:400;">${t('cardReviewPending') || '🔎 실제 리뷰 준비중'}</span>`;
    card.innerHTML = `
      <div class="food-thumb" style="background:${thumbColor(start + i)}">
        <span>${r.emoji}</span>
        <button class="save-toggle ${saved ? 'saved':''}" data-idx="${idx}" title="가보고 싶은 곳">${saved ? '♥':'♡'}</button>
        <div class="visit-badge ${visited ? 'show':''}">${t('cardVisitBadge') || '✔ 가본 곳'}</div>
        <div class="live-review-badge ${r.liveReview ? 'show':''}">${t('cardLiveBadge') || '🌐 구글 실시간 리뷰'}</div>
        ${(r.lat && r.lng) ? `<button class="map-focus-toggle" data-id="${r.id}" title="${t('detailMapFocus') || '🗺️ 지도에서 위치 보기'}">🗺️</button>` : ''}
      </div>
      <div class="food-body">
        <span class="food-cat">${rCat(r)}</span>
        ${r.detail && r.detail.isExample ? `<span class="mock-tag">${t('cardMockTag') || '예시 데이터'}</span>` : ''}
        <div class="food-name">${rName(r)}</div>
        <div class="food-desc">${rDesc(r)}</div>
        <div class="food-meta">
          <span class="stars">${cardRatingHtml}</span>
        </div>
        <button class="visit-flow-btn" data-idx="${idx}">${visited ? (t('cardVisitedLabel')||'✔ 방문 기록 있음') : (saved ? (t('cardMarkVisited')||'방문 완료로 표시하기') : (t('cardWantToVisit')||'가보고 싶은 곳에 담기'))}</button>
      </div>
    `;
    cardGrid.appendChild(card);
  });

  bindFoodCardButtons(cardGrid);

  // 지도 마커는 페이지와 무관하게 필터에 걸린 가게 전부를 찍는다 —
  // 지도는 "어디에 뭐가 있나"를 보는 곳이라 2페이지 가게가 사라지면 오히려 이상하다.
  renderMarkers();
}

function renderPager(pageCount){
  const pager = document.getElementById('cardPager');
  if(!pager) return;
  // 한 페이지뿐이어도 "1"을 남긴다 — 페이저가 통째로 사라지면 목록이 여기서 끝인지
  // 아직 덜 그려진 건지 구분이 안 된다. 대신 앞뒤 버튼은 비활성으로 남는다.
  if(pageCount < 1) { pager.innerHTML = ''; return; }

  const btn = (label, page, opts = {}) =>
    `<button type="button" class="pager-btn${opts.active ? ' is-active' : ''}"` +
    `${opts.disabled ? ' disabled' : ''} data-page="${page}"${opts.aria ? ` aria-label="${opts.aria}"` : ''}` +
    `${opts.active ? ' aria-current="page"' : ''}>${label}</button>`;

  let html = btn('‹', currentPage - 1, { disabled: currentPage === 1, aria: t('pagerPrev') || '이전 페이지' });
  for(let p = 1; p <= pageCount; p += 1) html += btn(String(p), p, { active: p === currentPage });
  html += btn('›', currentPage + 1, { disabled: currentPage === pageCount, aria: t('pagerNext') || '다음 페이지' });
  pager.innerHTML = html;

  pager.querySelectorAll('.pager-btn').forEach(b => {
    b.addEventListener('click', () => {
      const p = Number(b.dataset.page);
      if(!b.disabled && p !== currentPage) goToPage(p);
    });
  });
}

// save-toggle/visit-flow-btn 클릭 바인딩 — 그리드(container) 범위로 한정해서
// 여러 그리드(실제 가게 cardGrid, 예시 가게 exampleCardGrid)가 공존해도 중복 바인딩되지 않게 한다.
function bindFoodCardButtons(container){
  container.querySelectorAll('.save-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(!requireLogin('save')) return;
      const r = restaurants[e.currentTarget.dataset.idx];
      if(r.saved){
        confirmMark(r, '💔', unsaveQuestion(r), () => { r.saved = false; r.visited = false; });
      } else {
        confirmMark(r, '💌', t('confirmSave') || '이 맛집을 가보고 싶은 곳에 담으시겠습니까?', () => { r.saved = true; });
      }
    });
  });
  container.querySelectorAll('.map-focus-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      focusMapMarker(e.currentTarget.dataset.id);
    });
  });
  container.querySelectorAll('.visit-flow-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = restaurants[e.currentTarget.dataset.idx];
      // 비로그인 상태에서는 버튼이 전부 "담기"로 보이므로, 로그인 게이트를 먼저 통과시킨다
      if(!requireLogin('save')) return;
      if(r.visited){
        openMypage('visited');
        return;
      }
      if(!r.saved){
        confirmMark(r, '💌', t('confirmSave') || '이 맛집을 가보고 싶은 곳에 담으시겠습니까?', () => { r.saved = true; });
      } else {
        // 방문 완료는 리뷰 작성의 관문이라 그냥 통과시키지 않는다 — 사진 인증을 먼저 거친다.
        openVisitVerify(r);
      }
    });
  });
}

// "예시 가게" — 아직 현장 조사 전인 목업 3곳, 필터/정렬 없이 항상 고정 노출
const exampleCardGrid = document.getElementById('exampleCardGrid');
function renderExampleCards(){
  if(!exampleCardGrid) return;
  exampleCardGrid.innerHTML = "";
  const list = restaurants.filter(r => !r.liveReview);
  list.forEach((r) => {
    const idx = restaurants.indexOf(r);
    const saved = isLoggedIn && r.saved;
    const visited = isLoggedIn && r.visited;
    const card = document.createElement('div');
    card.className = 'food-card';
    card.addEventListener('click', () => openDetail(idx));
    const cardRatingHtml = r.rating != null
      ? `★ ${r.rating} <span style="color:var(--ink-soft);font-weight:400;">(${r.reviewCount})</span>`
      : `<span style="color:var(--ink-soft);font-weight:400;">${t('cardReviewPending') || '🔎 실제 리뷰 준비중'}</span>`;
    card.innerHTML = `
      <div class="food-thumb" style="background:${thumbColor(idx)}">
        <span>${r.emoji}</span>
        <button class="save-toggle ${saved ? 'saved':''}" data-idx="${idx}" title="가보고 싶은 곳">${saved ? '♥':'♡'}</button>
        <div class="visit-badge ${visited ? 'show':''}">${t('cardVisitBadge') || '✔ 가본 곳'}</div>
      </div>
      <div class="food-body">
        <span class="food-cat">${rCat(r)}</span>
        ${r.detail && r.detail.isExample ? `<span class="mock-tag">${t('cardMockTag') || '예시 데이터'}</span>` : ''}
        <div class="food-name">${rName(r)}</div>
        <div class="food-desc">${rDesc(r)}</div>
        <div class="food-meta">
          <span class="stars">${cardRatingHtml}</span>
        </div>
        <button class="visit-flow-btn" data-idx="${idx}">${visited ? (t('cardVisitedLabel')||'✔ 방문 기록 있음') : (saved ? (t('cardMarkVisited')||'방문 완료로 표시하기') : (t('cardWantToVisit')||'가보고 싶은 곳에 담기'))}</button>
      </div>
    `;
    exampleCardGrid.appendChild(card);
  });
  bindFoodCardButtons(exampleCardGrid);
}

// 담기를 해제하면 서버에서 그 가게의 줄이 통째로 지워진다(= 방문 기록도 함께).
// 가본 곳으로 표시해둔 가게라면 그 사실을 물어보기 전에 알려준다.
function unsaveQuestion(r){
  if(r.visited) return t('confirmUnsaveVisited') || '가보고 싶은 곳에서 해제하시겠습니까? 이 가게의 방문 기록도 함께 지워져요.';
  return t('confirmUnsave') || '가보고 싶은 곳에서 해제하시겠습니까?';
}

// 저장/방문 상태 변경은 전부 확인 모달을 거친다 (extra.md §2)
function confirmMark(r, emoji, question, apply){
  openConfirm({
    emoji, title:rName(r), text:question,
    okLabel:t('confirmOk') || '확인', cancelLabel:t('confirmNo') || '아니요',
    onOk: () => {
      apply(); saveState(); pushMark(r); renderCards(); renderExampleCards(); closeConfirm();
      track(r.visited ? 'visit_verified' : (r.saved ? 'save_place' : 'unsave_place'),
            { item_id:r.id, item_category:r.cat });
    }
  });
}

// 썸네일 배경은 토큰이 아니라 하드코딩 4색이라 테마를 따로 태워줘야 한다
// (다크에서 이것만 밝게 남으면 카드마다 흰 판이 떠 보인다).
function thumbColor(i){
  const dark = document.documentElement.classList.contains('dark');
  const colors = dark
    ? ['#2A323D','#37302A','#322E28','#2B333D']
    : ['#E3E9EF','#F3E7DE','#EAE3D9','#E9EDF2'];
  return colors[i % colors.length];
}

// 실제 가게는 rating이 하드코딩돼 있지 않고(null) 평점이 구글에서 실시간으로 온다.
// 한 번이라도 불러왔으면 그 캐시(store.googleReviews)를 카드·상세 라벨에도 그대로 쓴다.
// 이게 없으면 진짜 리뷰가 붙은 가게가 계속 "실제 리뷰 준비중"으로 보인다.
function liveRating(r){
  if(r.rating != null) return { rating: r.rating, reviewCount: r.reviewCount };
  const c = store.googleReviews[googleCacheKey(r.name)];
  const d = c && c.data;
  if(d && d.found && d.rating != null) return { rating: d.rating, reviewCount: d.reviewCount || 0 };
  return null;
}

function ratingLabel(r){
  const lr = liveRating(r);
  return lr
    ? `★ ${lr.rating} (${lr.reviewCount})`
    : (t('cardReviewPending') || '🔎 실제 리뷰 준비중');
}

// 구글 리뷰를 막 불러왔을 때 이미 그려져 있는 라벨들을 갱신한다.
function refreshRatingLabels(r){
  const el = document.getElementById('detailRatingLabel');
  if(el) el.textContent = `${ratingLabel(r)} · ${r.price}`;
  renderCards();
}

document.querySelectorAll('.cat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentCat = chip.dataset.cat;
    renderCards();
  });
});

sortSelect.addEventListener('change', () => {
  const val = sortSelect.value;
  // "가까운 순"은 위치가 있어야 의미가 있다 — 처음 고르는 순간에만 권한을 묻고,
  // 페이지 진입 시에는 절대 먼저 묻지 않는다(대부분 거절당하는 패턴을 피한다).
  if(val === 'distance' && !userLocation){
    if(!('geolocation' in navigator)){
      sortSelect.value = currentSort;
      openToast('locationUnavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        currentSort = 'distance';
        renderCards();
      },
      () => { sortSelect.value = currentSort; openToast('locationDenied'); },
      { timeout: 8000 }
    );
    return;
  }
  currentSort = val;
  renderCards();
});

priceMinInput.addEventListener('input', renderCards);
priceMaxInput.addEventListener('input', renderCards);

renderCards();
renderExampleCards();

// 카드 그리드의 별점은 구글에서 온다. 상세 모달을 열 때만 받아오면 목록에는 계속
// "실제 리뷰 준비중"이 남아 있다가 눌러야 별점으로 바뀌는 것처럼 보인다.
// 그래서 첫 렌더 직후 한 번 미리 받아둔다. 캐시(GOOGLE_CACHE_TTL)가 살아 있으면
// 요청을 아예 보내지 않으므로 재방문에는 호출이 0건이다.
async function prefetchLiveRatings(){
  const targets = restaurants.filter(r => r.lat && r.lng && !isFreshGoogle(store.googleReviews[googleCacheKey(r.name)]));
  if(targets.length === 0) return;
  const results = await Promise.all(targets.map(async r => {
    try{
      const res = await fetch('/api/google-reviews?name=' + encodeURIComponent(r.name) + '&lat=' + r.lat + '&lng=' + r.lng + '&lang=' + mapsLanguage());
      const data = await res.json();
      return data.found ? { name: r.name, data } : null;
    }catch(e){ return null; } // 조용히 건너뛴다 — 못 받으면 "실제 리뷰 준비중"으로 남을 뿐이다
  }));
  const got = results.filter(Boolean);
  if(got.length === 0) return;
  got.forEach(g => { store.googleReviews[googleCacheKey(g.name)] = { data: g.data, fetchedAt: Date.now() }; });
  saveState();
  renderCards();
}
prefetchLiveRatings();

// 버튼의 aria-pressed를 첫 상태에 맞춘다(클래스는 위에서 이미 걸었다).
(function initThemeButton(){
  const btn = document.getElementById('themeToggle');
  if(btn) btn.setAttribute('aria-pressed', isDarkTheme() ? 'true' : 'false');
  // 사용자가 직접 고르기 전까지는 OS 설정을 따라간다.
  if(window.matchMedia){
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if(mq.addEventListener) mq.addEventListener('change', () => { if(!store.theme) applyTheme(); });
  }
})();

// ---- Dummy reviews ----
const reviews = [
  {id:'seed0', name:"익명의 재학생", emoji:"🎓", stars:5, place:"할머니 떡볶이", text:"학교 끝나고 늘 여기 와요. 사장님이 항상 반겨주셔서 더 정겹습니다.", likes:14, at:'2026-08-18'},
  {id:'seed1', name:"교환학생 Lee", emoji:"🌏", stars:5, place:"초밥발전소12g", text:"가격 대비 퀄리티가 정말 좋아요. 한국 온 뒤 최고의 발견이었어요.", likes:9, at:'2026-08-15'},
  {id:'seed2', name:"행정팀 직원", emoji:"💼", stars:4, place:"조치원 할매국밥", text:"점심시간에 자주 가는데 국물이 진짜 진해요. 강력 추천합니다.", likes:6, at:'2026-08-12'},
  {id:'seed3', name:"기숙사생 K", emoji:"🏠", stars:5, place:"더라멘", text:"면이 쫄깃쫄깃하고 양도 많아서 자취생한테 딱이에요.", likes:3, at:'2026-08-10'},
];
const reviewList = document.getElementById('reviewList');
const reviewSortSelect = document.getElementById('reviewSort');
let currentReviewSort = 'recommend';

// 시드 기본 likes 위에 이 브라우저에서 누른 좋아요(store.reviewLikes)를 얹은 값이 실제 표시값이다
// (restaurants의 saved/visited가 store.marks로 오버라이드되는 것과 같은 구조)
function reviewLikeCount(r){
  return (r.likes || 0) + (store.reviewLikes[String(r.id)] || 0);
}

// 사용자가 남긴 리뷰(store.reviews)와 시드 더미 리뷰를 합쳐, 추천순(좋아요순)/최신순으로 정렬해 보여준다
function renderReviews(){
  reviewList.innerHTML = '';
  const merged = store.reviews.concat(reviews);
  const sorted = merged.slice().sort((a, b) => {
    if(currentReviewSort === 'latest') return (b.at || '').localeCompare(a.at || '');
    return reviewLikeCount(b) - reviewLikeCount(a);
  });
  sorted.forEach(r => {
    const liked = store.myLikedReviews.includes(String(r.id));
    // 리뷰는 이제 모두가 보는 공개 피드다 — "내 것"인지는 저장된 값이 아니라
    // 로그인한 계정과 작성자 user_id가 같은지로 그때그때 판단한다(시드 더미 리뷰는 userId가 없어 항상 false).
    const mine = isLoggedIn && !!r.userId && r.userId === currentUserId;
    const div = document.createElement('div');
    div.className = 'review-item';
    div.innerHTML = `
      <div class="review-avatar">${r.emoji}</div>
      <div class="review-body">
        <div class="review-top">
          <span class="review-name">${escapeHtml(r.name)}</span>
          <span class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span>
        </div>
        <div class="review-text">${escapeHtml(r.text)}</div>
        ${r.photo ? `<img class="review-photo" src="${r.photo}" alt="리뷰에 첨부된 사진">` : ''}
        <div class="review-meta-row">
          <span class="review-place">📍 ${escapeHtml(r.place)}</span>
          ${r.at ? `<span class="review-date">${escapeHtml(r.at)}</span>` : ''}
          <button type="button" class="review-like-btn ${liked ? 'liked' : ''}" data-id="${r.id}">👍 <span>${reviewLikeCount(r)}</span></button>
        </div>
        ${mine ? `<button type="button" class="review-delete-btn" data-id="${r.id}">내 리뷰 삭제</button>` : ''}
      </div>
    `;
    reviewList.appendChild(div);
  });
  // 좋아요: 로그인 게이트를 거치고, 이 브라우저 기준으로 on/off만 토글한다 (누가 눌렀는지는 추적하지 않음)
  reviewList.querySelectorAll('.review-like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if(!requireLogin('review')) return;
      const id = btn.dataset.id;
      const already = store.myLikedReviews.includes(id);
      if(already){
        store.myLikedReviews = store.myLikedReviews.filter(x => x !== id);
        store.reviewLikes[id] = (store.reviewLikes[id] || 0) - 1;
      } else {
        store.myLikedReviews.push(id);
        store.reviewLikes[id] = (store.reviewLikes[id] || 0) + 1;
      }
      saveState();
      renderReviews();
    });
  });
  // 내가 쓴 리뷰만 되돌릴 수 있게 삭제 버튼을 건다 (시드 더미 리뷰에는 애초에 버튼이 없다)
  reviewList.querySelectorAll('.review-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openConfirm({
        emoji:'↩️', title:'리뷰 삭제', text:'작성한 리뷰를 삭제하시겠습니까?', okLabel:'삭제', cancelLabel:'취소',
        onOk: () => {
          store.reviews = store.reviews.filter(rv => String(rv.id) !== id);
          saveState();
          pushReviewDelete(id);
          renderReviews();
          closeConfirm();
        }
      });
    });
  });
}
renderReviews();
// 로그인 여부와 무관한 공개 피드라 로그인 흐름과 별개로 페이지 진입 시 한 번 불러온다.
loadCommunityReviews();

reviewSortSelect.addEventListener('change', () => {
  currentReviewSort = reviewSortSelect.value;
  renderReviews();
});

// ---- Toast / popup (준비중 안내) ----
const toastContent = {
  save:{emoji:'🌾', title:'출시 예정이에요', text:'저장 기능은 곧 만나보실 수 있어요. 청년 농부가 부지런히 준비 중입니다!'},
  login:{emoji:'👤', title:'로그인 준비 중', text:'로그인하고 나만의 맛집 리스트를 관리하는 기능, 곧 만나보세요.'},
  mypage:{emoji:'📌', title:'마이페이지 준비 중', text:'방문 기록과 저장 목록을 한눈에 보는 마이페이지가 곧 열립니다.'},
  more:{emoji:'🍽️', title:'더 많은 맛집 준비 중', text:'9월 개강 후 현장 조사를 통해 더 많은 로컬 맛집을 채워나갈 예정이에요.'},
  info:{emoji:'🌾', title:'준비 중이에요', text:'해당 페이지는 곧 열릴 예정입니다.'},
  share:{emoji:'💬', title:'공유 기능 준비 중', text:'친구에게 공유하는 기능이 곧 추가됩니다. 지금은 링크 복사를 이용해보세요!'},
  locationDenied:{emoji:'📍', title:'위치 권한이 필요해요', text:'가까운 순으로 보려면 위치 권한을 허용해주세요.'},
  locationUnavailable:{emoji:'📍', title:'위치를 사용할 수 없어요', text:'이 브라우저나 기기에서는 위치 정보를 가져올 수 없어요.'},
};
const overlay = document.getElementById('toastOverlay');
function openToast(key){
  const c = toastContent[key] || toastContent.info;
  document.getElementById('toastEmoji').textContent = c.emoji;
  document.getElementById('toastTitle').textContent = c.title;
  document.getElementById('toastText').textContent = c.text;
  overlay.classList.add('show');
}
function closeToast(){ overlay.classList.remove('show'); }
function closeToastOnOverlay(e){ if(e.target === overlay) closeToast(); }

// ================= 확인 모달 (로그인 유도 + 액션 확인 공용) =================
// extra.md §1의 로그인 유도 팝업과 §2의 액션 확인 모달은 형태가 같아서 하나로 합쳐 쓴다.
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmBody = document.getElementById('confirmBody');

function openConfirm({emoji, title, text, okLabel, cancelLabel, onOk}){
  confirmBody.innerHTML = `
    <div class="confirm-head">
      <div class="emoji">${emoji}</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </div>
    <div class="game-action-row">
      ${cancelLabel ? `<button type="button" class="btn-ghost" style="flex:1;" id="confirmCancel">${cancelLabel}</button>` : ''}
      <button type="button" class="survey-close-btn" style="flex:1;" id="confirmOk">${okLabel}</button>
    </div>
  `;
  const cancelBtn = document.getElementById('confirmCancel');
  if(cancelBtn) cancelBtn.addEventListener('click', closeConfirm);
  document.getElementById('confirmOk').addEventListener('click', () => {
    if(typeof onOk === 'function') onOk();
    else closeConfirm();
  });
  confirmOverlay.classList.add('show');
}
function closeConfirm(){ confirmOverlay.classList.remove('show'); }

// 설문·게임처럼 여러 단계를 거치는 팝업은 닫는 순간 하던 게 사라진다. 한 번 물어본다.
// 확인창은 z-index:1100이라 다른 모달 위에 정상적으로 뜬다 (style.css).
function confirmDiscard(closeFn){
  openConfirm({
    emoji:'🤔',
    title: t('discardTitle') || '그만두시겠어요?',
    text:  t('discardBody')  || '지금까지 고른 내용은 저장되지 않아요.',
    okLabel: t('discardOk') || '그만두기',
    cancelLabel: t('discardCancel') || '계속하기',
    onOk: () => { closeConfirm(); closeFn(); }
  });
}
function closeConfirmOnOverlay(e){ if(e.target === confirmOverlay) closeConfirm(); }

// 로그인 필요한 동작 앞에 세우는 게이트. 통과하면 true, 아니면 유도 팝업을 띄우고 false.
function requireLogin(intent){
  if(isLoggedIn) return true;
  openConfirm({
    emoji:'👤',
    title:t('confirmLoginTitle') || '로그인이 필요해요',
    text:t('confirmLoginBody') || '로그인이 필요한 기능이에요. 로그인하고 나만의 맛집 목록을 만들어보세요!',
    okLabel:t('confirmLoginOk') || '로그인하기',
    cancelLabel:t('confirmLoginCancel') || '닫기',
    onOk: () => { closeConfirm(); openAuth(intent || 'login'); }
  });
  return false;
}

function copyLink(){
  navigator.clipboard.writeText(window.location.href).then(()=>{
    openToast('info');
    document.getElementById('toastTitle').textContent = '링크 복사 완료';
    document.getElementById('toastText').textContent = '친구에게 붙여넣어 공유해보세요!';
    document.getElementById('toastEmoji').textContent = '🔗';
  }).catch(()=> openToast('share'));
}

// ---- 주소·전화 원터치 복사 ----
// 주소/전화가 나오는 자리가 상세(예시 가게·실제 가게)와 실시간 검색 결과로 흩어져 있어서,
// 버튼 마크업(copyBtnHtml)과 복사 로직(copyText)을 각각 한 곳에만 둔다.
// 클릭은 document 위임 하나로 받는다 — 이 자리들은 전부 innerHTML로 매번 새로 그려져서,
// 렌더 함수마다 리스너를 다시 매다는 코드가 늘어나는 걸 막으려는 것.
// 복사할 원문은 data-copy 속성에 escapeHtml을 통과시켜 넣는다(따옴표까지 이스케이프된다).
// 정보 한 줄. 값이 없으면 줄 자체를 그리지 않고, 복사 대상인 줄(주소·전화)에는 복사 버튼이
// 자동으로 따라붙는다 — 나중에 데이터에 realPhone 같은 필드를 채워 넣기만 하면
// 화면에 줄이 생기면서 복사 버튼까지 같이 뜬다. 자리마다 손으로 붙이지 않기 위한 함수다.
function infoRowHtml(label, value, copyKey, copyKo){
  if(!value) return '';
  return `
      <div class="detail-info-row">
        <span class="detail-info-label">${label}</span>
        <span class="detail-info-val">${escapeHtml(String(value))}</span>
        ${copyKey ? copyBtnHtml(value, copyKey, copyKo) : ''}
      </div>`;
}

function copyBtnHtml(value, key, ko){
  if(!value) return '';
  const label = t(key) || ko;
  return `<button type="button" class="copy-btn" data-copy="${escapeHtml(String(value))}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">📋</button>`;
}

// 새 알림 UI를 만들지 않고 기존 토스트를 그대로 쓴다(copyLink()와 같은 방식).
function copyToast(ok){
  openToast('info');
  document.getElementById('toastEmoji').textContent = ok ? '📋' : '⚠️';
  document.getElementById('toastTitle').textContent = ok
    ? (t('copyOkTitle') || '복사했어요')
    : (t('copyFailTitle') || '복사하지 못했어요');
  document.getElementById('toastText').textContent = ok
    ? (t('copyOkBody') || '클립보드에 담았어요. 원하는 곳에 붙여넣어 보세요.')
    : (t('copyFailBody') || '브라우저가 복사를 막았어요. 글자를 직접 선택해서 복사해주세요.');
}

// navigator.clipboard는 보안 컨텍스트(https·localhost)에서만 동작한다.
// 사내망 IP나 file://로 열어보는 경우가 있어 execCommand 폴백을 하나만 남긴다.
function legacyCopy(text){
  try{
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }catch(e){ return false; }
}

function copyText(text){
  if(!text) return;
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(
      () => copyToast(true),
      () => copyToast(legacyCopy(text))   // 조용히 죽지 않게 실패도 반드시 알린다
    );
  } else {
    copyToast(legacyCopy(text));
  }
}

// 캡처 단계에 다는 게 핵심이다 — 모달 안쪽 .survey-box가 onclick="event.stopPropagation()"으로
// 버블링을 끊기 때문에, 버블 단계 위임으로는 상세 모달 안의 복사 버튼 클릭이 여기까지 오지 못한다.
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.copy-btn');
  if(!btn) return;
  e.preventDefault();
  copyText(btn.dataset.copy || '');
}, true);

// ---- Email signup ----
const signupEmailInput = document.getElementById('signupEmail');
const signupErrorEl = document.getElementById('signupError');

document.getElementById('signupForm').addEventListener('submit', function(e){
  e.preventDefault();
  const msg = document.getElementById('signupMsg');
  const value = signupEmailInput.value.trim();

  // 형식이 틀렸으면 성공 메시지를 띄우지 않는다. 이전에는 무엇을 넣든 "신청 완료!"가 떴다.
  if(!isEmail(value)){
    msg.style.display = 'none';
    signupErrorEl.textContent = t('signupErrEmail') || '이메일 주소 형식이 조금 이상한 것 같아요! 💌';
    signupEmailInput.classList.add('is-invalid');
    signupEmailInput.focus();
    return;
  }

  signupErrorEl.textContent = '';
  signupEmailInput.classList.remove('is-invalid');
  msg.style.display = 'block';
  this.reset();
});

// 다시 입력하기 시작하면 빨간 테두리와 안내를 걷어준다
signupEmailInput.addEventListener('input', () => {
  signupEmailInput.classList.remove('is-invalid');
  signupErrorEl.textContent = '';
  document.getElementById('signupMsg').style.display = 'none';
});

// ================= 방문 인증 (영수증·간판 사진 → AI 판정) =================
// 리뷰 작성은 "방문 완료" 표시를 관문으로 쓴다(openReviewForm). 그런데 방문 완료를 그냥 누르면
// 끝이라, 가보지도 않은 사람이 악성 리뷰를 남길 수 있었다. 그 앞에 이 인증을 한 번 세운다.
// visited를 켜는 곳은 bindFoodCardButtons() 한 군데뿐이라 관문도 한 곳이면 된다.
//
// 완전한 증명은 아니다 — 남의 영수증 사진도 통과할 수 있다. 억지력이고, 안내 문구도 그렇게 쓴다.
// 사진은 판정에만 쓰고 저장하지 않는다(리뷰 사진에서 겪은 용량 초과를 반복하지 않기 위해서다).
let visitVerifyTarget = null;
let visitVerifyPhoto = '';
let visitVerifyBusy = false;

function openVisitVerify(r){
  visitVerifyTarget = r;
  visitVerifyPhoto = '';
  visitVerifyBusy = false;
  renderVisitVerify();
  document.getElementById('visitVerifyOverlay').classList.add('show');
}
function closeVisitVerify(){
  document.getElementById('visitVerifyOverlay').classList.remove('show');
  visitVerifyTarget = null;
  visitVerifyPhoto = '';
  visitVerifyBusy = false;
}
// 판정이 도는 중에는 닫지 않는다. 사진을 이미 골랐으면 설문 이탈과 같은 확인창을 쓴다.
function requestCloseVisitVerify(){
  if(visitVerifyBusy) return;
  if(visitVerifyPhoto) confirmDiscard(closeVisitVerify);
  else closeVisitVerify();
}
function closeVisitVerifyOnOverlay(e){
  if(e.target === document.getElementById('visitVerifyOverlay')) requestCloseVisitVerify();
}

function renderVisitVerify(){
  const r = visitVerifyTarget;
  if(!r) return;
  const body = document.getElementById('visitVerifyBody');
  body.innerHTML = `
    <div class="auth-head">
      <div class="emoji">🧾</div>
      <h3>${t('visitVerifyTitle') || '방문 인증'}</h3>
      <p>${(t('visitVerifySub') || '{name}에 다녀오신 게 맞나요? 영수증이나 가게 간판 사진을 올려주세요.').replace('{name}', escapeHtml(rName(r)))}</p>
    </div>
    <p class="visit-verify-note">${t('visitVerifyNote') || '리뷰는 실제로 다녀온 곳에만 남길 수 있어요. 사진은 확인에만 쓰고 저장하지 않습니다.'}</p>
    <div class="auth-field">
      <label>${t('visitVerifyPhotoLabel') || '영수증 또는 간판 사진'}</label>
      <input type="file" id="visitVerifyInput" accept="image/*" capture="environment" class="review-file">
      <div id="visitVerifyPreview"></div>
    </div>
    <p class="auth-error" id="visitVerifyError"></p>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="requestCloseVisitVerify()">${t('closeBtn') || '닫기'}</button>
      <button type="button" class="survey-close-btn" style="flex:1;" id="visitVerifySubmit">${t('visitVerifySubmit') || '인증하기'}</button>
    </div>`;

  document.getElementById('visitVerifyInput').addEventListener('change', handleVisitVerifyPhoto);
  document.getElementById('visitVerifySubmit').addEventListener('click', submitVisitVerify);
}

function handleVisitVerifyPhoto(e){
  const file = e.target.files && e.target.files[0];
  const preview = document.getElementById('visitVerifyPreview');
  const err = document.getElementById('visitVerifyError');
  if(err) err.textContent = '';
  if(!file){ visitVerifyPhoto = ''; preview.innerHTML = ''; return; }
  readImageAsDataUrl(file).then(dataUrl => {
    visitVerifyPhoto = dataUrl;
    preview.innerHTML = `<img class="review-photo" src="${visitVerifyPhoto}" alt="${t('visitVerifyPreviewAlt') || '올린 인증 사진 미리보기'}">`;
  }).catch(() => {
    visitVerifyPhoto = '';
    preview.innerHTML = '';
    if(err) err.textContent = t('visitVerifyErrRead') || '사진을 읽지 못했어요. 다른 사진으로 다시 시도해주세요.';
  });
}

// 판정 실패 사유는 서버가 준 kind/nameMatch로 정한다.
// reason은 Gemini가 사이트 언어로 써주므로 한 줄 덧붙인다.
function visitVerifyFailMessage(data){
  if(data.kind === 'OTHER') return t('visitVerifyFailKind') || '영수증이나 가게 간판 사진으로 보이지 않아요.';
  return t('visitVerifyFailName') || '사진에서 이 가게의 이름을 확인하지 못했어요.';
}

async function submitVisitVerify(){
  if(visitVerifyBusy) return;
  const r = visitVerifyTarget;
  const err = document.getElementById('visitVerifyError');
  const btn = document.getElementById('visitVerifySubmit');
  if(!r) return;
  if(!visitVerifyPhoto){
    err.textContent = t('visitVerifyErrNoPhoto') || '먼저 사진을 올려주세요.';
    return;
  }

  visitVerifyBusy = true;
  err.textContent = '';
  btn.disabled = true;
  btn.textContent = t('visitVerifyChecking') || '확인하는 중...';

  try{
    const res = await fetch('/api/visit-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: r.name,
        address: (r.detail && r.detail.address) || r.realAddress || '',
        image: visitVerifyPhoto,
        lang: currentLang,
      }),
    });
    const data = await res.json().catch(() => ({}));
    visitVerifyBusy = false;
    btn.disabled = false;
    btn.textContent = t('visitVerifySubmit') || '인증하기';

    // 키가 없거나(500) 상류 실패(502)면 통과시키지 않는다 — 조용히 통과시키면 인증의 의미가 없다.
    if(!res.ok || data.error){
      err.textContent = t('visitVerifyErrServer') || '지금은 인증할 수 없어요. 잠시 후 다시 시도해주세요.';
      return;
    }
    if(!data.ok){
      err.textContent = visitVerifyFailMessage(data) + (data.reason ? ' (' + data.reason + ')' : '');
      return;
    }

    closeVisitVerify();
    // 통과하면 원래의 확인 모달 경로를 그대로 탄다(저장·pushMark·재렌더가 한 곳에 모여 있다).
    confirmMark(r, '✔️', t('confirmVisited') || '이 맛집을 방문 완료로 표시하시겠습니까?', () => { r.visited = true; });
  }catch(e){
    visitVerifyBusy = false;
    btn.disabled = false;
    btn.textContent = t('visitVerifySubmit') || '인증하기';
    err.textContent = t('visitVerifyErrServer') || '지금은 인증할 수 없어요. 잠시 후 다시 시도해주세요.';
  }
}

// ================= 알레르기 경고 =================
// 지금은 가게별 메뉴 데이터가 예시 1곳뿐이라(detail.menu) 메뉴 단위 판정을 할 수 없다.
// 그래서 카테고리와 상호에서 읽히는 "가능성"까지만 알린다. 메뉴가 채워지면(9월 현장 조사)
// detail.menu[].composition을 직접 훑는 2단계로 올린다.
//
// 문구는 반드시 "있을 수 있다"로 쓴다 — 틀린 알레르기 정보는 안전 문제라,
// 없는 걸 있다고 하는 것보다 있는 걸 없다고 하는 쪽이 훨씬 위험하다.
const ALLERGENS = ['shellfish','fish','milk','wheat','nuts','pork','beef','egg'];
const ALLERGEN_KO = {
  shellfish:'갑각류', fish:'생선·해산물', milk:'우유', wheat:'밀·글루텐',
  nuts:'견과류', pork:'돼지고기', beef:'소고기', egg:'계란',
};
// 한국어 주격조사는 앞 글자의 받침에 따라 갈린다("갑각류가" / "생선·해산물이").
// "이(가)"로 도망가면 경고문이 어색해져서 읽는 힘이 떨어진다.
function withSubjectParticle(word){
  const c = word.charCodeAt(word.length - 1);
  const hasBatchim = (c >= 0xAC00 && c <= 0xD7A3) && ((c - 0xAC00) % 28 !== 0);
  return word + (hasBatchim ? '이' : '가');
}
function allergenLabel(key){ return (currentLang === 'ko') ? ALLERGEN_KO[key] : (t('allergen_' + key) || ALLERGEN_KO[key]); }

// 카테고리에서 오는 기본 가능성 + 상호에 드러난 단서
const CAT_RISK = {
  일식:['fish','wheat'], 중식:['wheat'], 양식:['wheat','milk'],
  분식:['wheat'], 카페:['milk'], 한식:[],
};
const NAME_RISK = [
  [/짬뽕|해물|해산물|새우|게|킹크랩|랍스터/, ['shellfish','fish']],
  [/초밥|스시|회|생선|참치|연어/, ['fish']],
  [/라멘|우동|국수|칼국수|돈까스|파스타|피자|제과|베이커리|빵/, ['wheat']],
  [/카페|커피|라떼|로스터/, ['milk']],
  [/돼지|국밥|족발|보쌈|삼겹/, ['pork']],
  [/소고기|한우|갈비/, ['beef']],
];
function riskOf(r){
  const set = new Set(CAT_RISK[r.cat] || []);
  NAME_RISK.forEach(([re, keys]) => { if(re.test(r.name)) keys.forEach(k => set.add(k)); });
  return [...set];
}
// 사용자가 등록한 알레르기와 겹치는 것만 돌려준다
function allergyHits(r){
  const mine = store.allergies || [];
  if(mine.length === 0) return [];
  return riskOf(r).filter(k => mine.includes(k));
}

document.querySelectorAll('.map-chip').forEach(chip => {
  chip.addEventListener('click', () => setMapFilter(chip.dataset.mapcat));
});

// ---- 관리자 입구 (이용 분석) ----
// 이건 보안 장치가 아니다. 브라우저에 있는 값은 소스에 그대로 보인다.
// "링크를 눌러본 사람이 실수로 들어가는 것"을 막는 정도이고, 실제 방어선은
// GA 자체의 구글 계정 로그인이다. 진짜 접근 제어가 필요해지면 사장님 페이지와 함께
// 서버에서 역할(role)을 확인하는 방식으로 가야 한다(next.md C5).
const ADMIN_PASSPHRASE = 'JeaneeIsAGirl';
const ANALYTICS_URL = 'https://analytics.google.com/analytics/web/';

function openAdminGate(){
  openConfirm({
    emoji:'🔐',
    title:t('adminGateTitle') || '관리자 확인',
    text:t('adminGateBody') || '이용 분석 페이지로 이동합니다. 비밀번호를 입력해주세요.',
    okLabel:t('adminGateOk') || '들어가기',
    cancelLabel:t('closeBtn') || '닫기',
    onOk: submitAdminGate,
  });
  // 확인 모달에는 입력칸이 없어서 버튼 줄 앞에 하나 끼워 넣는다 —
  // 이것 하나 때문에 새 모달을 만들면 관리해야 할 오버레이만 늘어난다.
  const row = confirmBody.querySelector('.game-action-row');
  if(!row) return;
  row.insertAdjacentHTML('beforebegin',
    '<input type="password" id="adminPw" class="review-textarea" autocomplete="current-password" ' +
    'style="min-height:0;height:44px;margin-bottom:12px;" aria-label="' + (t('adminGateTitle') || '관리자 확인') + '">' +
    '<p class="auth-error" id="adminPwError"></p>');
  const input = document.getElementById('adminPw');
  input.focus();
  input.addEventListener('keydown', e => { if(e.key === 'Enter') submitAdminGate(); });
}

function submitAdminGate(){
  const input = document.getElementById('adminPw');
  const err = document.getElementById('adminPwError');
  if(!input) return;
  if(input.value !== ADMIN_PASSPHRASE){
    if(err) err.textContent = t('adminGateWrong') || '비밀번호가 맞지 않아요.';
    input.value = '';
    input.focus();
    return;
  }
  closeConfirm();
  window.open(ANALYTICS_URL, '_blank', 'noopener');
}

// ---- 전체화면 지도 위에 모달 띄우기 ----
// 브라우저는 전체화면 요소와 그 자손만 그린다. 모달은 <body> 바로 아래에 있어서
// 지도를 전체화면으로 보는 동안에는 z-index를 아무리 올려도 지도 뒤에 깔린다.
// 그래서 전체화면에 들어가면 오버레이들을 그 안으로 옮기고, 나오면 body로 되돌린다.
// (전체화면을 강제로 빠져나오게 하면 사용자가 넓게 보려던 의도를 꺾는다.)
const FULLSCREEN_MOVABLE = '.survey-overlay, .toast-overlay';
function relocateOverlays(){
  const host = document.fullscreenElement || document.webkitFullscreenElement || document.body;
  document.querySelectorAll(FULLSCREEN_MOVABLE).forEach(el => {
    if(el.parentElement !== host) host.appendChild(el);
  });
}
document.addEventListener('fullscreenchange', relocateOverlays);
// 사파리는 접두사 붙은 이벤트를 쓴다
document.addEventListener('webkitfullscreenchange', relocateOverlays);

// ================= 이용 분석 (GA4) =================
// 측정 ID는 비밀값이 아니다 — 모든 방문자의 페이지 소스에 그대로 보인다.
// 비워두면 계측이 통째로 꺼지고 사이트는 지금과 똑같이 동작한다(측정 ID를 받기 전 상태).
const GA_MEASUREMENT_ID = 'G-EV1JDZ5WGD';

// 이벤트를 보내는 코드는 이 함수 밖에 두지 않는다. 나중에 GA를 끄거나 자체 수집(Supabase)으로
// 옮길 때 고칠 곳이 한 군데가 된다 — loadState/saveState가 저장소를 독점하는 것과 같은 구조.
// 개인 식별 정보는 절대 넘기지 않는다: 이메일·이름·사용자 id 금지, 가게 id/카테고리/언어 코드만.
function track(name, params){
  if(typeof window.gtag !== 'function') return;   // 측정 ID 없음 · CDN 차단 · 광고 차단기
  try{ window.gtag('event', name, params || {}); }catch(e){ /* 계측 실패가 기능 실패가 되면 안 된다 */ }
}

function initAnalytics(){
  if(!GA_MEASUREMENT_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // allow_google_signals:false — 광고·인구통계 데이터를 받지 않는다. 이 사이트에 필요 없고,
  // 켜두면 방문자가 적을 때 GA가 행을 가려버려서(데이터 임계값) 오히려 리포트가 비어 보인다.
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip:true, allow_google_signals:false });

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  observeSections();
  observeScrollDepth();
  observeWebVitals();
}

// ---- 섹션별 체류 시간 ----
// 스크롤할 때마다 보내면 이벤트가 폭증해서 리포트를 못 쓴다.
// 화면에 들어온 시각만 기억했다가 벗어날 때 한 번, 페이지를 떠날 때 한 번 보낸다.
function observeSections(){
  if(!('IntersectionObserver' in window)) return;
  const since = new Map();
  const flush = (el) => {
    const t0 = since.get(el);
    if(t0 === undefined) return;
    since.delete(el);
    const sec = Math.round((Date.now() - t0) / 1000);
    if(sec >= 2) track('section_view', { section: el.id || 'hero', seconds: sec });  // 스쳐 지나간 건 버린다
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting) since.set(en.target, Date.now());
      else flush(en.target);
    });
  }, { threshold: 0.5 });   // 절반 이상 보일 때만 "보고 있다"로 친다
  document.querySelectorAll('section').forEach(el => io.observe(el));
  // 탭을 덮거나 페이지를 떠나도 마지막 구간이 남지 않게 한다
  const flushAll = () => document.querySelectorAll('section').forEach(flush);
  document.addEventListener('visibilitychange', () => { if(document.hidden) flushAll(); });
  window.addEventListener('pagehide', flushAll);
}

// ---- 스크롤 깊이 ----
// GA4 기본 계측은 90% 하나뿐이라 어디서 멈추는지 알 수 없다. 구간을 나눠 한 번씩만 보낸다.
function observeScrollDepth(){
  const marks = [25, 50, 75, 100];
  const sent = new Set();
  let ticking = false;
  const check = () => {
    ticking = false;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if(h <= 0) return;
    const pct = Math.min(100, Math.round((window.scrollY / h) * 100));
    marks.forEach(m => { if(pct >= m && !sent.has(m)){ sent.add(m); track('scroll_depth', { percent: m }); } });
  };
  window.addEventListener('scroll', () => {
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(check);   // 스크롤마다 계산하면 프레임이 깎인다
  }, { passive: true });
}

// ---- Core Web Vitals ----
// 실무에서 페이지 품질을 볼 때 쓰는 지표다. web-vitals 라이브러리를 들이지 않고
// (이 저장소는 의존성이 없다) 브라우저 내장 PerformanceObserver로 LCP·CLS만 잰다.
function observeWebVitals(){
  if(!('PerformanceObserver' in window)) return;
  let lcp = 0, cls = 0;
  try{
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      lcp = Math.round(entries[entries.length - 1].startTime);
    }).observe({ type:'largest-contentful-paint', buffered:true });
    new PerformanceObserver(list => {
      list.getEntries().forEach(en => { if(!en.hadRecentInput) cls += en.value; });
    }).observe({ type:'layout-shift', buffered:true });
  }catch(e){ return; }   // 사파리 등 미지원 브라우저
  // 값이 확정되는 건 페이지를 떠날 때다 — 그때 한 번만 보낸다
  window.addEventListener('pagehide', () => {
    if(lcp) track('web_vitals', { metric:'LCP', value: lcp });
    track('web_vitals', { metric:'CLS', value: Math.round(cls * 1000) / 1000 });
  }, { once:true });
}

initAnalytics();

// ---- 글로벌 내비 (모바일 햄버거) ----
// 모달이 아니라 헤더에 붙는 패널이라 .survey-overlay 구조를 쓰지 않는다.
// 링크를 누르면 바로 닫는다 — 같은 페이지 앵커라 패널이 남아 있으면 도착지를 가린다.
function setNavPanel(open){
  const panel = document.getElementById('navPanel');
  const btn = document.getElementById('navToggle');
  if(!panel || !btn) return;
  panel.hidden = !open;
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function toggleNavPanel(){
  const panel = document.getElementById('navPanel');
  if(panel) setNavPanel(panel.hidden);
}
(function bindNav(){
  const btn = document.getElementById('navToggle');
  const panel = document.getElementById('navPanel');
  if(!btn || !panel) return;
  btn.addEventListener('click', e => { e.stopPropagation(); toggleNavPanel(); });
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNavPanel(false)));
  document.addEventListener('click', e => {
    if(!panel.hidden && !panel.contains(e.target) && e.target !== btn) setNavPanel(false);
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden) setNavPanel(false); });
})();

// ---- 다크모드 ----
// 색은 style.css의 html.dark 한 블록에서 토큰만 갈아끼운다. 여기서 하는 일은
// 클래스 토글 + 저장 + "토큰을 CSS 밖에서 읽어 쓰는 것들"(지도 타일·핀·썸네일) 갱신뿐이다.
// 구글 지도는 CSS 밖이라 styles를 직접 넘겨야 한다 — 안 그러면 지도만 하얗게 튄다.
const MAP_DARK_STYLES = [
  { elementType:'geometry', stylers:[{color:'#212a35'}] },
  { elementType:'labels.text.stroke', stylers:[{color:'#212a35'}] },
  { elementType:'labels.text.fill', stylers:[{color:'#9fb4cc'}] },
  { featureType:'poi', elementType:'labels.text.fill', stylers:[{color:'#8ea3b8'}] },
  { featureType:'poi.park', elementType:'geometry', stylers:[{color:'#26362c'}] },
  { featureType:'road', elementType:'geometry', stylers:[{color:'#2f3a47'}] },
  { featureType:'road', elementType:'labels.text.fill', stylers:[{color:'#9aafc4'}] },
  { featureType:'road.highway', elementType:'geometry', stylers:[{color:'#3d4a5a'}] },
  { featureType:'transit', elementType:'geometry', stylers:[{color:'#2b3540'}] },
  { featureType:'water', elementType:'geometry', stylers:[{color:'#17222e'}] },
  { featureType:'water', elementType:'labels.text.fill', stylers:[{color:'#5c7a9b'}] },
];

function isDarkTheme(){
  if(store.theme) return store.theme === 'dark';
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

// 저장·재렌더까지 한 번에 맡는다(applyLanguage()와 같은 모양). 테마를 바꾸는 곳은 여기 하나다.
function applyTheme(){
  const dark = isDarkTheme();
  document.documentElement.classList.toggle('dark', dark);
  const btn = document.getElementById('themeToggle');
  if(btn) btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  if(typeof gmap !== 'undefined' && gmap){
    gmap.setOptions({ styles: dark ? MAP_DARK_STYLES : [] });
    if(typeof renderMarkers === 'function') renderMarkers();  // 핀 색도 토큰을 다시 읽게 한다
  }
  if(typeof renderCards === 'function') renderCards();
  if(typeof renderExampleCards === 'function') renderExampleCards();
}

function toggleTheme(){
  store.theme = isDarkTheme() ? 'light' : 'dark';
  track('theme_change', { mode: store.theme });
  saveState();
  applyTheme();
}

// ---- Big text mode ----
function toggleBigText(){
  const on = document.documentElement.classList.toggle('big-text');
  const btn = document.querySelector('.a11y-toggle');
  if(btn) btn.textContent = on ? '🔍 기본 글씨로' : '🔍 큰글씨 모드';
}

// 헤더 통합검색은 파일 하단 "통합 검색" 섹션에서 처리한다.

// ================= 취향 설문 (실제 동작) =================
const surveyQuestions = [
  {
    key:'spice',
    title:'매운맛은 어느 정도가 좋아요?', titleEn:'How spicy do you like it?', titleZh:'你喜欢多辣的口味？', titleEs:'¿Qué tan picante te gusta?', titleFr:'Vous aimez ça piquant comment ?', titleDe:'Wie scharf magst du es?', titleJa:'辛さはどのくらいがお好みですか？',
    sub:'취향에 맞는 맛집을 찾는 데 참고할게요', subEn:"We'll use this to find restaurants that match your taste", subZh:'我们会据此为你寻找符合口味的餐厅', subEs:'Usaremos esto para encontrar restaurantes que combinen con tu gusto', subFr:"Nous nous en servirons pour trouver des restaurants à votre goût", subDe:'Das hilft uns, Restaurants zu finden, die zu deinem Geschmack passen', subJa:'あなたの好みに合うお店を探すために参考にします',
    options:['안 매운 게 좋아요','보통이 좋아요','매콤한 게 좋아요','아주 매워야 해요'],
    optionsEn:['Not spicy at all','A little spicy is fine','I like it spicy','Has to be very spicy'],
    optionsZh:['完全不辣', '微辣就好', '喜欢辣一点', '必须非常辣'],
    optionsEs:['Nada picante', 'Un poco picante está bien', 'Me gusta picante', 'Tiene que ser muy picante'],
    optionsFr:['Pas piquant du tout', 'Un peu piquant, ça va', "J'aime quand ça pique", 'Il faut que ça brûle'],
    optionsDe:['Gar nicht scharf', 'Ein bisschen Schärfe ist okay', 'Ich mag es scharf', 'Es muss richtig scharf sein'],
    optionsJa:['辛くないほうがいい', '普通がいい', '辛めが好き', 'とても辛くないと']
  },
  {
    key:'cat',
    title:'어떤 음식이 제일 끌리세요?', titleEn:'What kind of food sounds best?', titleZh:'你最想吃哪种类型的食物？', titleEs:'¿Qué tipo de comida te apetece más?', titleFr:"Quel type de cuisine vous tente le plus ?", titleDe:'Welche Art von Essen reizt dich am meisten?', titleJa:'どんな料理に一番惹かれますか？',
    sub:'가장 자주 생각나는 카테고리를 골라주세요', subEn:'Pick the category you crave most often', subZh:'请选择你最常想到的类型', subEs:'Elige la categoría que más se te antoja', subFr:"Choisissez la catégorie qui vous vient le plus souvent à l'esprit", subDe:'Wähle die Kategorie, auf die du am häufigsten Lust hast', subJa:'一番よく食べたくなるジャンルを選んでください',
    options:['한식','양식','중식','일식','분식'],
    optionsEn:['Korean','Western','Chinese','Japanese','Snacks'],
    optionsZh:['韩餐','西餐','中餐','日料','小吃'],
    optionsEs:['Coreana', 'Occidental', 'China', 'Japonesa', 'Bocadillos'],
    optionsFr:['Coréen', 'Occidental', 'Chinois', 'Japonais', 'Snacks'],
    optionsDe:['Koreanisch', 'Westlich', 'Chinesisch', 'Japanisch', 'Snacks'],
    optionsJa:['韓食', '洋食', '中華', '和食', '軽食']
  },
  {
    key:'budget',
    title:'한 끼 예산은 어느 정도가 좋아요?', titleEn:"What's your budget for a meal?", titleZh:'你一餐的预算大概是多少？', titleEs:'¿Cuál es tu presupuesto para una comida?', titleFr:'Quel budget pour un repas ?', titleDe:'Wie hoch ist dein Budget für eine Mahlzeit?', titleJa:'1食の予算はどのくらいがいいですか？',
    sub:'가성비에 맞는 곳부터 보여드릴게요', subEn:"We'll show you great-value spots first", subZh:'我们会优先展示性价比高的地方', subEs:'Te mostraremos primero los lugares con mejor relación calidad-precio', subFr:"Nous vous montrerons d'abord les meilleurs rapports qualité-prix", subDe:'Wir zeigen dir zuerst Orte mit gutem Preis-Leistungs-Verhältnis', subJa:'コスパの良いお店から優先的にご紹介します',
    options:['₩ 가볍게','₩₩ 넉넉하게'],
    optionsEn:['₩ Light meal','₩₩ Generous meal'],
    optionsZh:['₩ 简单一餐','₩₩ 丰盛一餐'],
    optionsEs:['₩ Comida ligera', '₩₩ Comida abundante'],
    optionsFr:['₩ Repas léger', '₩₩ Repas copieux'],
    optionsDe:['₩ Leichte Mahlzeit', '₩₩ Reichhaltige Mahlzeit'],
    optionsJa:['₩ 軽めに', '₩₩ たっぷりと']
  },
];
const priceMap = {'₩ 가볍게':'₩', '₩₩ 넉넉하게':'₩₩'};

let surveyStep = 0;
const surveyAnswers = {};
const surveyOverlay = document.getElementById('surveyOverlay');
const surveyBody = document.getElementById('surveyBody');
const surveyProgress = document.getElementById('surveyProgress');

function openSurvey(){
  surveyStep = 0;
  Object.keys(surveyAnswers).forEach(k => delete surveyAnswers[k]);
  renderSurvey();
  surveyOverlay.classList.add('show');
}
function closeSurvey(){ surveyOverlay.classList.remove('show'); }

// X와 배경 클릭은 같은 길로 나가야 한다 — 한쪽만 물어보면 규칙이 둘로 갈라진다.
// 아무것도 안 골랐거나 이미 결과 화면이면 그냥 닫는다.
function requestCloseSurvey(){
  const inProgress = Object.keys(surveyAnswers).length > 0 && surveyStep < surveyQuestions.length;
  if(inProgress) confirmDiscard(closeSurvey);
  else closeSurvey();
}
function closeSurveyOnOverlay(e){ if(e.target === surveyOverlay) requestCloseSurvey(); }

function renderSurvey(){
  const totalDots = surveyQuestions.length + 1;
  surveyProgress.innerHTML = Array.from({length:totalDots}).map((_,i) =>
    `<span class="${i <= surveyStep ? 'done':''}"></span>`
  ).join('');

  if(surveyStep < surveyQuestions.length){
    const q = surveyQuestions[surveyStep];
    const picked = surveyAnswers[q.key];
    const qTitle = (currentLang === 'en' && q.titleEn) ? q.titleEn : (currentLang === 'zh' && q.titleZh) ? q.titleZh : (currentLang === 'es' && q.titleEs) ? q.titleEs : (currentLang === 'fr' && q.titleFr) ? q.titleFr : (currentLang === 'de' && q.titleDe) ? q.titleDe : (currentLang === 'ja' && q.titleJa) ? q.titleJa : q.title;
    const qSub = (currentLang === 'en' && q.subEn) ? q.subEn : (currentLang === 'zh' && q.subZh) ? q.subZh : (currentLang === 'es' && q.subEs) ? q.subEs : (currentLang === 'fr' && q.subFr) ? q.subFr : (currentLang === 'de' && q.subDe) ? q.subDe : (currentLang === 'ja' && q.subJa) ? q.subJa : q.sub;
    const qOptions = (currentLang === 'en' && q.optionsEn) ? q.optionsEn : (currentLang === 'zh' && q.optionsZh) ? q.optionsZh : (currentLang === 'es' && q.optionsEs) ? q.optionsEs : (currentLang === 'fr' && q.optionsFr) ? q.optionsFr : (currentLang === 'de' && q.optionsDe) ? q.optionsDe : (currentLang === 'ja' && q.optionsJa) ? q.optionsJa : q.options;
    surveyBody.innerHTML = `
      <div class="survey-step">
        <h3>${qTitle}</h3>
        <p class="step-sub">${qSub}</p>
        <div class="survey-options">
          ${q.options.map((opt,i) => `
            <button type="button" class="survey-option ${picked === opt ? 'selected':''}" data-opt="${opt}">${qOptions[i]}</button>
          `).join('')}
        </div>
        <div class="survey-nav">
          ${surveyStep > 0 ? `<button type="button" class="survey-back" id="surveyBackBtn">${t('surveyPrev') || '이전'}</button>` : `<span></span>`}
          <button type="button" class="survey-next" id="surveyNextBtn" ${picked ? '' : 'disabled'}>${surveyStep === surveyQuestions.length - 1 ? (t('surveyResult')||'결과 보기') : (t('surveyNext')||'다음')}</button>
        </div>
      </div>
    `;
    surveyBody.querySelectorAll('.survey-option').forEach(btn => {
      btn.addEventListener('click', () => {
        surveyAnswers[q.key] = btn.dataset.opt;
        renderSurvey();
      });
    });
    const backBtn = document.getElementById('surveyBackBtn');
    if(backBtn) backBtn.addEventListener('click', () => { surveyStep--; renderSurvey(); });
    document.getElementById('surveyNextBtn').addEventListener('click', () => { surveyStep++; renderSurvey(); });
  } else {
    const picks = getSurveyRecommendations();
    surveyBody.innerHTML = `
      <div class="survey-step">
        <h3>${t('surveyResultTitle') || '이런 맛집은 어때요?'}</h3>
        <p class="step-sub">${t('surveyResultSub') || '취향에 맞춰 골라본 로컬 맛집이에요'}</p>
        <div class="survey-result-list">
          ${picks.map(r => `
            <div class="survey-result-card">
              <span class="emoji">${r.emoji}</span>
              <div class="info">
                <strong>${rName(r)}</strong>
                <span>${rCat(r)} · ${ratingLabel(r)} · ${rDesc(r)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <button type="button" class="survey-close-btn" id="surveyDoneBtn">${t('confirmOk') || '확인'}</button>
      </div>
    `;
    document.getElementById('surveyDoneBtn').addEventListener('click', closeSurvey);
  }
}

function getSurveyRecommendations(){
  const wantCat = surveyAnswers.cat;
  const wantPrice = priceMap[surveyAnswers.budget];
  let pool = restaurants.filter(r => r.cat === wantCat);
  if(pool.length === 0) pool = restaurants.slice();

  const priceMatched = pool.filter(r => r.price === wantPrice);
  const finalPool = priceMatched.length > 0 ? priceMatched : pool;

  return finalPool.slice().sort((a,b) => b.rating - a.rating).slice(0,3);
}

// ================= 가게 상세 정보 =================
const detailOverlay = document.getElementById('detailOverlay');
const detailBody = document.getElementById('detailBody');

// 언어를 바꿨을 때 열려 있는 상세를 다시 그리려면 어느 가게였는지 알아야 한다.
let currentDetailIdx = -1;
// 한 번 확인한 가게는 이 방문 동안 다시 묻지 않는다(저장하지 않는다 —
// 다음에 올 때는 다시 알려주는 편이 안전하다).
const allergyAcked = new Set();
function openDetail(idx){
  const hits = allergyHits(restaurants[idx]);
  if(hits.length > 0 && !allergyAcked.has(restaurants[idx].id)){
    const names = hits.map(allergenLabel).join(', ');
    const listText = (currentLang === 'ko') ? withSubjectParticle(names) : names;
    openConfirm({
      emoji:'⚠️',
      title:t('allergyWarnTitle') || '잠깐! 확인하고 가세요',
      text:(t('allergyWarnBody') || '{list} 들어간 메뉴가 있을 수 있어요. 주문 전에 사장님께 꼭 확인해주세요.').replace('{list}', listText),
      okLabel:t('allergyWarnOk') || '알겠어요, 볼게요',
      cancelLabel:t('confirmNo') || '아니요',
      onOk: () => { allergyAcked.add(restaurants[idx].id); closeConfirm(); openDetail(idx); },
    });
    return;
  }
  const r = restaurants[idx];
  currentDetailIdx = idx;
  // GA4 권장 이벤트명을 그대로 쓴다 — 커스텀 이름과 달리 기본 리포트가 알아서 집계해준다
  track('view_item', { items:[{ item_id:r.id, item_name:r.name, item_category:r.cat }] });
  detailBody.innerHTML = r.detail ? renderFullDetail(r) : renderStubDetail(r);
  detailOverlay.classList.add('show');
  if(r.lat && r.lng) loadGoogleReviews(r);
}
function closeDetail(){ detailOverlay.classList.remove('show'); }
function closeDetailOnOverlay(e){ if(e.target === detailOverlay) closeDetail(); }

function renderStubDetail(r){
  const isKo = currentLang === 'ko';
  // 현장 조사로 realPhone 같은 값이 채워지면 줄과 복사 버튼이 자동으로 생긴다.
  const infoRows = [
    infoRowHtml(t('detailAddress') || '📍 주소', r.realAddress, 'copyAddressBtn', '주소 복사'),
    infoRowHtml(t('detailPhone') || '☎️ 전화', r.realPhone, 'copyPhoneBtn', '전화번호 복사'),
  ].join('');
  return `
    <div class="detail-head">
      <span class="detail-emoji">${r.emoji}</span>
      <div>
        <span class="food-cat">${rCat(r)}</span>
        <h3>${rName(r)}</h3>
        <div class="detail-rating" id="detailRatingLabel">${ratingLabel(r)} · ${r.price}</div>
      </div>
    </div>
    <p class="detail-desc">${rDesc(r)}</p>
    <div id="aiSummaryBody" class="ai-summary-body"></div>
    ${infoRows ? `<div class="detail-info-grid">${infoRows}</div>` : ''}
    ${r.realAddress ? renderMapFocusLink(r) : ''}
    <div class="detail-stub-note">
      ${isKo
        ? `<strong>상세 정보 준비 중</strong> — ${r.realAddress ? '영업시간·메뉴 구성·원산지' : '주소·영업시간·메뉴 구성·원산지'} 같은 상세 정보는 9월 현장 조사 후 채워질 예정이에요. 예시로 <b>${escapeHtml(rName(restaurants[0]))}</b> 카드에서 어떤 정보가 담길지 미리 확인해보세요.`
        : `<strong>${t('detailStubTitle')}</strong> — ${r.realAddress ? t('detailStubBodyPartial') : t('detailStubBodyFull')}${t('detailStubBody')}`}
    </div>
    ${r.lat && r.lng ? renderGoogleReviewShell() : ''}
    <button type="button" class="survey-close-btn" onclick="closeDetail()">${t('closeBtn') || '닫기'}</button>
  `;
}

function renderFullDetail(r){
  const d = r.detail;
  const infoRows = [
    infoRowHtml(t('detailAddress') || '📍 주소', d.address, 'copyAddressBtn', '주소 복사'),
    infoRowHtml(t('detailHours') || '🕐 영업시간', d.hours),
    infoRowHtml(t('detailClosed') || '🚫 휴무일', d.closed),
    infoRowHtml(t('detailPhone') || '☎️ 전화', d.phone, 'copyPhoneBtn', '전화번호 복사'),
    infoRowHtml(t('detailReservation') || '📅 예약', d.reservation),
    infoRowHtml(t('detailCapacity') || '🪑 수용 인원', d.capacity),
    infoRowHtml(t('detailParking') || '🚗 주차', d.parking),
    infoRowHtml(t('detailMobilePay') || '📱 모바일페이', d.mobilePay),
    infoRowHtml(t('detailVouchers') || '🎟️ 상품권/식권', d.vouchers),
  ].join('');
  return `
    <div class="detail-head">
      <span class="detail-emoji">${r.emoji}</span>
      <div>
        <span class="food-cat">${rCat(r)}</span>
        <h3>${rName(r)}</h3>
        <div class="detail-rating" id="detailRatingLabel">${ratingLabel(r)} · ${r.price}</div>
      </div>
    </div>
    <p class="detail-desc">${rDesc(r)}</p>
    <div id="aiSummaryBody" class="ai-summary-body"></div>

    <div class="detail-info-grid">${infoRows}</div>
    ${renderMapFocusLink(r)}

    <h4 class="detail-menu-title">${t('detailMenuTitle') || '메뉴'}</h4>
    <div class="detail-menu-list">
      ${d.menu.map(m => `
        <div class="detail-menu-item">
          <div class="detail-menu-top">
            <span class="detail-menu-name">${m.name}</span>
            <span class="detail-menu-price">${m.price}</span>
          </div>
          <div class="detail-menu-comp">${m.composition}</div>
          <div class="detail-menu-origin">${t('detailOrigin') || '원산지: '}${m.origin}</div>
        </div>
      `).join('')}
    </div>
    ${d.isExample ? `<p class="detail-example-note">${t('detailExampleNote') || '* 예시로 채워둔 상세 정보이며, 실제 데이터는 현장 조사 후 반영됩니다.'}</p>` : ''}
    ${r.lat && r.lng ? renderGoogleReviewShell() : ''}
    <button type="button" class="survey-close-btn" onclick="closeDetail()">${t('closeBtn') || '닫기'}</button>
  `;
}

// 길찾기(외부 지도 앱 이동)·텍스트 경로 미리보기는 걷어내고, 사이트 안 지도 섹션으로
// 이동해 마커를 보여주는 쪽으로 통일했다(버튼 자체는 focusMapMarker, script.js 상단 지도
// 블록에 있다 — CLAUDE.md 원칙대로 마커 관련 로직은 지도 블록 한 곳에 둔다).
function renderMapFocusLink(r){
  if(!(r.lat && r.lng)){
    return `<p class="detail-example-note">${t('detailNoLocationNote') || '🧭 예시로 채워둔 데이터라 아직 위치 정보가 없어서 지도에서 볼 수 없어요.'}</p>`;
  }
  return `<button type="button" class="detail-directions" onclick="focusMapMarker('${r.id}')">${t('detailMapFocus') || '🗺️ 지도에서 위치 보기'}</button>`;
}

// ---- 구글 리뷰 (Places API New, /api/google-reviews 경유) ----
// #aiSummaryBody는 이 껍데기 안이 아니라 상세 모달 상단(설명 바로 아래)에 있다 —
// 요약을 보려고 리뷰 목록까지 스크롤해 내려가지 않도록.
function renderGoogleReviewShell(){
  return `
    <div class="detail-google-section">
      <h4 class="detail-menu-title">${t('googleReviewTitle') || '구글 리뷰'}</h4>
      <div id="googleReviewBody" class="google-review-body">
        <div class="google-review-loading">${t('googleReviewLoading') || '리뷰를 불러오는 중...'}</div>
      </div>
    </div>`;
}

async function loadGoogleReviews(r){
  const box = document.getElementById('googleReviewBody');
  if(!box) return;
  const cached = store.googleReviews[googleCacheKey(r.name)];
  if(isFreshGoogle(cached)){ box.innerHTML = renderGoogleReviewContent(cached.data); refreshRatingLabels(r); loadReviewAnalysis(r, cached.data); return; }
  try{
    const url = `/api/google-reviews?name=${encodeURIComponent(r.name)}&lat=${r.lat}&lng=${r.lng}&lang=${mapsLanguage()}`;
    const res = await fetch(url);
    const data = await res.json();
    // 모달을 닫았다 다른 가게를 열었으면 detailBody가 이미 교체돼 이 컨테이너는 더 이상 문서에 없다
    if(document.getElementById('googleReviewBody') !== box) return;
    box.innerHTML = renderGoogleReviewContent(data);
    // 성공만 캐시한다 — pruneGoogleCache() 주석 참고
    if(data.found){ store.googleReviews[googleCacheKey(r.name)] = { data, fetchedAt: Date.now() }; saveState(); }
    refreshRatingLabels(r);
    loadReviewAnalysis(r, data);
  }catch(e){
    if(document.getElementById('googleReviewBody') === box){
      box.innerHTML = `<div class="google-review-error">${t('googleReviewError') || '리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'}</div>`;
    }
  }
}

// ---- AI 리뷰 요약 (/api/review-analysis 경유, 구글 리뷰가 있을 때만 시도) ----
// GEMINI_API_KEY가 서버에 없으면 500이 오는데, 그 경우 아무것도 그리지 않고 조용히 건너뛴다 —
// 지도(config.js 없음)·구글 리뷰(CDN 막힘)와 같은 관례를 따른다.
async function loadReviewAnalysis(r, googleData){
  const reviews = (googleData && googleData.found && googleData.reviews) || [];
  if(reviews.length === 0) return;
  const box = document.getElementById('aiSummaryBody');
  if(!box) return;

  // 요약은 사이트 언어로 나오므로 캐시도 언어별로 따로 잡는다 —
  // 키가 가게 이름 하나면 한국어로 받아둔 요약이 영어 화면에도 그대로 남는다.
  const cacheKey = r.name + '|' + currentLang;
  const cached = store.reviewAnalysis[cacheKey];
  if(cached){ box.innerHTML = renderReviewAnalysisContent(cached.data); return; }

  // 요약은 모델 응답을 기다려야 해서 몇 초씩 걸린다. 그동안 빈 칸이면 기능이 없는 것처럼 보여서
  // (실제로 "요약이 안 뜬다"로 읽혔다) 자리를 잡아두고 불러오는 중임을 알린다.
  box.innerHTML = `<div class="ai-summary-card is-loading">${t('aiSummaryLoading') || '🤖 AI가 리뷰를 요약하는 중...'}</div>`;

  try{
    const res = await fetch('/api/review-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // id(슬러그)는 서버 공용 캐시의 키다 — 가게 이름은 바뀔 수 있어서 이름으로 잡지 않는다.
      body: JSON.stringify({ id: r.id, name: r.name, lang: currentLang, reviews: reviews.map(rv => ({ text: rv.text, rating: rv.rating })) }),
    });
    const data = await res.json();
    if(document.getElementById('aiSummaryBody') !== box) return;  // 그 사이 다른 가게를 열었다
    if(!data.found){ box.innerHTML = ''; return; } // 키 없음/실패 — 섹션을 그냥 비워둔다
    box.innerHTML = renderReviewAnalysisContent(data);
    store.reviewAnalysis[cacheKey] = { data, fetchedAt: Date.now() };
    saveState();
  }catch(e){
    // 조용히 건너뛴다 — AI 요약은 부가 기능이라 실패해도 상세 모달의 나머지는 그대로 동작해야 한다
    if(document.getElementById('aiSummaryBody') === box) box.innerHTML = '';
  }
}

function renderReviewAnalysisContent(data){
  const chips = (data.keywords || []).map(k => `
    <span class="ai-summary-chip ${k.sentiment === 'NEGATIVE' ? 'is-negative' : 'is-positive'}">${escapeHtml(k.label)}</span>
  `).join('');
  return `
    <div class="ai-summary-card">
      <div class="ai-summary-head">🤖 ${t('aiSummaryTitle') || 'AI 리뷰 요약'}</div>
      <p class="ai-summary-text">${escapeHtml(data.summary)}</p>
      ${chips ? `<div class="ai-summary-chips">${chips}</div>` : ''}
    </div>`;
}

function renderGoogleReviewContent(data){
  if(!data || !data.found){
    return `<div class="google-review-empty">${t('googleReviewNotFound') || '😢 구글 지도에서 이 가게를 찾지 못했습니다.'}</div>`;
  }
  const reviewsHtml = (data.reviews || []).map(rv => `
    <div class="review-item">
      <div class="review-avatar">👤</div>
      <div class="review-body">
        <div class="review-top">
          <span class="review-name">${escapeHtml(rv.author || (t('googleReviewAnon') || '익명'))}</span>
          <span class="review-stars">${'★'.repeat(rv.rating||0)}${'☆'.repeat(5-(rv.rating||0))}</span>
        </div>
        <div class="review-text">${escapeHtml(rv.text || '')}</div>
        <div class="review-meta-row"><span class="review-date">${escapeHtml(rv.relativeTime || '')}</span></div>
      </div>
    </div>`).join('') || `<p class="google-review-none">${t('googleReviewNone') || '아직 등록된 리뷰가 없어요.'}</p>`;

  return `
    <div class="google-review-summary detail-rating">★ ${data.rating ?? '-'} (${data.reviewCount ?? 0})</div>
    <div class="review-list">${reviewsHtml}</div>
    ${data.mapsUri ? `<a class="google-review-link" href="${escapeHtml(data.mapsUri)}" target="_blank" rel="noopener">${t('googleReviewLink') || '구글 맵에서 전체 리뷰 보기 →'}</a>` : ''}
  `;
}

// ================= 미니 지도 (Google Maps JavaScript API) =================
// 키는 config.js(.gitignore)에서만 오고, 여기서는 MAPS_KEY 변수로만 쓴다.
// 마커는 AdvancedMarkerElement가 아니라 google.maps.Marker를 쓴다 — AdvancedMarker는 Map ID를
// 필수로 요구해서 키 외에 리소스를 하나 더 발급해야 하기 때문이다. 이쪽은 키 하나로 끝난다.
const CAMPUS_CENTER = { lat: 36.6109529892437, lng: 127.286987211083 }; // 고려대학교 세종캠퍼스

// Maps 스크립트를 여기서 주입한다. index.html에 두면 async 로딩이 script.js보다 빨라
// callback=initMap이 아직 없는 순간에 불려 "initMap is not a function"으로 죽을 수 있다.
// 키가 비어 있으면(config.js 없음/미기입) 그냥 건너뛴다 — sb === null 일 때와 같은 degrade 방식이라
// 지도만 비고 페이지의 나머지 기능은 그대로 동작한다.
// 키를 얻는 경로가 둘이다.
//   로컬: config.js(.gitignore)가 window.APP_CONFIG로 넣어준다.
//   배포: config.js가 저장소에 없으므로 /api/map-key가 서버 환경변수에서 읽어 내려준다.
// 배포본에서 지도가 안 뜨던 원인이 이거였다 — 키가 빈 문자열이라 스크립트를 로드조차 안 했다.
// 지도 라벨 언어는 스크립트 URL에 박혀서 로드된 뒤에는 바꿀 수 없다(구글이 재초기화를 지원하지 않는다).
// 그래서 "로드 시점의 사이트 언어"를 따른다 — 언어를 바꾸고 새로고침하면 지도도 따라온다.
// 지도만 다시 불러오려고 스크립트를 두 번 주입하면 오히려 깨진다.
function mapsLanguage(){
  return { ko:'ko', en:'en', zh:'zh-CN', es:'es', fr:'fr', de:'de', ja:'ja' }[currentLang] || 'ko';
}

async function resolveMapsKey(){
  if(MAPS_KEY) return MAPS_KEY;
  try{
    const res = await fetch('/api/map-key');
    if(!res.ok) return '';
    const data = await res.json();
    return data.key || '';
  }catch(e){
    return '';   // file://로 열었거나 오프라인 — 지도만 비고 나머지는 그대로 동작한다
  }
}

async function loadGoogleMaps(){
  const key = await resolveMapsKey();
  if(!key){
    console.warn('[지도] 지도 키를 찾지 못해 지도를 건너뜁니다.');
    console.warn('  · 로컬: config.js에 Google_Javascript_API_key를 넣고 dev-server로 여세요.');
    console.warn('  · 배포: Vercel 환경변수 Google_Javascript_API_key가 등록돼 있는지 확인하세요.');
    return;
  }
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
        + `&callback=initMap&v=weekly&loading=async&language=${mapsLanguage()}&region=KR`;
  s.async = true;
  document.head.appendChild(s);
}

// Maps 로더의 callback=initMap이 전역에서 찾는 이름이라 window에 그대로 노출한다.
async function initMap(){
  const mapEl = document.getElementById('miniMap');
  if(!mapEl) return;
  const { Map } = await google.maps.importLibrary('maps');
  gmap = new Map(mapEl, {
    center: CAMPUS_CENTER,
    zoom: 16,
    mapTypeControl: false,
    streetViewControl: false,
    scaleControl: true,
    // 45도 이미지가 있는 위치에서 자동으로 뜨는 회전(방향) 컨트롤이 확대·축소 버튼과
    // 겹쳐 보여서 껐다 — 이 지도는 회전 기능 자체가 필요 없다.
    rotateControl: false,
    // 최신 Maps JS API는 방향키(팬)+확대·축소를 하나로 묶은 "카메라 컨트롤"을 기본으로
    // 띄우는데, 세로로 길게 겹쳐 보여서 껐다. 옛날처럼 방향키만 따로 두는 컨트롤은 API에서
    // 이미 없어진 지 오래라 되살릴 수 없다 — 대신 팬은 아래 gestureHandling:'greedy'가
    // 주는 한손가락 드래그로 하고, 확대·축소만 별도의 단순한 +/- 컨트롤로 남긴다.
    cameraControl: false,
    zoomControl: true,
    // 기본값(협조 모드)은 두 손가락으로만 지도를 움직일 수 있어 작은 화면·비전체화면
    // 임베드에서는 전체화면으로 키워야만 확대·축소가 편했다. greedy로 한 손가락 드래그·
    // 핀치 줌을 바로 받는다(대신 지도 위에서는 페이지 스크롤이 지도 팬으로 먹힌다 — 의도한 트레이드오프).
    gestureHandling: 'greedy',
    styles: isDarkTheme() ? MAP_DARK_STYLES : [],
    // 타일이 도착하기 전 바닥색. styles와 달리 생성 시점에만 먹는다.
    backgroundColor: isDarkTheme() ? '#212a35' : '#e5e3df',
  });
  renderMarkers();
}
window.initMap = initMap;

// 구글이 키를 거부하면(리퍼러 불일치 등) 콘솔 에러만 남기고 지도 자리를 빈 채로 둔다.
// 화면만 봐서는 원인을 알 수 없어 "지도가 왜 안 뜨지"로 시간을 버리게 되므로,
// 방문자에게는 담백한 안내를, 개발자에게는 원인과 해결책을 콘솔에 남긴다.
// file://로 열면 Referer 헤더 자체가 없어서 여기로 들어온다 — 반드시 dev-server를 거쳐야 한다.
window.gm_authFailure = function(){
  // 인자를 여러 개 넘겨 줄을 나눈다 — 문자열 안에 이스케이프를 넣지 않는 편이 안전하다.
  console.error('[지도] 구글이 API 키를 거부했습니다 (RefererNotAllowedMapError).');
  console.error('  · file://로 열면 Referer가 없어 항상 거부됩니다. node dev-server.js 를 띄우고 http://localhost:3000 으로 여세요.');
  console.error('  · 다른 주소에서 띄운다면 Cloud Console의 HTTP 리퍼러 허용 목록에 그 주소를 추가하세요.');
  const mapEl = document.getElementById('miniMap');
  if(!mapEl) return;
  mapEl.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'map-fallback';
  box.textContent = t('mapAuthFail') || '지도를 불러오지 못했어요.';
  mapEl.appendChild(box);
};

// 마커는 항상 getFilteredList()의 결과를 따른다 — 카드 그리드와 같은 필터를 공유한다.
// 지도가 아직 준비되지 않았거나(키 없음/로딩 중) 좌표가 없는 가게는 조용히 건너뛴다.
// 지도는 카드 목록과 달리 "밥 먹을 데냐 커피 마실 데냐"만 갈라도 충분해서 3단으로 둔다.
// 카드 쪽 카테고리 필터(currentCat) 위에 한 겹 더 얹는 것이라 둘이 함께 걸린다.
let mapFilter = 'all';
function setMapFilter(kind){
  track('filter_use', { filter:'map', value:kind });
  mapFilter = kind;
  document.querySelectorAll('.map-chip').forEach(c => c.classList.toggle('active', c.dataset.mapcat === kind));
  renderMarkers();
}
function passesMapFilter(r){
  if(mapFilter === 'cafe') return r.cat === '카페';
  if(mapFilter === 'food') return r.cat !== '카페';
  return true;
}

// 이모지를 SVG 아이콘 안에 미리 구워 넣는다 — 예전에는 벡터 심볼 + 별도 DOM 라벨(이모지
// 텍스트)을 합쳐서 optimized:false로만 안 깨졌는데, 마커가 34개로 늘면서 팬/줌마다 DOM을
// 전부 재배치해야 해서 버벅였다. 이모지까지 통째로 이미지 하나(data URI)로 만들면
// optimized:true(캔버스 렌더링)로도 깨지지 않는다.
function markerIcon(emoji, fill, line, r){
  const d = r * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}">`
    + `<circle cx="${r}" cy="${r}" r="${r - 2}" fill="${fill}" stroke="${line}" stroke-width="2"/>`
    + `<text x="${r}" y="${r + 5}" font-size="${r}" text-anchor="middle">${emoji}</text></svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(d, d),
    anchor: new google.maps.Point(r, r),
  };
}
function renderMarkers(){
  if(!gmap) return;

  // 핀 색은 하드코딩하지 않고 :root의 디자인 토큰을 그대로 읽어 쓴다.
  const css  = getComputedStyle(document.documentElement);
  const fill = css.getPropertyValue('--base-bg').trim() || '#F7F4EE';
  const line = css.getPropertyValue('--slate').trim()   || '#48607A';

  gMarkers.forEach(m => m.setMap(null));
  gMarkers = [];
  gMarkerById = new Map();

  getFilteredList().filter(r => r.lat && r.lng && passesMapFilter(r)).forEach(r => {
    const idx = restaurants.indexOf(r);
    const marker = new google.maps.Marker({
      map: gmap,
      position: { lat: r.lat, lng: r.lng },
      title: rName(r),
      icon: markerIcon(r.emoji, fill, line, 15),
      optimized: true,
    });
    marker.addListener('click', () => openDetail(idx));
    // 핀이 34개까지 늘면서 어느 걸 가리키는지 알기 어려워졌다 — hover에 크기로 반응시킨다.
    marker.addListener('mouseover', () => { marker.setIcon(markerIcon(r.emoji, fill, line, 19)); marker.setZIndex(999); });
    marker.addListener('mouseout',  () => { marker.setIcon(markerIcon(r.emoji, fill, line, 15)); marker.setZIndex(null); });
    gMarkers.push(marker);
    gMarkerById.set(r.id, marker);
  });
}

// "지도에서 위치 보기" — 상세 모달을 닫고 지도 섹션으로 이동해 이 가게의 마커를 강조한다.
// 마커는 항상 getFilteredList()/mapFilter를 따르므로(위 renderMarkers 주석 참고), 카테고리·가격·
// 지도 필터에 걸려 마커가 안 뜬 상태일 수 있다 — 새 필터 함수를 만드는 대신 기존 필터를 전체로
// 되돌려(resetFilters와 같은 값) 마커가 반드시 뜨게 한다.
function focusMapMarker(id){
  const r = restaurants.find(x => x.id === id);
  if(!r || !(r.lat && r.lng)) return;
  closeDetail();
  resetFilters();
  setMapFilter('all');
  document.getElementById('map').scrollIntoView({ behavior:'smooth' });
  if(!gmap) return;
  const marker = gMarkerById.get(id);
  if(!marker) return;
  gmap.setCenter(marker.getPosition());
  gmap.setZoom(18);
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => marker.setAnimation(null), 1400);
}

loadGoogleMaps();

// ================= 검색 오타 보정 (퍼지 매칭) =================
// 헤더 통합 검색과 동네 가게 검색이 "이런 걸 찾으셨나요?"를 만들 때 공유하는 유일한 유사도 계산이다.
// 외부 의존성 없이 편집거리 하나만 쓰고, 한글은 음절을 초·중·종성으로 나눠 부분 점수를 준다
// ("짬뽕"↔"짭뽕"은 종성 하나 차이라, 음절이 통째로 다른 경우보다 훨씬 가깝게 나와야 한다).

const HANGUL_FIRST = 0xac00, HANGUL_LAST = 0xd7a3;
const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

// 비교용 정규화: 소문자 + 라틴 발음구별부호 제거(NFD로 분해해 결합문자만 삭제) + 공백·기호 제거.
// 마지막에 NFC로 되돌려 한글은 음절 한 글자로 유지한다 — 자모 분해는 unitCost에서만 한다.
function fuzzyKey(s){
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
    .replace(/[\s·,.!?()[\]{}'"~\-_/&+|]/g, '');
}

// 글자 하나 사이의 거리(0~1). 한글 음절끼리는 초/중/종성 중 다른 개수의 1/3 — 자모 한 개 오타는 0.33.
function unitCost(a, b){
  if(a === b) return 0;
  if(a >= HANGUL_FIRST && a <= HANGUL_LAST && b >= HANGUL_FIRST && b <= HANGUL_LAST){
    const x = a - HANGUL_FIRST, y = b - HANGUL_FIRST;
    let d = 0;
    if(Math.floor(x / 588) !== Math.floor(y / 588)) d++;          // 초성
    if(Math.floor((x % 588) / 28) !== Math.floor((y % 588) / 28)) d++; // 중성
    if(x % 28 !== y % 28) d++;                                     // 종성
    return d / 3;
  }
  return 1;
}

// 질의가 후보 문자열 "어딘가에" 비슷하게 들어있는지 — 후보의 앞뒤를 잘라내는 비용이 0인 편집거리.
// 후보는 키워드를 전부 이어붙인 긴 문자열이라, 통짜 편집거리로는 아무것도 안 걸린다.
function fuzzyScore(q, text){
  const m = q.length, n = text.length;
  if(!m || !n) return 0;
  let prev = new Array(n + 1).fill(0);   // 첫 행이 전부 0 = 시작 위치 자유
  let cur = new Array(n + 1);
  for(let i = 1; i <= m; i++){
    cur[0] = i;
    const qc = q.charCodeAt(i - 1);
    for(let j = 1; j <= n; j++){
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + unitCost(qc, text.charCodeAt(j - 1)));
    }
    const swap = prev; prev = cur; cur = swap;
  }
  let best = prev[0];
  for(let j = 1; j <= n; j++) if(prev[j] < best) best = prev[j];  // 끝 위치도 자유
  return 1 - best / m;
}

// 임계값은 질의 길이로 정한다. 짧을수록 "비슷한 것"이 폭발적으로 늘어 오탐이 되므로 엄격하게 잡는다.
// 2글자에서 0.6 = 허용 비용 0.8 → 음절을 통째로 바꾸는 건(비용 1.0) 못 통과하고,
// "짭→짬"(0.33)이나 "븈→뷰"(0.67)처럼 자모 한두 개 차이만 통과한다.
function fuzzyMinScore(len){
  if(len <= 1) return 2;   // 1글자는 제안하지 않는다 (도달 불가능한 점수)
  if(len <= 2) return 0.6;
  if(len <= 4) return 0.7;
  return 0.75;
}

// 초성만 친 질의("ㄱㅂ")는 편집거리가 통하지 않으니 후보의 초성 문자열에 그대로 들어있는지만 본다.
// 질의가 전부 초성일 때만 켜지므로 보통 검색어의 오탐은 늘지 않는다.
function isChoseongQuery(q){ return q.length >= 2 && /^[ㄱ-ㅎ]+$/.test(q); }
function choseongKey(text){
  let out = '';
  for(let i = 0; i < text.length; i++){
    const c = text.charCodeAt(i);
    out += (c >= HANGUL_FIRST && c <= HANGUL_LAST) ? CHOSEONG[Math.floor((c - HANGUL_FIRST) / 588)] : ' ';
  }
  return out;
}

// 긴 키워드 문자열을 타자마다 다시 정규화하지 않도록 결과를 재사용한다.
const fuzzyKeyCache = new Map();
function fuzzyKeyOf(s){
  let v = fuzzyKeyCache.get(s);
  if(v === undefined){ v = fuzzyKey(s); fuzzyKeyCache.set(s, v); }
  return v;
}

// 질의(정규화됨)와 후보 문자열의 유사도. 임계 미만이면 0. 두 검색이 함께 쓰는 유일한 판정 함수다.
function fuzzyMatch(qKey, text){
  const key = fuzzyKeyOf(text);
  if(!key) return 0;
  if(isChoseongQuery(qKey)) return choseongKey(key).includes(qKey) ? 1 : 0;
  const score = fuzzyScore(qKey, key);
  return score >= fuzzyMinScore(qKey.length) ? score : 0;
}

// 이미 이 페이지에 등록된 가게 중 철자가 비슷한 곳. 로컬 restaurants 배열만 본다 —
// 카카오가 0건을 준 뒤 "혹시 이 가게인가요?"를 띄우는 용도라, 여기서 API를 더 부르면 안 된다.
function localShopSuggestions(query, limit = 3){
  const qKey = fuzzyKey(query);
  if(qKey.length < 2) return [];
  return restaurants
    .map((r, i) => ({r, i, s: fuzzyMatch(qKey, nameAllLangs(r))}))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit);
}

// ================= 실시간 가게 검색 (카카오 로컬 API 경유) =================
const liveSearchInput = document.getElementById('liveSearchInput');
const liveSearchResults = document.getElementById('liveSearchResults');
let liveSearchList = [];

async function runLiveSearch(){
  const q = liveSearchInput.value.trim();
  if(!q) return;
  liveSearchResults.innerHTML = `<div class="google-review-loading">${t('liveSearchLoading') || '검색 중...'}</div>`;
  try{
    const res = await fetch(`/api/kakao-search?query=${encodeURIComponent(q)}`);
    const data = await res.json();
    liveSearchList = (data && data.results) || [];
    renderLiveSearchResults(q);
  }catch(e){
    liveSearchResults.innerHTML = `<div class="google-review-error">${t('liveSearchError') || '검색에 실패했습니다. 잠시 후 다시 시도해주세요.'}</div>`;
  }
}

liveSearchInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') runLiveSearch(); });

function renderLiveSearchResults(q){
  // 결과 수까지 같이 보낸다 — 0건 검색어가 곧 "아직 없는 가게" 목록이 된다
  track('search', { search_term: q, results: liveSearchList.length });
  if(liveSearchList.length === 0){
    // 카카오가 이미 자체 매칭을 하므로 여기서 검색어를 고쳐 다시 부르지 않는다.
    // 대신 철자 확인을 안내하고, 이미 이 페이지에 있는 가게 중 비슷한 이름만 로컬로 골라 보여준다.
    const near = localShopSuggestions(q);
    liveSearchResults.innerHTML = `
      <div class="google-review-empty">
        ${t('liveSearchEmpty') || '검색 결과가 없어요.'}
        <span class="search-check">${t('searchCheckSpelling') || '검색어가 정확한지 확인해주세요.'}</span>
      </div>
      ${near.length ? `
        <div class="live-search-suggest">
          <div class="search-group-title">${t('searchMaybeThisShop') || '혹시 이 가게인가요?'}</div>
          ${near.map(({r, i}) => `
            <button type="button" class="search-item" data-i="${i}">
              <span class="search-icon">${r.emoji}</span>
              <span class="search-text">
                <span class="search-label">${escapeHtml(rName(r))}</span>
                <span class="search-sub">${escapeHtml(rCat(r))} · ${escapeHtml(rDesc(r))}</span>
              </span>
            </button>`).join('')}
        </div>` : ''}
    `;
    liveSearchResults.querySelectorAll('.live-search-suggest .search-item').forEach(btn => {
      btn.addEventListener('click', () => openDetail(Number(btn.dataset.i)));
    });
    return;
  }
  liveSearchResults.innerHTML = liveSearchList.map((place, i) => `
    <div class="live-search-item">
      <div class="live-search-item-row">
        <button type="button" class="live-search-item-head" data-i="${i}">
          <span class="live-search-item-name">${escapeHtml(place.name)}</span>
          <span class="live-search-item-addr">${escapeHtml(place.address || '')}</span>
        </button>
        ${copyBtnHtml(place.address, 'copyAddressBtn', '주소 복사')}
      </div>
      ${place.phone ? `
      <div class="live-search-item-row live-search-item-phone">
        <span class="live-search-item-addr">${escapeHtml(place.phone)}</span>
        ${copyBtnHtml(place.phone, 'copyPhoneBtn', '전화번호 복사')}
      </div>` : ''}
      <div class="live-search-item-google" id="liveSearchGoogle-${i}"></div>
    </div>
  `).join('');
  document.querySelectorAll('.live-search-item-head').forEach(btn => {
    btn.addEventListener('click', () => loadLiveSearchGoogleReviews(Number(btn.dataset.i)));
  });
}

async function loadLiveSearchGoogleReviews(i){
  const place = liveSearchList[i];
  const box = document.getElementById(`liveSearchGoogle-${i}`);
  if(!place || !box) return;
  // 이미 이 카드에 내용을 채운 적 있으면(캐시든 방금 불러온 것이든) 재요청 없이 펼치기/접기만 토글
  if(box.dataset.filled){ box.classList.toggle('show'); return; }
  box.classList.add('show');

  const cached = store.googleReviews[googleCacheKey(place.name)];
  if(cached){
    box.dataset.filled = '1';
    box.innerHTML = renderGoogleReviewContent(cached.data);
    return;
  }

  box.innerHTML = `<div class="google-review-loading">${t('googleReviewLoading') || '리뷰를 불러오는 중...'}</div>`;
  try{
    const url = `/api/google-reviews?name=${encodeURIComponent(place.name)}&lat=${place.lat}&lng=${place.lng}&lang=${mapsLanguage()}`;
    const res = await fetch(url);
    const data = await res.json();
    box.dataset.filled = '1';
    box.innerHTML = renderGoogleReviewContent(data);
    store.googleReviews[googleCacheKey(place.name)] = { data, fetchedAt: Date.now() };
    saveState();
  }catch(e){
    box.innerHTML = `<div class="google-review-error">${t('googleReviewError') || '리뷰를 불러오지 못했습니다.'}</div>`;
  }
}

// ================= 3초 컷 빠르게 고르기 =================
function quickPick(){
  openGame();
}

// ================= 메뉴 추천 게임 (타로 / 룰렛) =================
const gameOverlay = document.getElementById('gameOverlay');
const gameBody = document.getElementById('gameBody');
let rouletteItems = [];
let rouletteAngle = 0;        // 누적 회전각 — 다시 돌리기마다 이어서 앞으로만 돈다(0으로 스냅백 금지)
let rouletteSpinning = false; // 중복 클릭 방지
let rouletteSlotCount = 6;    // 칸 수 — 메뉴 개수와 별개로 사용자가 직접 정한다
const ROULETTE_MIN_SLOTS = 2;
const ROULETTE_MAX_SLOTS = 12;
const ROULETTE_PALETTE_VARS = ['--base-bg-2', '--slate-tint', '--paper', '--base-bg'];

function openGame(){
  renderGameChoice();
  gameOverlay.classList.add('show');
}
function closeGame(){ gameOverlay.classList.remove('show'); }

function requestCloseGame(){
  if(rouletteItems.length > 0) confirmDiscard(closeGame);
  else closeGame();
}
function closeGameOnOverlay(e){ if(e.target === gameOverlay) requestCloseGame(); }

function renderGameChoice(){
  gameBody.innerHTML = `
    <h3 class="game-title">${t('gameTitle') || '오늘 뭐 먹지, 게임으로 정해요'}</h3>
    <p class="game-sub">${t('gameSub') || '결정장애 탈출! 둘 중 하나를 골라보세요'}</p>
    <div class="game-choice-grid">
      <button type="button" class="game-choice-btn" id="pickTarot">
        <span class="icon">🔮</span>
        <span><strong>${t('gameTarotName') || '오늘의 메뉴 타로'}</strong><span class="desc">${t('gameTarotDesc') || '카드 한 장 뽑고 오늘의 맛집 운명 확인하기'}</span></span>
      </button>
      <button type="button" class="game-choice-btn" id="pickRoulette">
        <span class="icon">🎡</span>
        <span><strong>${t('gameRouletteName') || '메뉴 룰렛'}</strong><span class="desc">${t('gameRouletteDesc') || '먹고 싶은 메뉴를 직접 적고 룰렛으로 정하기'}</span></span>
      </button>
    </div>
  `;
  document.getElementById('pickTarot').addEventListener('click', renderTarot);
  document.getElementById('pickRoulette').addEventListener('click', renderRoulette);
}

function renderTarot(){
  // 후보 카드는 12곳 전체를 섞어서 무한 회전 덱으로 보여준다
  const deck = restaurants.slice().sort(() => Math.random() - 0.5);
  gameBody.innerHTML = `
    <button type="button" class="game-back-btn" id="gameBackBtn">${t('gameBack') || '← 다른 게임 고르기'}</button>
    <h3 class="game-title">${t('tarotTitle') || '오늘의 메뉴 타로'}</h3>
    <p class="game-sub">${(t('tarotSub') || '{n}장의 카드가 흐르고 있어요. 눌러서 오늘의 한 그릇을 뽑아보세요').replace('{n}', deck.length)}</p>
    <div class="tarot-deck" id="tarotDeck">
      <div class="tarot-track" id="tarotTrack">
        ${[...deck, ...deck].map(r => `<div class="tarot-mini">${r.emoji}</div>`).join('')}
      </div>
    </div>
    <div class="tarot-card" id="tarotCard">🔮</div>
    <div id="tarotResultWrap"></div>
  `;
  document.getElementById('gameBackBtn').addEventListener('click', renderGameChoice);
  document.getElementById('tarotCard').addEventListener('click', () => drawTarot(deck));
}

function drawTarot(deck){
  const card = document.getElementById('tarotCard');
  const track = document.getElementById('tarotTrack');
  const pick = deck[Math.floor(Math.random() * deck.length)];
  if(track) track.classList.add('paused');
  card.classList.add('flipped');
  card.innerHTML = pick.emoji;
  card.style.pointerEvents = 'none';
  document.getElementById('tarotResultWrap').innerHTML = `
    <div class="tarot-result">
      <div class="emoji">✨</div>
      <strong>${rName(pick)}</strong>
      <span>${rCat(pick)} · ★ ${pick.rating} · ${rDesc(pick)}</span>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" id="tarotRedraw">${t('tarotRedraw') || '다시 뽑기'}</button>
      <button type="button" class="survey-close-btn" style="flex:1;" id="tarotClose">${t('closeBtn') || '닫기'}</button>
    </div>
  `;
  document.getElementById('tarotRedraw').addEventListener('click', renderTarot);
  document.getElementById('tarotClose').addEventListener('click', closeGame);
}

function renderRoulette(){
  rouletteItems = [];
  rouletteAngle = 0;
  rouletteSpinning = false;
  rouletteSlotCount = 6;
  gameBody.innerHTML = `
    <button type="button" class="game-back-btn" id="gameBackBtn">${t('gameBack') || '← 다른 게임 고르기'}</button>
    <h3 class="game-title">${t('rouletteTitle') || '메뉴 룰렛'}</h3>
    <p class="game-sub">${t('rouletteSub') || '먹고 싶은 메뉴를 2개 이상 적고 돌려보세요'}</p>
    <div class="roulette-slot-row">
      <label for="rouletteSlotInput">${t('rouletteSlotLabel') || '칸 수'}</label>
      <input type="number" id="rouletteSlotInput" min="${ROULETTE_MIN_SLOTS}" max="${ROULETTE_MAX_SLOTS}" step="1" value="${rouletteSlotCount}">
    </div>
    <div class="roulette-input-row">
      <input type="text" id="rouletteInput" placeholder="${t('roulettePh') || '예: 국밥, 피자, 마라탕'}">
      <button type="button" class="roulette-add-btn" id="rouletteAddBtn">${t('rouletteAdd') || '추가'}</button>
    </div>
    <div class="roulette-chips" id="rouletteChips"></div>
    <p class="roulette-status" id="rouletteStatus">${t('rouletteEmpty') || '메뉴를 추가해주세요'}</p>
    <div class="roulette-wheel-wrap" id="rouletteWheelWrap">
      <div class="roulette-pointer" aria-hidden="true"></div>
      <div class="roulette-wheel" id="rouletteWheel" role="img" aria-label="${t('rouletteTitle') || '메뉴 룰렛'}">
        <div class="roulette-wheel-labels" id="rouletteWheelLabels"></div>
        <div class="roulette-wheel-hub" aria-hidden="true">🎯</div>
      </div>
    </div>
    <p class="roulette-result" id="rouletteResult" aria-live="polite"></p>
    <div class="game-action-row">
      <button type="button" class="btn-primary" style="flex:1;" id="rouletteSpinBtn" disabled>${t('rouletteSpin') || '🎡 돌리기'}</button>
    </div>
  `;
  document.getElementById('gameBackBtn').addEventListener('click', renderGameChoice);
  document.getElementById('rouletteSlotInput').addEventListener('change', (e) => setRouletteSlotCount(e.target.value));
  document.getElementById('rouletteAddBtn').addEventListener('click', addRouletteItem);
  document.getElementById('rouletteInput').addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); addRouletteItem(); }
  });
  document.getElementById('rouletteSpinBtn').addEventListener('click', spinRoulette);
  updateRouletteSpinState();
}

function setRouletteSlotCount(v){
  const n = Math.max(ROULETTE_MIN_SLOTS, Math.min(ROULETTE_MAX_SLOTS, Math.round(Number(v)) || rouletteSlotCount));
  rouletteSlotCount = n;
  const input = document.getElementById('rouletteSlotInput');
  if(input) input.value = n;
  updateRouletteSpinState();
}

function renderRouletteChips(){
  const chips = document.getElementById('rouletteChips');
  chips.innerHTML = rouletteItems.map((item, i) => `
    <span class="roulette-chip">${item}<button type="button" data-i="${i}">×</button></span>
  `).join('');
  chips.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      rouletteItems.splice(Number(btn.dataset.i), 1);
      renderRouletteChips();
      updateRouletteSpinState();
    });
  });
}

function updateRouletteSpinState(){
  const spinBtn = document.getElementById('rouletteSpinBtn');
  const status  = document.getElementById('rouletteStatus');
  if(!spinBtn || !status) return;
  const n = rouletteItems.length;

  spinBtn.disabled = n < 2;
  status.textContent = n === 0 ? (t('rouletteEmpty') || '메뉴를 추가해주세요')
    : n < 2 ? (t('rouletteMin') || '메뉴를 2개 이상 추가해주세요')
    : (t('rouletteReady') || '{n}개의 메뉴 중에서 골라드릴게요').replace('{n}', n);

  const resultEl = document.getElementById('rouletteResult');
  if(resultEl){ resultEl.textContent = ''; resultEl.classList.remove('landed'); }

  rebuildRouletteWheel();
}

// 칸 수(rouletteSlotCount)와 메뉴 개수(rouletteItems)는 서로 독립이라, 메뉴를 칸 수만큼
// 순환시켜 채운다 — 메뉴가 칸보다 적으면 반복되고, 많으면 앞에서부터 칸 수만큼만 배치된다.
function rouletteWedgeItems(){
  if(rouletteItems.length === 0) return [];
  return Array.from({length: rouletteSlotCount}, (_, i) => rouletteItems[i % rouletteItems.length]);
}

// 휠 색은 :root 디자인 토큰을 런타임에 읽어 쓴다 — renderMarkers()의 마커 색 처리와 같은 관례.
// 레드는 CTA·포인터 전용 몫이라(60/30/10 규칙) 칸 채우기에는 슬레이트·베이스 계열만 순환한다.
function rouletteWedgeColors(n){
  const css = getComputedStyle(document.documentElement);
  const palette = ROULETTE_PALETTE_VARS.map(v => css.getPropertyValue(v).trim() || '#EFEAE0');
  const colors = Array.from({length:n}, (_, i) => palette[i % palette.length]);
  if(n > 2 && colors[n-1] === colors[0]){
    const alt = palette.find(c => c !== colors[n-1] && c !== colors[n-2]);
    if(alt) colors[n-1] = alt;
  }
  return colors;
}

// conic-gradient로 칸을 칠하고, 각 칸 중심 각도에 라벨을 붙인다.
// conic-gradient는 12시 방향이 0deg(시계방향)이고, CSS rotate()의 0deg는 3시 방향이라 -90도 보정이 필요하다.
// 왼쪽 절반(90~270deg)에 놓이는 라벨은 그대로 두면 거꾸로 보이므로 180도 더 돌리고 정렬을 반대로 뒤집는다.
function rebuildRouletteWheel(){
  const wheel = document.getElementById('rouletteWheel');
  const labelsWrap = document.getElementById('rouletteWheelLabels');
  if(!wheel) return;
  const items = rouletteWedgeItems();
  const n = items.length;
  if(n < 1){
    wheel.style.background = 'var(--base-bg-2)';
    if(labelsWrap) labelsWrap.innerHTML = '';
    return;
  }
  const colors = rouletteWedgeColors(n);
  const step = 360 / n;
  const stops = colors.map((c,i) => `${c} ${(i*step).toFixed(3)}deg ${((i+1)*step).toFixed(3)}deg`);
  wheel.style.background = `conic-gradient(${stops.join(',')})`;

  if(labelsWrap){
    labelsWrap.innerHTML = items.map((item, i) => {
      const bisector = (i + 0.5) * step;
      let rot = bisector - 90;
      const norm = ((rot % 360) + 360) % 360;
      const flip = norm > 90 && norm < 270;
      if(flip) rot += 180;
      const label = item.length > 6 ? item.slice(0,6) + '…' : item;
      return `<span class="roulette-wheel-label${flip ? ' is-flipped' : ''}" style="transform:rotate(${rot}deg)">${escapeHtml(label)}</span>`;
    }).join('');
  }
}

function addRouletteItem(){
  const input = document.getElementById('rouletteInput');
  const val = input.value.trim();
  if(!val) return;
  rouletteItems.push(val);
  input.value = '';
  renderRouletteChips();
  updateRouletteSpinState();
}

// 당첨 칸을 먼저 무작위로 고르고, 그 칸의 정중앙이 포인터(고정, 12시 방향) 밑에 오도록 회전각을 역산한다.
// 경계선에 걸치는 경우를 아예 없애는 방식이라 별도 오차 보정이 필요 없다.
// rouletteAngle은 매 스핀마다 누적해서 앞으로만 돌린다(0으로 되감으면 순간 점프처럼 보인다).
function spinRoulette(){
  if(rouletteSpinning || rouletteItems.length < 2) return;
  const wheel    = document.getElementById('rouletteWheel');
  const spinBtn  = document.getElementById('rouletteSpinBtn');
  const resultEl = document.getElementById('rouletteResult');
  if(!wheel || !spinBtn) return;

  rouletteSpinning = true;
  spinBtn.disabled = true;
  if(resultEl){ resultEl.textContent = ''; resultEl.classList.remove('landed'); }

  const items = rouletteWedgeItems();
  const n = items.length;
  const winnerIndex = Math.floor(Math.random() * n);
  const step = 360 / n;
  const bisector = (winnerIndex + 0.5) * step;
  const targetMod  = (360 - bisector) % 360;
  const currentMod = ((rouletteAngle % 360) + 360) % 360;
  const extraSpins = 4 + Math.floor(Math.random() * 2); // 4~5바퀴
  let delta = (targetMod - currentMod + 360) % 360;
  delta += extraSpins * 360;
  rouletteAngle += delta;
  wheel.style.transform = `rotate(${rouletteAngle}deg)`;

  let settled = false;
  const finish = () => {
    if(settled) return;
    settled = true;
    wheel.removeEventListener('transitionend', onEnd);
    clearTimeout(fallback);
    const winner = items[winnerIndex];
    if(resultEl){ resultEl.textContent = `🎉 ${winner}`; resultEl.classList.add('landed'); }
    spinBtn.disabled = false;
    spinBtn.textContent = t('rouletteRespin') || '🎡 다시 돌리기';
    rouletteSpinning = false;
  };
  const onEnd = (e) => { if(e.propertyName === 'transform') finish(); };
  wheel.addEventListener('transitionend', onEnd);
  const fallback = setTimeout(finish, 4500); // transitionend가 안 온 경우 대비
}

// ================= 손주 로그인 / 가입 =================
const authOverlay = document.getElementById('authOverlay');
const authBody = document.getElementById('authBody');
let authMode = 'signup';
// isLoggedIn / currentUserName은 renderCards()보다 먼저 필요해서 파일 상단(로컬 저장 바로 아래)에 선언돼 있다.

// 헤더의 로그인 상태 표시는 오직 이 함수만 건드린다.
// 로그인 시 "○○ 손주님"이 되고 누르면 마이페이지가 열린다.
// 로그아웃은 그 마이페이지 안에만 둔다 — 헤더에도 두면 같은 동작이 두 군데가 된다.
function updateHeaderAuthUI(){
  const authBtn = document.getElementById('authHeaderBtn');
  const authIcon = document.getElementById('authHeaderIcon');
  const authLabel = document.getElementById('authHeaderLabel');
  if(isLoggedIn){
    authIcon.textContent = '🌱';
    authLabel.textContent = displayUserName();
    authBtn.title = (t('headerAuthMypageTitle') || '{name}님의 마이페이지').replace('{name}', currentUserName || (currentLang==='ko' ? '손주' : (t('grandchildDefaultName')||'Grandchild')));
    authBtn.onclick = () => openMypage('saved');
  } else {
    authIcon.textContent = '👤';
    authLabel.textContent = t('navLogin') || '손주 로그인';
    authBtn.title = t('navLogin') || '손주 로그인';
    authBtn.onclick = () => openAuth('login');
  }
}

// 한국어에서는 "○○ 손주님", 다른 언어에서는 이름만 (어순이 달라서 한 곳에서 처리한다)
function displayUserName(){
  const fallback = currentLang === 'ko' ? '손주' : (t('grandchildDefaultName') || 'Grandchild');
  const name = currentUserName || fallback;
  return currentLang === 'ko' ? `${name} 손주님` : name;
}
updateHeaderAuthUI();

// ---- Supabase 세션 ↔ 화면 상태 동기화 ----
// 로그인 여부의 진짜 출처는 세션 하나뿐이다. 여기서만 isLoggedIn을 채운다.
function syncAuthFromSession(session){
  const user = session && session.user;
  const wasUserId = currentUserId;
  // 로그인 상태가 확정되는 곳은 여기 하나다. 핸들러마다 심으면 새로고침에도 다시 세어진다.
  // 사용자 id는 보내지 않는다 — 개인 식별에 쓰일 수 있다.
  if(user && !wasUserId) track('login', { method:'email' });
  isLoggedIn = !!user;
  currentUserId = user ? user.id : '';
  currentUserName = user ? ((user.user_metadata && user.user_metadata.name) || '') : '';

  // store.auth를 여기서 먼저 맞춰둔다. currentMarks()가 store.auth.userId를 읽기 때문에
  // (초기 applyState()가 currentUserId 선언보다 먼저 실행돼 TDZ를 피하려고 그렇게 돼 있다),
  // 이걸 갱신하지 않으면 아래 applyState()가 이전 사용자 기준으로 조회해 빈 결과를 받고,
  // 뒤이은 saveState()가 그 빈 상태를 새 사용자 칸에 덮어써 저장목록을 지워버린다.
  store.auth = { isLoggedIn, name: currentUserName, userId: currentUserId };

  // 옛 버전에서 쓰던 전역 marks가 남아 있으면 처음 로그인한 사람에게 한 번만 넘겨준다.
  if(user && store.marks[LEGACY_MARKS_KEY]){
    store.marks[currentUserId] = Object.assign({}, store.marks[LEGACY_MARKS_KEY], store.marks[currentUserId] || {});
    delete store.marks[LEGACY_MARKS_KEY];
  }

  if(wasUserId !== currentUserId) applyState();  // 사용자가 바뀌면 마크를 다시 깐다
  saveState();
  updateHeaderAuthUI();
  renderCards();
  renderReviews();
  pullSaved();
  pullPassOrders();
  loadStoreOwnership();
  loadAdminStatus(session);
}

// 첫 렌더는 이미 로그아웃 상태로 그려진 뒤다. 세션 확인은 비동기라
// 확인이 끝나면 위 함수가 화면을 다시 그린다.
if(sb){
  sb.auth.getSession().then(({ data }) => syncAuthFromSession(data.session));
  sb.auth.onAuthStateChange((_event, session) => syncAuthFromSession(session));
} else if(isLoggedIn){
  // CDN이 막혀 supabase-js가 없는 경우: 지난 로그인 흔적을 믿지 않고 로그아웃으로 되돌린다.
  syncAuthFromSession(null);
}

function logout(){
  openConfirm({
    emoji:'👋',
    title:t('logoutTitle') || '로그아웃 하시겠어요?',
    text:t('logoutBody') || '로그아웃하면 저장 목록·리뷰 작성 등은 다시 로그인한 뒤에 이용할 수 있어요.',
    okLabel:t('logoutOk') || '로그아웃',
    cancelLabel:t('logoutCancel') || '취소',
    onOk: async () => {
      closeConfirm();
      closeMypage();
      // signOut()이 onAuthStateChange를 깨우고, 거기서 syncAuthFromSession(null)이
      // 상태 초기화와 재렌더를 전부 처리한다.
      if(sb) await sb.auth.signOut();
      else syncAuthFromSession(null);
    }
  });
}

function openAuth(intent){
  authMode = 'signup';
  renderAuth(intent);
  authOverlay.classList.add('show');
}
function closeAuth(){ authOverlay.classList.remove('show'); }
function closeAuthOnOverlay(e){ if(e.target === authOverlay) closeAuth(); }

const authIntentCopy = {
  save:{emoji:'💌', text:'가보고 싶은 곳을 저장하려면, 먼저 우리 손주가 되어주세요!', key:'authIntentSave'},
  mypage:{emoji:'📌', text:'마이페이지는 손주로 등록하면 이용할 수 있어요.', key:'authIntentMypage'},
  review:{emoji:'📝', text:'리뷰를 남기려면 먼저 손주로 등록해주세요.', key:'authIntentReview'},
  pass:{emoji:'🎟️', text:'식권은 손주 계정에 담기기 때문에, 먼저 등록이 필요해요.', key:'authIntentPass'},
  login:{emoji:'👋', text:'다시 오셨네요! 손주 계정으로 로그인해주세요.', key:'authIntentLogin'},
};

function renderAuth(intent){
  const info = authIntentCopy[intent] || authIntentCopy.login;
  authBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">${info.emoji}</div>
      <h3>${t('authTitle') || '손주가 되어주세요'}</h3>
      <p>${t(info.key) || info.text}</p>
    </div>
    <div class="auth-tabs">
      <button type="button" class="auth-tab ${authMode==='signup'?'active':''}" id="tabSignup">${t('authTabSignup') || '손주 등록'}</button>
      <button type="button" class="auth-tab ${authMode==='login'?'active':''}" id="tabLogin">${t('authTabLogin') || '손주 로그인'}</button>
    </div>
    <!-- novalidate: 브라우저 기본 검증 문구는 사이트 언어가 아니라 브라우저 언어를 따른다.
         한/영/중을 직접 관리하는 사이트라 검증과 안내를 우리가 맡는다.
         type="email"은 모바일 키보드 때문에 그대로 둔다. -->
    <form id="authForm" novalidate>
      ${authMode==='signup' ? `
        <div class="auth-field">
          <label>${t('authNameLabel') || '손주 이름'}</label>
          <input type="text" id="authName" placeholder="${t('authNamePh') || '어떻게 불러드릴까요?'}" required>
        </div>
      ` : ''}
      <div class="auth-field">
        <label>${t('authIdLabel') || '이메일'}</label>
        <input type="email" id="authId" placeholder="${t('authIdPh') || 'example@mail.com'}" required>
      </div>
      <div class="auth-field">
        <label>${t('authPwLabel') || '비밀번호'}</label>
        <input type="password" id="authPw" placeholder="${t('authPwPh') || '비밀번호'}" required>
      </div>
      ${authMode==='signup' ? `
        <div class="auth-field">
          <label>${t('authPw2Label') || '비밀번호 확인'}</label>
          <input type="password" id="authPw2" placeholder="${t('authPw2Ph') || '비밀번호를 한 번 더 입력해주세요'}" required>
        </div>
      ` : ''}
      <p class="auth-error" id="authError"></p>
      <button type="submit" class="auth-submit-btn">${authMode==='signup' ? (t('authSubmitSignup')||'손주 등록하고 시작하기') : (t('authSubmitLogin')||'로그인하기')}</button>
    </form>
  `;
  document.getElementById('tabSignup').addEventListener('click', () => { authMode='signup'; renderAuth(intent); });
  document.getElementById('tabLogin').addEventListener('click', () => { authMode='login'; renderAuth(intent); });
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('authError');
    const submitBtn = e.target.querySelector('.auth-submit-btn');
    const idVal = document.getElementById('authId').value.trim();
    errEl.textContent = '';

    if(!isEmail(idVal)){
      errEl.textContent = t('authErrFormat') || '이메일 주소 형식으로 입력해주세요.';
      return;
    }
    const pwVal = document.getElementById('authPw').value;
    // novalidate로 브라우저 기본 검증을 껐으므로 빈 값도 여기서 직접 막는다
    if(!pwVal){
      errEl.textContent = t('authErrPwEmpty') || '비밀번호를 입력해주세요.';
      return;
    }
    if(authMode === 'signup' && !document.getElementById('authName').value.trim()){
      errEl.textContent = t('authErrNameEmpty') || '어떻게 불러드릴지 이름을 입력해주세요.';
      return;
    }

    if(!sb){
      errEl.textContent = t('authErrOffline') || '지금은 로그인 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.';
      return;
    }

    // 비밀번호는 Supabase로 바로 넘긴다 — 이 코드에 저장하거나 비교하는 곳은 없다.
    let name = currentUserName;
    submitBtn.disabled = true;
    try{
      if(authMode === 'signup'){
        const pw2 = document.getElementById('authPw2').value;
        if(pwVal !== pw2){
          errEl.textContent = t('authErrPwMismatch') || '비밀번호가 서로 달라요. 다시 확인해주세요.';
          return;
        }
        name = document.getElementById('authName').value.trim();
        const { data, error } = await sb.auth.signUp({
          email: idVal,
          password: pwVal,
          options:{ data:{ name } },
        });
        if(error){ errEl.textContent = authErrorMessage(error); return; }
        // 이메일 확인이 켜져 있으면 세션 없이 사용자만 돌아온다 → 요구사항(즉시 로그인)이 깨진 상태
        if(!data.session){
          errEl.textContent = t('authErrNeedConfirm') || '가입 확인 메일을 보냈어요. 메일함에서 인증한 뒤 로그인해주세요.';
          return;
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email: idVal, password: pwVal });
        if(error){ errEl.textContent = authErrorMessage(error); return; }
        name = (data.user && data.user.user_metadata && data.user.user_metadata.name) || '';
      }
    }catch(err){
      errEl.textContent = t('authErrNetwork') || '연결에 실패했어요. 잠시 후 다시 시도해주세요.';
      return;
    }finally{
      submitBtn.disabled = false;
    }
    // 여기 도달했으면 세션이 생겼다. onAuthStateChange가 상태·재렌더를 처리하므로
    // 이 함수는 환영 화면만 띄운다.
    renderAuthWelcome(name);
  });
}

// Supabase의 영문 오류를 그대로 보여주지 않고 안내 문구로 바꾼다.
function authErrorMessage(error){
  const raw = (error && error.message) || '';
  const m = raw.toLowerCase();
  if(m.includes('invalid login credentials'))
    return t('authErrWrongPw') || '이메일 또는 비밀번호가 올바르지 않아요.';
  if(m.includes('already registered') || m.includes('already been registered') || m.includes('user already'))
    return t('authErrDupe') || '이미 가입된 이메일이에요. "손주 로그인" 탭에서 로그인해주세요.';
  if(m.includes('password should be at least') || m.includes('password is too short'))
    return t('authErrPwShort') || '비밀번호는 6자 이상으로 만들어주세요.';
  if(m.includes('email not confirmed'))
    return t('authErrNotConfirmed') || '아직 메일 인증이 끝나지 않았어요. 메일함을 확인해주세요.';
  if(m.includes('is invalid') || m.includes('invalid format'))
    return t('authErrFormat') || '이메일 주소 형식으로 입력해주세요.';
  if(m.includes('rate limit') || m.includes('too many'))
    return t('authErrRate') || '요청이 많아요. 잠시 후 다시 시도해주세요.';
  return t('authErrGeneric') || '처리에 실패했어요. 잠시 후 다시 시도해주세요.';
}

// 로그인은 Supabase 이메일 방식만 쓰므로 전화번호를 받지 않는다
// (전화번호 로그인은 유료 SMS 연동이 따로 필요하다).
function isEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// 문의 폼은 로그인과 무관하게 "연락 받을 수단"을 받는 곳이라 전화번호도 그대로 허용한다.
function isEmailOrPhone(v){
  const phoneOk = /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(v.replace(/\s/g, ''));
  return isEmail(v) || phoneOk;
}

function renderAuthWelcome(name){
  // 로그인 상태 반영과 재렌더는 syncAuthFromSession()이 onAuthStateChange를 통해 처리한다.
  // 여기서는 환영 화면만 그린다.
  const label = currentLang === 'ko' ? (name ? `${name} 손주님` : '손주님') : (name || t('grandchildDefaultName') || 'Grandchild');
  authBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>${(t('authWelcomeTitle') || '환영해요, {name}!').replace('{name}', label)}</h3>
      <p>${authMode === 'signup'
        ? (t('authWelcomeBody') || '손주 등록이 완료됐어요. 정식 오픈하면 가장 먼저 알려드릴게요.')
        : (t('authWelcomeBodyLogin') || '다시 오신 걸 환영해요!')}</p>
      <div class="game-action-row">
        <button type="button" class="btn-ghost" style="flex:1;" onclick="closeAuth()">${t('closeBtn') || '닫기'}</button>
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeAuth(); openMypage('saved');">${t('authWelcomeMypageBtn') || '마이페이지 보러가기'}</button>
      </div>
    </div>
  `;
}

// ================= 마이페이지 (로그인 후 하위 섹션) =================
const mypageOverlay = document.getElementById('mypageOverlay');
const mypageBody = document.getElementById('mypageBody');
let mypageTab = 'saved';

function openMypage(tab){
  if(!requireLogin('mypage')) return;
  mypageTab = tab || 'saved';
  renderMypage();
  mypageOverlay.classList.add('show');
}
function closeMypage(){ mypageOverlay.classList.remove('show'); }
function closeMypageOnOverlay(e){ if(e.target === mypageOverlay) closeMypage(); }

function renderMypage(){
  // 식권 탭은 예약 내역, 관리자 탭은 문의 목록이라 카드 모양이 달라서 분기한다
  const body = mypageTab === 'admin' ? renderMypageAdminList()
    : mypageTab === 'pass' ? renderMypagePassList()
    : renderMypagePlaceList();
  const isAdminTab = mypageTab === 'admin';
  mypageBody.innerHTML = `
    <div class="mypage-head">
      <div class="emoji">🌱</div>
      <h3>${currentUserName ? (t('mypageTitle')||'{name} 손주님의 마이페이지').replace('{name}', escapeHtml(currentUserName)) : (t('mypageTitleGeneric')||'마이페이지')}</h3>
    </div>
    <div class="mypage-tabs">
      <button type="button" class="mypage-tab ${mypageTab==='saved'?'active':''}" id="tabSaved">${t('mypageTabSaved') || '가보고 싶은 곳'}</button>
      <button type="button" class="mypage-tab ${mypageTab==='visited'?'active':''}" id="tabVisited">${t('mypageTabVisited') || '가본 곳'}</button>
      <button type="button" class="mypage-tab ${mypageTab==='pass'?'active':''}" id="tabPass">${t('mypageTabPass') || '식권'}</button>
      ${isAdmin ? `<button type="button" class="mypage-tab ${mypageTab==='admin'?'active':''}" id="tabAdmin">관리자</button>` : ''}
    </div>
    <div class="mypage-list">${body}</div>
    ${isAdminTab ? '' : `
    <div class="mypage-allergy">
      <div class="mypage-allergy-head">${t('allergyTitle') || '🥜 알레르기 등록'}</div>
      <p class="mypage-allergy-sub">${t('allergySub') || '고른 재료가 들어갈 수 있는 가게를 열면 미리 알려드려요.'}</p>
      <div class="mypage-allergy-chips">
        ${ALLERGENS.map(k => `<button type="button" class="allergy-chip ${(store.allergies||[]).includes(k) ? 'on' : ''}" data-allergen="${k}" aria-pressed="${(store.allergies||[]).includes(k)}">${allergenLabel(k)}</button>`).join('')}
      </div>
    </div>
    <div class="mypage-reset-row">
      <button type="button" class="mypage-reset-link" onclick="resetSection('${mypageTab}')">${sectionResetLabel(mypageTab)}</button>
      <button type="button" class="mypage-reset-link" onclick="resetMyData()">${t('mypageResetLink') || '내 활동 기록 전체 초기화'}</button>
    </div>
    `}
    <div class="game-action-row" style="margin-top:10px;">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="logout()">${t('mypageLogoutBtn') || '로그아웃'}</button>
      <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeMypage()">${t('closeBtn') || '닫기'}</button>
    </div>
  `;
  mypageBody.querySelectorAll('.allergy-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.allergen;
      const list = store.allergies || (store.allergies = []);
      const i = list.indexOf(key);
      if(i >= 0) list.splice(i, 1); else list.push(key);
      saveState();
      renderMypage();   // 칩 상태만 바뀌므로 통째로 다시 그려도 부담이 없다
    });
  });
  document.getElementById('tabSaved').addEventListener('click', () => { mypageTab='saved'; renderMypage(); });
  document.getElementById('tabVisited').addEventListener('click', () => { mypageTab='visited'; renderMypage(); });
  document.getElementById('tabPass').addEventListener('click', () => { mypageTab='pass'; renderMypage(); });
  if(isAdmin){
    const tabAdminBtn = document.getElementById('tabAdmin');
    if(tabAdminBtn) tabAdminBtn.addEventListener('click', () => { mypageTab='admin'; renderMypage(); });
  }
  if(isAdminTab){
    mypageBody.querySelectorAll('.admin-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.admin-contact-card');
        const id = card.dataset.id;
        const ownerEmail = card.querySelector('.admin-owner-email').value.trim();
        const restaurantId = card.querySelector('.admin-restaurant-id').value.trim();
        const errEl = card.querySelector('.admin-approve-error');
        errEl.textContent = '';
        if(!restaurantId){ errEl.textContent = '가게 슬러그를 입력해주세요.'; return; }
        if(!ownerEmail){ errEl.textContent = '가입 이메일을 입력해주세요.'; return; }
        btn.disabled = true;
        submitAdminApprove(id, restaurantId, ownerEmail).then(res => {
          btn.disabled = false;
          if(res.ok) renderMypage();
          else errEl.textContent = res.error === 'not_signed_up'
            ? '아직 가입 전이에요 — 가입 후 다시 시도해주세요.'
            : '처리에 실패했어요. 다시 시도해주세요.';
        });
      });
    });
    mypageBody.querySelectorAll('.admin-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.admin-contact-card');
        submitAdminStatus(card.dataset.id, btn.dataset.status).then(res => { if(res.ok) renderMypage(); });
      });
    });
  }
  // 되돌리기: 담기 해제 · 방문 취소 · 식권 예약 취소는 전부 같은 확인 모달을 거친다
  // (식권 취소 버튼도 같은 .mypage-remove-btn 스타일을 쓰므로, :not()으로 중복 바인딩을 막는다)
  mypageBody.querySelectorAll('.mypage-remove-btn:not(.mypage-cancel-pass-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = restaurants.find(x => x.name === btn.dataset.name);
      const field = mypageTab === 'saved' ? 'saved' : 'visited';
      const question = mypageTab === 'saved' ? unsaveQuestion(r) : (t('mypageConfirmUnvisit')||'방문 기록을 취소하시겠습니까?');
      openConfirm({
        emoji:'↩️', title: rName(r), text: question, okLabel:t('confirmOk')||'확인', cancelLabel:t('confirmNo')||'아니요',
        onOk: () => { r[field] = false; if(field === 'saved') r.visited = false; saveState(); pushMark(r); renderCards(); renderMypage(); closeConfirm(); }
      });
    });
  });
  mypageBody.querySelectorAll('.mypage-cancel-pass-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const o = store.passOrders.find(x => String(x.id) === id);
      if(!o) return;
      openConfirm({
        emoji:'↩️', title: o.place, text:t('mypageConfirmCancelPass')||'이 식권 예약을 취소하시겠습니까?', okLabel:t('mypageCancelPassOk')||'예약 취소', cancelLabel:t('confirmNo')||'아니요',
        onOk: () => {
          store.passOrders = store.passOrders.filter(x => String(x.id) !== id);
          saveState();
          deletePassOrder(id);
          renderMypage();
          closeConfirm();
        }
      });
    });
  });
}

function renderMypagePlaceList(){
  const list = restaurants.filter(r => mypageTab === 'saved' ? r.saved : r.visited);
  if(list.length === 0) return `<div class="mypage-empty">${mypageTab==='saved' ? (t('mypageEmptySaved')||'아직 저장한 맛집이 없어요.') : (t('mypageEmptyVisited')||'아직 방문 기록이 있는 맛집이 없어요.')}</div>`;
  return list.map(r => `
    <div class="survey-result-card">
      <span class="emoji">${r.emoji}</span>
      <div class="info">
        <strong>${rName(r)}</strong>
        <span>${rCat(r)} · ${ratingLabel(r)} · ${rDesc(r)}</span>
      </div>
      <button type="button" class="mypage-remove-btn" data-name="${escapeHtml(r.name)}" title="${mypageTab==='saved' ? (t('mypageRemoveSavedTitle')||'가보고 싶은 곳에서 해제') : (t('mypageRemoveVisitedTitle')||'방문 기록 취소')}">✕</button>
    </div>
  `).join('');
}

function renderMypagePassList(){
  if(store.passOrders.length === 0){
    return `<div class="mypage-empty">${t('mypageEmptyPass') || '아직 예약한 식권이 없어요.<br>손주 식권 섹션에서 마음에 드는 가게를 골라보세요.'}</div>`;
  }
  return store.passOrders.map(o => `
    <div class="survey-result-card">
      <span class="emoji">${o.emoji}</span>
      <div class="info">
        <strong>${escapeHtml(o.place)}</strong>
        <span>${passUnit(o.count + o.bonus)} (${passUnit(o.count)}${o.bonus ? ` + ${t('mypagePassBonusWord')||'보너스'} ${passUnit(o.bonus)}` : ''}) · ${wonSuffix(o.total)} · ${(t('mypagePassDateLine')||'{date} 예약').replace('{date}', escapeHtml(o.at))}</span>
      </div>
      <button type="button" class="mypage-remove-btn mypage-cancel-pass-btn" data-id="${o.id}" title="${t('mypageCancelPassTitle')||'예약 취소'}">✕</button>
    </div>
  `).join('');
}

// ---- 관리자 탭: 사장님 제휴 등 문의 승인 (마이페이지 안, isAdmin일 때만 보임) ----
const ADMIN_STATUS_LABEL = { new:'신규', contacted:'연락함', approved:'승인됨', rejected:'거절' };

function renderMypageAdminList(){
  if(adminContacts.length === 0) return `<div class="mypage-empty">아직 들어온 문의가 없어요.</div>`;
  return adminContacts.map(c => `
    <div class="survey-result-card admin-contact-card" data-id="${escapeHtml(c.id)}" style="flex-direction:column;align-items:stretch;gap:8px;">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;">
        <strong>${escapeHtml(c.name)} <span style="font-weight:400;color:var(--ink-soft);font-size:0.82rem;">(${escapeHtml(c.type)})</span></strong>
        <span class="badge-live" style="white-space:nowrap;">${ADMIN_STATUS_LABEL[c.status] || escapeHtml(c.status)}</span>
      </div>
      <div style="font-size:0.84rem;color:var(--ink-soft);">
        ${escapeHtml(c.reach)}${c.field ? ' · ' + escapeHtml(c.field) : ''}
        ${c.message ? '<br>' + escapeHtml(c.message) : ''}
        <br>${escapeHtml(String(c.created_at || '').slice(0, 16).replace('T', ' '))}
      </div>
      ${c.type === 'partnerStore' && c.status !== 'approved' ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <input type="text" class="review-select admin-owner-email" placeholder="가입 이메일" value="${escapeHtml(c.reach)}" style="flex:1;min-width:140px;height:38px;padding:0 10px;">
          <input type="text" class="review-select admin-restaurant-id" placeholder="가게 슬러그" style="flex:1;min-width:120px;height:38px;padding:0 10px;">
          <button type="button" class="btn-primary admin-approve-btn" style="padding:8px 14px;font-size:0.82rem;white-space:nowrap;">사장님으로 등록</button>
        </div>
        <p class="auth-error admin-approve-error" style="margin:0;"></p>
      ` : ''}
      <div style="display:flex;gap:6px;">
        <button type="button" class="btn-ghost admin-status-btn" data-status="contacted" style="padding:6px 12px;font-size:0.78rem;">연락함</button>
        <button type="button" class="btn-ghost admin-status-btn" data-status="rejected" style="padding:6px 12px;font-size:0.78rem;">거절</button>
      </div>
    </div>
  `).join('');
}

function adminAuthHeaders(){
  if(!sb) return Promise.resolve(null);
  return sb.auth.getSession().then(({ data }) => data.session ? {
    'Content-Type':'application/json',
    'Authorization':'Bearer ' + data.session.access_token,
  } : null);
}

function applyAdminItemUpdate(item){
  if(!item) return;
  const idx = adminContacts.findIndex(c => c.id === item.id);
  if(idx >= 0) adminContacts[idx] = item;
}

function submitAdminApprove(id, restaurantId, ownerEmail){
  return adminAuthHeaders().then(headers => {
    if(!headers) return { ok:false, error:'no_session' };
    return fetch('/api/admin-contacts', {
      method:'POST', headers,
      body: JSON.stringify({ action:'approve', id, restaurantId, ownerEmail }),
    }).then(r => r.json());
  }).then(data => { applyAdminItemUpdate(data.item); return data; }, () => ({ ok:false, error:'network' }));
}

function submitAdminStatus(id, status){
  return adminAuthHeaders().then(headers => {
    if(!headers) return { ok:false, error:'no_session' };
    return fetch('/api/admin-contacts', {
      method:'POST', headers,
      body: JSON.stringify({ action:'setStatus', id, status }),
    }).then(r => r.json());
  }).then(data => { applyAdminItemUpdate(data.item); return data; }, () => ({ ok:false, error:'network' }));
}

// ---- 섹션별 초기화 ----
// 전체 초기화만 있으면 "식권만 비우고 싶은데 저장목록까지 날아가는" 상황이 생긴다.
// 지금 보고 있는 탭 하나만 비우는 길을 따로 둔다. 탭별로 건드리는 데이터는 여기 한 곳에만 적는다.
const SECTION_RESET = {
  saved:{
    emoji:'💌',
    labelKey:'mypageResetSaved',  labelKo:'가보고 싶은 곳 비우기',
    titleKey:'resetSavedTitle',   titleKo:'가보고 싶은 곳 비우기',
    bodyKey:'resetSavedBody',     bodyKo:'저장해둔 곳을 모두 비워요. 가본 곳 기록과 식권 예약은 그대로 남아요.',
    apply: () => { restaurants.forEach(r => { r.saved = false; }); },
  },
  visited:{
    emoji:'🍚',
    labelKey:'mypageResetVisited', labelKo:'가본 곳 기록 비우기',
    titleKey:'resetVisitedTitle',  titleKo:'가본 곳 기록 비우기',
    bodyKey:'resetVisitedBody',    bodyKo:'가본 곳 표시를 모두 지워요. 저장 목록과 내가 쓴 리뷰는 그대로 남아요.',
    apply: () => { restaurants.forEach(r => { r.visited = false; }); },
  },
  pass:{
    emoji:'🎟️',
    labelKey:'mypageResetPass',   labelKo:'식권 예약 내역 비우기',
    titleKey:'resetPassTitle',    titleKo:'식권 예약 내역 비우기',
    bodyKey:'resetPassBody',      bodyKo:'식권 예약 내역을 모두 지워요. 저장 목록과 가본 곳 기록은 그대로 남아요.',
    apply: () => { store.passOrders = []; },
    sync: deleteAllPassOrders,
  },
};

function sectionResetLabel(tab){
  const s = SECTION_RESET[tab];
  return s ? (t(s.labelKey) || s.labelKo) : '';
}

function resetSection(tab){
  const s = SECTION_RESET[tab];
  if(!s) return;
  openConfirm({
    emoji:s.emoji,
    title:t(s.titleKey) || s.titleKo,
    text:t(s.bodyKey) || s.bodyKo,
    okLabel:t('resetOk') || '초기화',
    cancelLabel:t('resetCancel') || '취소',
    onOk: () => {
      s.apply();
      saveState();
      (s.sync || pushAllMarks)();
      renderCards();
      renderMypage();
      closeConfirm();
    }
  });
}

// 손주 계정에 쌓인 활동(담기·방문·내 리뷰·식권 예약)을 한 번에 되돌리는 초기화 버튼
function resetMyData(){
  openConfirm({
    emoji:'🧹',
    title:t('resetTitle') || '내 활동 기록 초기화',
    text:t('resetBody') || '저장한 곳, 방문 기록, 내가 쓴 리뷰, 식권 예약을 모두 초기화해요. 되돌릴 수 없어요.',
    okLabel:t('resetOk') || '초기화',
    cancelLabel:t('resetCancel') || '취소',
    onOk: () => {
      restaurants.forEach(r => { r.saved = false; r.visited = false; });
      store.reviews = store.reviews.filter(rv => !(isLoggedIn && rv.userId === currentUserId));
      store.passOrders = [];
      store.reviewLikes = {};
      store.myLikedReviews = [];
      saveState();
      pushAllMarks();
      deleteAllMyReviews();
      deleteAllPassOrders();
      renderCards();
      renderReviews();
      renderMypage();
      closeConfirm();
    }
  });
}

// ================= 리뷰 작성 =================
// 노출 조건: 로그인 + 방문 완료로 표시한 맛집이 1곳 이상 (extra.md §3)
const reviewFormOverlay = document.getElementById('reviewFormOverlay');
const reviewFormBody = document.getElementById('reviewFormBody');
const REVIEW_MAX = 300;
let reviewRating = 5;
let reviewPhoto = '';

function openReviewForm(){
  if(!requireLogin('review')) return;
  if(restaurants.filter(r => r.visited).length === 0){
    openConfirm({
      emoji:'📝',
      title:t('reviewFormNoVisitTitle') || '아직 리뷰를 남길 수 없어요',
      text:t('reviewFormNoVisitBody') || '방문 완료로 표시한 맛집에만 리뷰를 남길 수 있어요.',
      okLabel:t('reviewFormNoVisitOk') || '맛집 보러가기',
      cancelLabel:t('closeBtn') || '닫기',
      onOk: () => { closeConfirm(); document.getElementById('restaurants').scrollIntoView({behavior:'smooth'}); }
    });
    return;
  }
  reviewRating = 5;
  reviewPhoto = '';
  renderReviewForm();
  reviewFormOverlay.classList.add('show');
}
function closeReviewForm(){ reviewFormOverlay.classList.remove('show'); }

// 써놓은 리뷰가 날아가는 건 설문 중간에 나가는 것과 같은 성격이라 같은 확인창을 쓴다.
// 아직 아무것도 안 썼으면 묻지 않는다(별점은 기본값 5라 "쓴 것"으로 치지 않는다).
// 제출이 끝난 완료 화면에는 #reviewText가 없으므로 자동으로 그냥 닫힌다.
function reviewFormDirty(){
  const ta = document.getElementById('reviewText');
  return !!((ta && ta.value.trim()) || reviewPhoto);
}
function requestCloseReviewForm(){
  if(reviewFormDirty()) confirmDiscard(closeReviewForm);
  else closeReviewForm();
}
function closeReviewFormOnOverlay(e){ if(e.target === reviewFormOverlay) requestCloseReviewForm(); }

function renderReviewForm(){
  const visitedList = restaurants.filter(r => r.visited);
  reviewFormBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">📝</div>
      <h3>${t('reviewFormTitle') || '나도 리뷰 남기기'}</h3>
      <p>${t('reviewFormSub') || '다녀온 맛집의 솔직한 후기를 남겨주세요.'}</p>
    </div>
    <form id="reviewForm">
      <div class="auth-field">
        <label>${t('reviewRatingLabel') || '평점'}</label>
        <div class="review-star-pick" id="reviewStars">
          ${[1,2,3,4,5].map(n => `<button type="button" class="review-star ${n<=reviewRating?'on':''}" data-score="${n}" aria-label="${n}점">★</button>`).join('')}
        </div>
      </div>
      <div class="auth-field">
        <label>${t('reviewPlaceLabel') || '방문한 곳'}</label>
        <select id="reviewPlace" class="review-select">
          ${visitedList.map(r => `<option value="${escapeHtml(r.id || r.name)}" data-name="${escapeHtml(r.name)}">${r.emoji} ${escapeHtml(rName(r))}</option>`).join('')}
        </select>
      </div>
      <div class="auth-field">
        <label>${t('reviewVisibilityLabel') || '공개 방식'}</label>
        <div class="review-radio-row">
          <label class="review-radio"><input type="radio" name="reviewVisibility" value="real" checked> ${(t('reviewVisibilityReal')||'실명 ({name})').replace('{name}', escapeHtml(currentUserName || (currentLang==='ko'?'손주':(t('grandchildDefaultName')||'Grandchild'))))}</label>
          <label class="review-radio"><input type="radio" name="reviewVisibility" value="anon"> ${t('reviewVisibilityAnon') || '익명'}</label>
        </div>
      </div>
      <div class="auth-field">
        <label>${t('reviewPhotoLabel') || '사진 첨부'} <span class="review-optional">${t('reviewOptional') || '선택'}</span></label>
        <input type="file" id="reviewPhotoInput" accept="image/*" class="review-file">
        <div id="reviewPhotoPreview"></div>
      </div>
      <div class="auth-field">
        <label>${t('reviewContentLabel') || '리뷰 내용'}</label>
        <textarea id="reviewText" class="review-textarea" maxlength="${REVIEW_MAX}" placeholder="${t('reviewContentPh') || '어떤 점이 좋았나요?'}"></textarea>
        <div class="review-counter"><span id="reviewCount">0</span>/${REVIEW_MAX}${currentLang==='ko'?'자':(t('reviewCharUnit')||'')}</div>
      </div>
      <p class="auth-error" id="reviewError"></p>
      <div class="game-action-row">
        <button type="button" class="btn-ghost" style="flex:1;" onclick="closeReviewForm()">${t('closeBtn') || '닫기'}</button>
        <button type="submit" class="survey-close-btn" style="flex:1;">${t('reviewSubmitBtn') || '리뷰 등록하기'}</button>
      </div>
    </form>
  `;

  const starBtns = document.querySelectorAll('#reviewStars .review-star');
  starBtns.forEach(b => {
    // 별점만 바꿀 때 폼 전체를 다시 그리면 입력하던 내용이 날아간다 — 클래스만 갱신
    b.addEventListener('click', () => {
      reviewRating = Number(b.dataset.score);
      starBtns.forEach(x => x.classList.toggle('on', Number(x.dataset.score) <= reviewRating));
    });
  });

  const ta = document.getElementById('reviewText');
  const counter = document.getElementById('reviewCount');
  ta.addEventListener('input', () => { counter.textContent = ta.value.length; });

  document.getElementById('reviewPhotoInput').addEventListener('change', handleReviewPhoto);
  document.getElementById('reviewForm').addEventListener('submit', submitReview);
}

// 고른 사진을 지정한 최대 변으로 줄여 JPEG data URL로 돌려준다.
// 원본 base64를 그대로 쓰면 localStorage 용량 한도를 금방 넘기고(리뷰 사진),
// 업로드도 그만큼 느려진다(방문 인증). 두 곳이 같은 규칙을 쓰도록 여기 한 곳에 둔다.
function readImageAsDataUrl(file, max = 800){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode_failed'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function handleReviewPhoto(e){
  const file = e.target.files && e.target.files[0];
  const preview = document.getElementById('reviewPhotoPreview');
  if(!file){ reviewPhoto = ''; preview.innerHTML = ''; return; }
  readImageAsDataUrl(file).then(dataUrl => {
    reviewPhoto = dataUrl;
    preview.innerHTML = `<img class="review-photo" src="${reviewPhoto}" alt="첨부한 사진 미리보기">`;
  }).catch(() => { reviewPhoto = ''; preview.innerHTML = ''; });
}

function submitReview(e){
  e.preventDefault();
  const errEl = document.getElementById('reviewError');
  const text = document.getElementById('reviewText').value.trim();
  errEl.textContent = '';
  if(!text){
    errEl.textContent = t('reviewErrEmpty') || '리뷰 내용을 입력해주세요.';
    return;
  }
  const anonymous = document.querySelector('input[name="reviewVisibility"]:checked').value === 'anon';
  const placeSelect = document.getElementById('reviewPlace');
  const placeOpt = placeSelect.options[placeSelect.selectedIndex];
  const placeName = placeOpt ? placeOpt.dataset.name : placeSelect.value;
  const restaurantId = restaurants.some(x => x.id === placeSelect.value) ? placeSelect.value : null;
  const reviewObj = {
    id: crypto.randomUUID(),
    userId: currentUserId,
    restaurantId,
    name: anonymous ? (t('anonReviewerName')||'익명의 손주') : (currentUserName ? `${currentUserName}${t('namedReviewerSuffix')||' 손주'}` : (t('defaultReviewerName')||'손주')),
    emoji: anonymous ? '🙈' : '🌱',
    stars: reviewRating,
    place: placeName,
    text,
    photo: reviewPhoto || '',
    at: new Date().toISOString().slice(0, 10),
  };
  store.reviews.unshift(reviewObj);
  const stored = saveState();
  renderReviews();
  pushReview(reviewObj);
  reviewFormBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>${t('reviewSuccessTitle') || '리뷰가 등록됐어요!'}</h3>
      <p>${stored
        ? (t('reviewSuccessBodyOk') || '소중한 후기 고맙습니다. 리뷰 목록에 바로 반영했어요.')
        : (t('reviewSuccessBodyFail') || '리뷰 목록에 반영했어요. 다만 사진 용량이 커서 저장하진 못했어요 — 새로고침하면 사라질 수 있어요.')}</p>
      <div class="game-action-row">
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeReviewForm()">${t('confirmOk') || '확인'}</button>
      </div>
    </div>
  `;
}

// ================= 언어 선택 =================
// SUPPORTED_LANGS(ko/en/zh/es/fr/de/ja)는 실제로 동작(전체 경로 번역, applyLanguage 참고).
const langOverlay = document.getElementById('langOverlay');
const langBody = document.getElementById('langBody');
const SUPPORTED_LANGS = ['ko', 'en', 'zh', 'es', 'fr', 'de', 'ja'];

// 각 언어 이름은 해당 언어 표기로 (영어를 원하면 English 버튼을 누르도록)
const languages = [
  {code:'ko', label:'한국어',   flag:'🇰🇷', note:'기본 언어'},
  {code:'en', label:'English',  flag:'🇺🇸', note:'English'},
  {code:'zh', label:'中文',     flag:'🇨🇳', note:'Chinese'},
  {code:'ja', label:'日本語',   flag:'🇯🇵', note:'Japanese'},
  {code:'fr', label:'Français', flag:'🇫🇷', note:'French'},
  {code:'es', label:'Español',  flag:'🇪🇸', note:'Spanish'},
  {code:'de', label:'Deutsch',  flag:'🇩🇪', note:'German'},
];

function openLang(){
  renderLang();
  langOverlay.classList.add('show');
}
function closeLang(){ langOverlay.classList.remove('show'); }
function closeLangOnOverlay(e){ if(e.target === langOverlay) closeLang(); }

function renderLang(){
  langBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">🌐</div>
      <h3>언어 선택 / Language</h3>
      <p>한국어·English·中文·Español·Français·Deutsch·日本語 모두 바로 적용돼요.</p>
    </div>
    <div class="lang-grid">
      ${languages.map(l => `
        <button type="button" class="lang-btn ${currentLang===l.code?'active':''}" data-code="${l.code}">
          <span class="lang-flag">${l.flag}</span>
          <span class="lang-name">${l.label}</span>
        </button>
      `).join('')}
    </div>
    <p class="lang-selected" id="langSelected"></p>
    <button type="button" class="survey-close-btn" onclick="closeLang()">닫기</button>
  `;
  langBody.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const picked = languages.find(l => l.code === code);
      if(SUPPORTED_LANGS.includes(code)){
        applyLanguage(code);
        renderLang();
        document.getElementById('langSelected').textContent = `✔ ${picked.label} 적용됨`;
      } else {
        renderLang();
        document.getElementById('langSelected').textContent = `${picked.label} — 정식 오픈 때 제공될 예정이에요`;
      }
    });
  });
}

// ================= 커뮤니티 (실시간 소통은 외부 SNS 그룹에서 진행) =================
// 그룹이 만들어지면 이 상수 하나만 채우면 된다 — 링크가 바뀌어도 여기 한 곳만 고치면 됨.
const COMMUNITY_LINK = '';
const communityOverlay = document.getElementById('communityOverlay');
const communityBody = document.getElementById('communityBody');

function openCommunity(){
  renderCommunity();
  communityOverlay.classList.add('show');
}
function closeCommunity(){ communityOverlay.classList.remove('show'); }
function closeCommunityOnOverlay(e){ if(e.target === communityOverlay) closeCommunity(); }

function renderCommunity(){
  const joinBtn = COMMUNITY_LINK
    ? `<a class="btn-primary" style="flex:1;text-align:center;" href="${escapeHtml(COMMUNITY_LINK)}" target="_blank" rel="noopener">${t('communityJoinBtn') || '그룹 참여하기'}</a>`
    : `<button type="button" class="btn-primary" style="flex:1;" onclick="closeCommunity(); openToast('info');">${t('communityJoinBtn') || '그룹 참여하기'}</button>`;
  communityBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">🗨️</div>
      <h3>${t('communityTitle') || '커뮤니티에 놀러오세요'}</h3>
      <p>${t('communityBody') || '실시간 소통은 카카오톡·인스타그램 같은 외부 SNS 그룹에서 진행돼요. 이 사이트는 참여 링크와 QR코드만 안내해드려요.'}</p>
    </div>
    <div class="detail-stub-note">
      ${COMMUNITY_LINK ? (t('communityQrReady') || '아래 QR코드를 스캔하거나 버튼을 눌러 참여해보세요.') : (t('communityQrSoon') || '아직 그룹이 만들어지기 전이에요. 그룹이 열리면 여기에 QR코드가 표시될 예정이에요.')}
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="closeCommunity()">${t('closeBtn') || '닫기'}</button>
      ${joinBtn}
    </div>
  `;
}

// ================= 서비스 소개 (extra.md §4-1) =================
const SERVICE_VERSION = 'v0.1 베타';
const introOverlay = document.getElementById('introOverlay');
const introBody = document.getElementById('introBody');

function openIntro(){
  renderIntro();
  introOverlay.classList.add('show');
}
function closeIntro(){ introOverlay.classList.remove('show'); }
function closeIntroOnOverlay(e){ if(e.target === introOverlay) closeIntro(); }

function renderIntro(){
  introBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">🌾</div>
      <span class="intro-version">${SERVICE_VERSION}</span>
      <h3>밥 먹으러 와</h3>
      <p>${t('introSub') || '조치원읍 로컬 맛집 발견 서비스'}</p>
    </div>
    <div class="intro-vision">${t('introVision') || '지도에 없거나 부실하게 등록된 우리 동네 진짜 맛집을 발굴하고, 소비자와 상인이 함께 상생하는 로컬 상권 생태계를 만든다'}</div>
    <div class="intro-block">
      <h4>${t('introOverviewHead') || '프로젝트 개요'}</h4>
      <p>${t('introOverviewBody') || '"KU조대! 사장님을 부탁해" — 고려대학교 세종캠퍼스 사회공헌 프로젝트로 시작된 학생 주도 서비스예요. 네이버·카카오맵에 등록이 안 됐거나, 등록은 했어도 정보가 부실한 조치원읍 로컬 맛집을 학생과 주민이 직접 발굴해 소개합니다.'}</p>
    </div>
    <div class="intro-block">
      <h4>${t('introMakerHead') || '만든 사람'}</h4>
      <p>${t('introMakerBody') || '고려대학교 세종캠퍼스 경제정책학전공 학생 팀 <b>맛집 KU조대</b>가 기획·개발한 사회공헌 프로젝트입니다.'}</p>
    </div>
    <div class="intro-block">
      <h4>${t('introProgressHead') || '진행 상황'}</h4>
      <p>${t('introProgressBody') || '현재는 사전 신청을 받는 준비 단계예요. 9월 개강 이후 현장 조사로 실제 맛집 데이터를 채워 정식 서비스를 시작할 예정입니다.'}</p>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="closeIntro(); openFaq();">${t('introFaqBtn') || '자주 묻는 질문'}</button>
      <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeIntro()">${t('closeBtn') || '닫기'}</button>
    </div>
  `;
}

// ================= 문의하기 — FAQ (extra.md §4-2) =================
const faqs = [
  {q:'밥 먹으러 와는 어떤 서비스인가요?',
   a:'"KU조대! 사장님을 부탁해" 프로젝트에서 만든 서비스예요. 네이버·카카오맵 등 온라인 지도에 등록이 안 됐거나, 등록은 했어도 정보가 부실한 조치원읍 로컬 맛집을 학생과 주민이 직접 발굴하고 소개해요.'},
  {q:'아직 정식 오픈 전인가요?',
   a:'네, 현재는 사전 신청을 받고 있는 준비 단계이며, 9월 개강 이후 실제 맛집 데이터를 채워 정식 서비스를 시작할 예정이에요.'},
  {q:'저희 가게도 등록할 수 있나요?',
   a:'네! 사장님 등록 페이지를 준비 중이에요. "사장님이신가요?" 버튼을 통해 순차적으로 안내드릴 예정입니다.'},
  {q:'리뷰는 아무나 쓸 수 있나요?',
   a:'방문 완료로 표시한 맛집에 한해 로그인한 회원만 리뷰를 작성할 수 있어요. 허위 리뷰를 방지하기 위한 최소한의 장치예요.'},
  {q:'제가 남긴 개인정보는 어떻게 쓰이나요?',
   a:'개인정보처리방침에 명시된 목적(회원 식별, 서비스 제공) 외에는 사용하지 않으며, 관련 법령에 따라 안전하게 관리돼요.'},
  {q:'봉사활동이나 팀원으로 참여하고 싶어요.',
   a:'"손주 힘 보태기" 메뉴를 통해 참여·후원 문의를 남겨주시면 안내드릴게요.'},
];
const faqOverlay = document.getElementById('faqOverlay');
const faqBody = document.getElementById('faqBody');
let faqOpenIndex = -1;

function openFaq(){
  faqOpenIndex = -1;
  renderFaq();
  faqOverlay.classList.add('show');
}
function closeFaq(){ faqOverlay.classList.remove('show'); }
function closeFaqOnOverlay(e){ if(e.target === faqOverlay) closeFaq(); }

function renderFaq(){
  const useTranslated = currentLang !== 'ko';
  faqBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">💬</div>
      <h3>${t('faqTitle') || '문의하기'}</h3>
      <p>${t('faqSub') || '자주 묻는 질문을 먼저 확인해보세요.'}</p>
    </div>
    <div class="faq-list">
      ${faqs.map((f, i) => `
        <div class="faq-item ${i===faqOpenIndex?'open':''}">
          <button type="button" class="faq-q" data-index="${i}">
            <span class="faq-mark">Q${i+1}</span>
            <span>${escapeHtml(useTranslated ? (t(`faqQ${i+1}`) || f.q) : f.q)}</span>
            <span class="faq-arrow">▾</span>
          </button>
          <div class="faq-a">${escapeHtml(useTranslated ? (t(`faqA${i+1}`) || f.a) : f.a)}</div>
        </div>
      `).join('')}
    </div>
    <div class="faq-foot">
      ${t('faqFootPrefix') || '찾는 답이 없다면 '}<b>${t('faqFootBold') || '손주 힘 보태기'}</b>${t('faqFootSuffix') || '로 직접 문의를 남겨주세요.'}<br>
      <a href="privacy.html" style="text-decoration:underline;">${t('footerPrivacyLink') || '개인정보처리방침'}</a> ·
      <a href="terms.html" style="text-decoration:underline;">${t('footerTermsLink') || '이용약관'}</a>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="closeFaq(); openSupport();">${t('faqContactBtn') || '문의 남기기'}</button>
      <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeFaq()">${t('closeBtn') || '닫기'}</button>
    </div>
  `;
  // 아코디언: 열려 있는 항목을 다시 누르면 접힌다 (한 번에 하나만 열림)
  faqBody.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      faqOpenIndex = (faqOpenIndex === i) ? -1 : i;
      renderFaq();
    });
  });
}

// ================= 참여 / 후원 / 확장 문의 (extra.md §7) =================
// 백엔드가 없어 접수 확인 화면까지만 동작한다 — Supabase 연동 시 submitContact()만 교체하면 된다.
const contactOverlay = document.getElementById('contactOverlay');
const contactBody = document.getElementById('contactBody');

const contactTypes = {
  team:{
    key:'ct_team',
    emoji:'🙋',
    title:'팀원으로 참여하고 싶어요',
    sub:'함께 만들어갈 손주를 기다리고 있어요.',
    note:'기획·개발·디자인·현장 조사 등 어느 자리든 좋아요. 남겨주신 연락처로 순차적으로 안내드릴게요.',
    fieldLabel:'참여 희망 분야',
    options:['현장 조사 (맛집 발굴)','기획 / 운영','디자인','개발','홍보 / 콘텐츠','아직 못 정했어요'],
    messageLabel:'하고 싶은 말',
    messagePlaceholder:'참여하고 싶은 이유나 가능한 활동 시간을 자유롭게 적어주세요.',
  },
  sponsor:{
    key:'ct_sponsor',
    emoji:'🌱',
    title:'후원하고 싶어요',
    sub:'작은 보탬이 동네 맛집 한 곳을 더 발굴합니다.',
    note:'현재는 비영리 취지로 운영 중이라, 후원금은 현장 조사·운영 비용으로만 사용할 예정이에요.',
    fieldLabel:'후원 방식',
    options:['일시 후원','정기 후원','물품 / 재능 기부','아직 상담만 원해요'],
    messageLabel:'후원 관련 메시지',
    messagePlaceholder:'후원과 관련해 궁금한 점이나 전하고 싶은 말씀을 적어주세요.',
  },
  partnerStore:{
    key:'ct_partnerStore',
    emoji:'🧑‍🍳',
    title:'사장님 제휴 신청',
    sub:'식권과 학생 혜택을 함께 준비해요.',
    note:'입점과 제휴 신청은 무료예요. 식권 혜택과 유효기간은 사장님이 직접 정하시고, 수수료 구조는 아직 확정되지 않아 협의 단계입니다.',
    fieldLabel:'희망 혜택',
    options:['식권 10+1','학생 할인','세트 메뉴 할인','아직 상담만 원해요'],
    messageLabel:'가게 소개 · 하고 싶은 말',
    messagePlaceholder:'가게 이름과 위치, 어떤 혜택을 생각하고 계신지 적어주세요.',
  },
  partnerOrg:{
    key:'ct_partnerOrg',
    emoji:'🎓',
    title:'학생회 · 동아리 제휴 문의',
    sub:'우리 단체 회원이 쓸 혜택을 함께 만들어요.',
    note:'고려대학교 세종캠퍼스에는 이미 KU 멤버십처럼 제휴 식당이 있어요. 지도에 없던 로컬 식당도 같은 자리에 설 수 있게 연결해드리려 합니다 — 다만 아직 협의 단계라 확정된 조건은 없어요.',
    fieldLabel:'단체 유형',
    options:['학생회','동아리','교내 기관','기타 단체'],
    messageLabel:'제휴 희망 내용',
    messagePlaceholder:'단체 이름과 인원, 어떤 혜택을 원하시는지 알려주세요.',
  },
  expand:{
    key:'ct_expand',
    emoji:'📍',
    title:'우리 동네 로컬 맛집도 찾아주세요',
    sub:'조치원이 아니어도, 이 취지에 공감한다면.',
    note:'수익 모델은 아직 확정되지 않았어요. 현재는 비영리 취지의 확장 논의 단계이며, 함께할 방법을 같이 찾아보고 있습니다.',
    fieldLabel:'제안하는 지역',
    options:null,
    messageLabel:'제안 내용',
    messagePlaceholder:'어떤 동네인지, 어떤 점에서 이 서비스가 필요한지 알려주세요.',
  },
};

function openSupport(){
  renderSupportChoice();
  contactOverlay.classList.add('show');
}
function openContact(type, showBack){
  renderContactForm(type, showBack);
  contactOverlay.classList.add('show');
}
function closeContact(){ contactOverlay.classList.remove('show'); }

// 문의 폼도 마찬가지. 이름칸은 로그인하면 미리 채워져 있어서 "쓴 것"으로 치지 않는다.
// 선택 화면(renderSupportChoice)과 접수 완료 화면에는 이 입력칸들이 없어 그냥 닫힌다.
function contactFormDirty(){
  const msg = document.getElementById('contactMessage');
  const reach = document.getElementById('contactReach');
  return !!((msg && msg.value.trim()) || (reach && reach.value.trim()));
}
function requestCloseContact(){
  if(contactFormDirty()) confirmDiscard(closeContact);
  else closeContact();
}
function closeContactOnOverlay(e){ if(e.target === contactOverlay) requestCloseContact(); }

function renderSupportChoice(){
  contactBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">🤝</div>
      <h3>${t('supportTitle') || '손주 힘 보태기'}</h3>
      <p>${t('supportSub') || '이 프로젝트에 함께할 손길을 기다려요.'}</p>
    </div>
    <div class="game-choice-grid">
      <button type="button" class="game-choice-btn" data-type="team">
        <span class="icon">🙋</span>
        <span>
          <strong>${t('supportTeamTitle') || '팀원으로 참여하고 싶어요'}</strong>
          <span class="desc">${t('supportTeamDesc') || '현장 조사부터 기획·개발까지, 함께할 자리가 열려 있어요.'}</span>
        </span>
      </button>
      <button type="button" class="game-choice-btn" data-type="sponsor">
        <span class="icon">🌱</span>
        <span>
          <strong>${t('supportSponsorTitle') || '후원하고 싶어요'}</strong>
          <span class="desc">${t('supportSponsorDesc') || '비영리 취지로 운영되는 프로젝트에 힘을 보태주세요.'}</span>
        </span>
      </button>
    </div>
    <div class="game-action-row">
      <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeContact()">${t('closeBtn') || '닫기'}</button>
    </div>
  `;
  contactBody.querySelectorAll('.game-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => renderContactForm(btn.dataset.type, true));
  });
}

function renderContactForm(type, showBack){
  const c = contactTypes[type] || contactTypes.expand;
  const useTranslated = currentLang !== 'ko';
  const ck = (suffix, fallback) => useTranslated && c.key ? (t(`${c.key}_${suffix}`) || fallback) : fallback;
  // 팀원/후원 선택 화면(renderSupportChoice)을 실제로 거쳐 들어온 경우에만 "뒤로"를 보여준다.
  // showBack을 명시하지 않으면 기존처럼 type이 team/sponsor일 때만 기본으로 뒤로를 보여주고,
  // 메인 페이지 "손주 힘 보태기" 버튼처럼 선택 화면 없이 바로 이 폼으로 들어온 경우엔
  // showBack:false로 명시 호출해 "뒤로"를 감춘다 — 그 뒤로가기가 곧 후원 선택지로 새는 뒷문이 되기 때문.
  const useBack = showBack !== undefined ? showBack : (type === 'team' || type === 'sponsor');
  const backBtn = useBack
    ? `<button type="button" class="btn-ghost" style="flex:1;" id="contactBack">${t('contactBack') || '뒤로'}</button>`
    : `<button type="button" class="btn-ghost" style="flex:1;" onclick="closeContact()">${t('closeBtn') || '닫기'}</button>`;
  const options = useTranslated && c.key ? (c.options || []).map((o, i) => t(`${c.key}_opt${i+1}`) || o) : c.options;
  contactBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">${c.emoji}</div>
      <h3>${escapeHtml(ck('title', c.title))}</h3>
      <p>${escapeHtml(ck('sub', c.sub))}</p>
    </div>
    <div class="contact-note">${escapeHtml(ck('note', c.note))}</div>
    <form id="contactForm">
      <div class="auth-field">
        <label>${t('contactNameLabel') || '이름'}</label>
        <input type="text" id="contactName" placeholder="${t('contactNamePh') || '이름 또는 닉네임'}" value="${escapeHtml(currentUserName || '')}">
      </div>
      <div class="auth-field">
        <label>${t('contactReachLabel') || '연락처 / 이메일'}</label>
        <input type="text" id="contactReach" placeholder="${t('contactReachPh') || '연락 받으실 이메일 또는 전화번호'}">
      </div>
      <div class="auth-field">
        <label>${escapeHtml(ck('field', c.fieldLabel))}</label>
        ${c.options
          ? `<select id="contactField" class="review-select">${c.options.map((o,i) => `<option value="${escapeHtml(o)}">${escapeHtml((options && options[i]) || o)}</option>`).join('')}</select>`
          : `<input type="text" id="contactField" placeholder="${ck('fieldPh', '예) 세종시 도담동, 청주시 사창동')}">`}
      </div>
      <div class="auth-field">
        <label>${escapeHtml(ck('msgLabel', c.messageLabel))} <span class="review-optional">${t('contactMessageOptional') || '선택'}</span></label>
        <textarea id="contactMessage" class="contact-textarea" maxlength="500" placeholder="${escapeHtml(ck('msgPh', c.messagePlaceholder))}"></textarea>
      </div>
      <p class="auth-error" id="contactError"></p>
      <div class="game-action-row">
        ${backBtn}
        <button type="submit" class="survey-close-btn" style="flex:1;">${t('contactSubmitBtn') || '문의 남기기'}</button>
      </div>
    </form>
  `;
  const back = document.getElementById('contactBack');
  if(back) back.addEventListener('click', renderSupportChoice);
  document.getElementById('contactForm').addEventListener('submit', e => submitContact(e, type));
}

function submitContact(e, type){
  e.preventDefault();
  const errEl = document.getElementById('contactError');
  const name = document.getElementById('contactName').value.trim();
  const reach = document.getElementById('contactReach').value.trim();
  errEl.textContent = '';
  if(!name){ errEl.textContent = t('contactErrName') || '이름을 입력해주세요.'; return; }
  if(!isEmailOrPhone(reach)){ errEl.textContent = t('contactErrReach') || '연락 받으실 이메일 또는 전화번호를 정확히 입력해주세요.'; return; }
  const c = contactTypes[type] || contactTypes.expand;
  const useTranslated = currentLang !== 'ko';
  const cTitle = useTranslated && c.key ? (t(`${c.key}_title`) || c.title) : c.title;
  const fieldEl = document.getElementById('contactField');
  const messageEl = document.getElementById('contactMessage');
  // 화면에는 접수 확인만 보여주고 끝났지만, 지금까지 이 문의는 어디에도 남지 않았다 —
  // 관리자가 실제로 확인할 방법이 없었다. store_owners와 같은 철학으로 문의함에 조용히 적재만 한다
  // (RLS가 insert만 열려 있어 클라이언트는 다시 못 읽는다, 관리자는 대시보드 Table Editor로 확인).
  if(sb){
    sb.from('contact_submissions').insert({
      type, name, reach,
      field: fieldEl ? fieldEl.value : null,
      message: messageEl ? messageEl.value.trim() : null,
      user_id: isLoggedIn ? currentUserId : null,
    }).then(ignore, ignore);
  }
  contactBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>${t('contactSuccessTitle') || '문의가 접수됐어요!'}</h3>
      <p>${(t('contactSuccessBody') || '{name} 님, 고맙습니다. 남겨주신 연락처로 안내드릴게요.<br>({type})').replace('{name}', escapeHtml(name)).replace('{type}', escapeHtml(cTitle))}</p>
      <div class="game-action-row">
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeContact()">${t('confirmOk') || '확인'}</button>
      </div>
    </div>
  `;
}

// ================= 손주 식권 (사전 예약) =================
// 실제 결제는 붙이지 않는다 — 선불 식권 판매는 사업자등록·통신판매업 신고·PG 계약이
// 선행돼야 해서, 정식 오픈 전까지는 예약 접수까지만 받는다.
const passOverlay = document.getElementById('passOverlay');
const passBody = document.getElementById('passBody');
const passGrid = document.getElementById('passGrid');
let passIdx = -1;
let passBundleIdx = 0;

function getPassRestaurants(){
  return restaurants.filter(r => r.pass);
}

function renderPassCards(){
  passGrid.innerHTML = getPassRestaurants().map(r => {
    const idx = restaurants.indexOf(r);
    return `
      <div class="pass-card">
        <div class="pass-card-head">
          <span class="pass-emoji">${r.emoji}</span>
          <div>
            <strong>${escapeHtml(rName(r))}</strong>
            <span class="pass-cat">${rCat(r)}</span>
          </div>
        </div>
        <div class="pass-price">${currentLang==='ko' ? `장당 <b>${r.pass.unit.toLocaleString()}원</b>` : `<b>${wonSuffix(r.pass.unit)}</b> ${t('passPerUnit')}`}</div>
        <span class="pass-benefit-chip">🎁 ${escapeHtml(pBenefit(r.pass))}</span>
        <div class="pass-valid">${(t('passValidDays')||'유효기간 {n}일').replace('{n}', r.pass.validDays)}</div>
        <button type="button" class="pass-buy-btn" data-idx="${idx}">${t('passBuyBtn') || '식권 예약하기'}</button>
      </div>
    `;
  }).join('');
  passGrid.querySelectorAll('.pass-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => openPass(Number(btn.dataset.idx)));
  });
}
renderPassCards();

function openPass(idx){
  if(!requireLogin('pass')) return;
  passIdx = idx;
  passBundleIdx = 0;
  renderPassSelect();
  passOverlay.classList.add('show');
}
function closePass(){ passOverlay.classList.remove('show'); }
function closePassOnOverlay(e){ if(e.target === passOverlay) closePass(); }

const passInfoOverlay = document.getElementById('passInfoOverlay');
function openPassInfo(){ passInfoOverlay.classList.add('show'); }
function closePassInfo(){ passInfoOverlay.classList.remove('show'); }
function closePassInfoOnOverlay(e){ if(e.target === passInfoOverlay) closePassInfo(); }

function renderPassSelect(){
  const r = restaurants[passIdx];
  const p = r.pass;
  const picked = p.bundles[passBundleIdx];
  const total = p.unit * picked.count;
  passBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">${r.emoji}</div>
      <h3>${escapeHtml(rName(r))} ${currentLang==='ko' ? '식권' : (t('mealPassWord')||'Meal Pass')}</h3>
      <p>${currentLang==='ko' ? `장당 ${p.unit.toLocaleString()}원` : `${wonSuffix(p.unit)} ${t('passPerUnit')}`} · ${escapeHtml(pBenefit(p))}</p>
    </div>
    <div class="auth-field">
      <label>${t('passHowMany') || '몇 장 담을까요?'}</label>
      <div class="pass-bundle-list">
        ${p.bundles.map((b, i) => `
          <button type="button" class="pass-bundle ${i===passBundleIdx?'selected':''}" data-i="${i}">
            <span class="pass-bundle-count">${passUnit(b.count)}${b.bonus ? ` <b>+${b.bonus}</b>` : ''}</span>
            <span class="pass-bundle-price">${wonSuffix(p.unit * b.count)}</span>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="pass-summary">
      <div class="pass-summary-row"><span>${(t('passSummaryCount')||'식권 {n}장').replace('{n}', picked.count)}</span><span>${wonSuffix(total)}</span></div>
      ${picked.bonus ? `<div class="pass-summary-row bonus"><span>${(t('passSummaryBonus')||'사장님 혜택 +{n}장').replace('{n}', picked.bonus)}</span><span>${wonSuffix(0)}</span></div>` : ''}
      <div class="pass-summary-row total"><span>${t('passSummaryTotal') || '실제 받는 식권'}</span><span>${passUnit(picked.count+picked.bonus)}</span></div>
      <div class="pass-summary-row total"><span>${t('passSummaryAmount') || '결제 예정 금액'}</span><span>${wonSuffix(total)}</span></div>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="closePass()">${t('closeBtn') || '닫기'}</button>
      <button type="button" class="survey-close-btn" style="flex:1;" id="passNext">${t('passNextBtn') || '다음'}</button>
    </div>
  `;
  passBody.querySelectorAll('.pass-bundle').forEach(btn => {
    btn.addEventListener('click', () => { passBundleIdx = Number(btn.dataset.i); renderPassSelect(); });
  });
  document.getElementById('passNext').addEventListener('click', renderPassConfirm);
}

function renderPassConfirm(){
  const r = restaurants[passIdx];
  const p = r.pass;
  const picked = p.bundles[passBundleIdx];
  const total = p.unit * picked.count;
  passBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">🎟️</div>
      <h3>${t('passConfirmTitle') || '이렇게 예약할까요?'}</h3>
      <p>${t('passConfirmSub') || '아래 내용으로 사전 예약을 접수합니다.'}</p>
    </div>
    <div class="pass-summary">
      <div class="pass-summary-row"><span>${t('passSummaryStore') || '가게'}</span><span>${r.emoji} ${escapeHtml(rName(r))}</span></div>
      <div class="pass-summary-row"><span>${t('passSummaryBought') || '구매 식권'}</span><span>${passUnit(picked.count)}</span></div>
      ${picked.bonus ? `<div class="pass-summary-row bonus"><span>${currentLang==='ko' ? '사장님 혜택' : (t('ownerBonusLabel')||'Owner bonus')}</span><span>+${passUnit(picked.bonus)}</span></div>` : ''}
      <div class="pass-summary-row total"><span>${t('passSummaryTotal') || '실제 받는 식권'}</span><span>${passUnit(picked.count+picked.bonus)}</span></div>
      <div class="pass-summary-row total"><span>${t('passSummaryAmount') || '결제 예정 금액'}</span><span>${wonSuffix(total)}</span></div>
      <div class="pass-summary-row"><span>${t('passSummaryValid') || '유효기간'}</span><span>${(t('passSummaryValidVal')||'사용 시작일부터 {n}일').replace('{n}', p.validDays)}</span></div>
    </div>
    <div class="contact-note">${t('passPrepayNote') || '지금은 <b>사전 예약</b>만 접수돼요. 실제 결제는 정식 오픈 때 연동될 예정이라, 지금 단계에서는 돈이 빠져나가지 않아요.'}</div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" id="passBack">${t('passBackBtn') || '뒤로'}</button>
      <button type="button" class="survey-close-btn" style="flex:1;" id="passSubmit">${t('passSubmitBtn') || '사전 예약 접수하기'}</button>
    </div>
  `;
  document.getElementById('passBack').addEventListener('click', renderPassSelect);
  document.getElementById('passSubmit').addEventListener('click', submitPassOrder);
}

function submitPassOrder(){
  track('pass_reserve', {});
  const r = restaurants[passIdx];
  const p = r.pass;
  const picked = p.bundles[passBundleIdx];
  const order = {
    id: crypto.randomUUID(),
    restaurantId: r.id || null,
    place: rName(r),
    emoji: r.emoji,
    count: picked.count,
    bonus: picked.bonus,
    unit: p.unit,
    total: p.unit * picked.count,
    at: new Date().toISOString().slice(0, 10),
  };
  store.passOrders.unshift(order);
  const stored = saveState();
  pushPassOrder(order);
  // ko 폴백 템플릿은 '{n}장'이 붙어 있어 단위까지 포함해 통째로 치환해야 하고,
  // en/zh 사전 값은 단위를 이미 문구 안에 풀어써 뒀으므로 숫자만 넘긴다.
  const passCount = currentLang==='ko' ? `${picked.count + picked.bonus}장` : (picked.count + picked.bonus);
  passBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>${t('passSuccessTitle') || '예약이 접수됐어요!'}</h3>
      <p>${stored
        ? (t('passSuccessBodyOk') || '{name} 식권 {n}장을 담아뒀어요. 정식 오픈하면 결제 안내를 드릴게요.').replace('{name}', escapeHtml(rName(r))).replace('{n}장', passCount).replace('{n}', passCount)
        : (t('passSuccessBodyFail') || '{name} 식권을 담아뒀어요. 다만 저장 공간이 가득 차서 기록은 남기지 못했어요 — 새로고침하면 사라질 수 있어요.').replace('{name}', escapeHtml(rName(r)))}</p>
      <div class="game-action-row">
        <button type="button" class="btn-ghost" style="flex:1;" onclick="closePass()">${t('closeBtn') || '닫기'}</button>
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closePass(); openMypage('pass');">${t('passSeeMyPasses') || '내 식권 보기'}</button>
      </div>
    </div>
  `;
}

// ================= 헤더 통합 검색 =================
// 검색 대상을 늘리려면 searchSources에 항목을 하나 더 넣으면 된다.
// 각 item은 {icon, label, sub, keywords, run} 모양이고, run()은 기존 함수를 호출만 한다.
const headerSearchInput = document.getElementById('headerSearch');
const searchResults = document.getElementById('searchResults');
const searchOverlay = document.getElementById('searchOverlay');
const overlaySearchInput = document.getElementById('overlaySearch');
const overlaySearchResults = document.getElementById('overlaySearchResults');
const SEARCH_PER_SOURCE = 4;
const SEARCH_MAX = 10;

let searchFlat = [];      // 지금 화면에 그려진 항목들 (키보드 이동용)
let searchActiveIndex = -1;

function goSection(id){
  closeAllSearch();
  document.getElementById(id).scrollIntoView({behavior:'smooth'});
}

const shortcutItems = [
  {icon:'🗺️', label:'조치원 미니 지도', sub:'로컬 맛집 위치 보기', keywords:'지도 맵 map 위치 조치원', run:() => goSection('map')},
  {icon:'🍽️', label:'맛집 둘러보기', sub:'카테고리 · 가격 필터', keywords:'맛집 목록 리스트 카드 오늘 뭐 먹지', run:() => goSection('restaurants')},
  {icon:'🤝', label:'함께 만들어요', sub:'제휴 · 참여 · 후원 한자리에', keywords:'함께 제휴 참여 후원 사장님 입점 손주 힘 보태기 커뮤니티 together', run:() => goSection('join')},
  {icon:'⭐', label:'방문 후기', sub:'먼저 다녀온 사람들의 이야기', keywords:'리뷰 후기 평점 별점 review 방문기', run:() => goSection('reviews')},
  {icon:'💌', label:'친구에게 알리기', sub:'공유하기', keywords:'공유 share 친구 추천 알리기 링크 카톡', run:() => goSection('share')},
  {icon:'🏘️', label:'왜 만들었나', sub:'우리가 풀려는 문제', keywords:'소개 문제 이유 왜 배경 about 취지', run:() => goSection('problem')},
  {icon:'🚩', label:'개강 후 답사 계획', sub:'터줏대감 사장님 찾아가기', keywords:'답사 개강 로드맵 조사 계획 coming soon 곧', run:() => goSection('discover')},
  {icon:'🎟️', label:'손주 식권', sub:'식권 예약과 제휴 안내', keywords:'식권 패스 pass 제휴 구매 예약 할인 멤버십', run:() => { closeAllSearch(); openPassInfo(); }},
  {icon:'📝', label:'취향 설문', sub:'내 취향에 맞는 맛집 추천', keywords:'취향 설문 추천 테스트', run:() => { closeAllSearch(); openSurvey(); }},
  {icon:'🎲', label:'메뉴 추천 게임', sub:'타로 · 룰렛으로 고르기', keywords:'게임 룰렛 타로 랜덤 뽑기 결정장애', run:() => { closeAllSearch(); openGame(); }},
  {icon:'🌱', label:'마이페이지', sub:'저장 · 방문 · 식권 내역', keywords:'마이페이지 내정보 저장목록 방문기록 식권', run:() => { closeAllSearch(); openMypage('saved'); }},
  {icon:'🌾', label:'서비스 소개', sub:'프로젝트 개요와 비전', keywords:'서비스 소개 about 소개 비전 개발자 버전', run:() => { closeAllSearch(); openIntro(); }},
  {icon:'💬', label:'문의하기 · FAQ', sub:'자주 묻는 질문', keywords:'문의 faq 질문 도움말 고객센터', run:() => { closeAllSearch(); openFaq(); }},
  {icon:'✉️', label:'오픈 알림 신청', sub:'사전 신청 이메일 등록', keywords:'알림 신청 사전신청 이메일 오픈 베타', run:() => goSection('signup')},
  {icon:'🔒', label:'개인정보처리방침', sub:'별도 페이지로 이동', keywords:'개인정보 처리방침 privacy 약관 법적', run:() => { window.location.href = 'privacy.html'; }},
  {icon:'📄', label:'이용약관', sub:'별도 페이지로 이동', keywords:'이용약관 terms 약관 법적 고지', run:() => { window.location.href = 'terms.html'; }},
];

const partnerItems = [
  {icon:'🧑‍🍳', label:'사장님 제휴 신청', sub:'식권 · 학생 혜택 함께 준비하기', keywords:'제휴 사장님 입점 신청 가게 등록 식권 파트너', run:() => { closeAllSearch(); openContact('partnerStore'); }},
  {icon:'🎓', label:'학생회 · 동아리 제휴 문의', sub:'KU 멤버십 같은 단체 제휴', keywords:'제휴 학생회 동아리 단체 ku 멤버십 기관 학교', run:() => { closeAllSearch(); openContact('partnerOrg'); }},
  {icon:'🙋', label:'팀원으로 참여하기', sub:'손주 힘 보태기', keywords:'참여 팀원 봉사 활동 지원 손주 힘 보태기', run:() => { closeAllSearch(); openContact('team'); }},
  {icon:'🌱', label:'후원하기', sub:'손주 힘 보태기', keywords:'후원 기부 스폰서 지원금', run:() => { closeAllSearch(); openContact('sponsor'); }},
];

const searchSources = [
  {
    type:'가게',
    items: () => restaurants.map((r, i) => ({
      icon: r.emoji,
      label: r.name,
      sub: `${rCat(r)} · ${ratingLabel(r)} · ${r.priceValue.toLocaleString()}원`,
      // 이름 네 언어를 모두 넣어야 영어·중국어·스페인어로 쳐도 한국어 가게가 걸린다
      keywords: `${nameAllLangs(r)} ${r.desc} ${r.cat}`,
      run: () => { closeAllSearch(); openDetail(i); },
    })),
  },
  {
    type:'손주 식권',
    items: () => getPassRestaurants().map(r => ({
      icon:'🎟️',
      label: `${r.name} 식권`,
      sub: `장당 ${r.pass.unit.toLocaleString()}원 · ${r.pass.benefit}`,
      keywords: `${nameAllLangs(r)} 식권 패스 pass 쿠폰 ${r.pass.benefit} ${r.cat}`,
      run: () => { closeAllSearch(); openPass(restaurants.indexOf(r)); },
    })),
  },
  { type:'제휴 · 문의', items: () => partnerItems },
  { type:'바로가기',   items: () => shortcutItems },
];

function searchAll(query){
  const q = query.trim().toLowerCase();
  if(!q) return [];
  const groups = [];
  let picked = 0;
  for(const src of searchSources){
    if(picked >= SEARCH_MAX) break;
    const hits = src.items()
      .filter(it => it.keywords.toLowerCase().includes(q))
      .slice(0, Math.min(SEARCH_PER_SOURCE, SEARCH_MAX - picked));
    if(hits.length){
      groups.push({type:src.type, hits});
      picked += hits.length;
    }
  }
  return groups;
}

// 정확 일치가 한 건도 없을 때만 도는 보조 경로 — 오타를 감안해 비슷한 항목을 모은다.
// 소스 구분 없이 점수순으로 섞어 "이런 걸 찾으셨나요?" 한 그룹으로 내보낸다.
// 여기서도 fuzzyMatch 하나만 쓰고, 외부 API는 부르지 않는다(헤더 검색은 사이트 안에서만 찾는다).
function searchSuggest(query){
  const qKey = fuzzyKey(query);
  if(qKey.length < 2) return [];
  const scored = [];
  for(const src of searchSources){
    for(const it of src.items()){
      const s = fuzzyMatch(qKey, it.keywords);
      if(s > 0) scored.push({it, s});
    }
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, SEARCH_PER_SOURCE).map(x => x.it);
}

function runSearch(query, container){
  const q = query.trim();
  searchActiveIndex = -1;
  searchFlat = [];
  if(!q){
    container.innerHTML = '';
    container.classList.remove('show');
    return;
  }
  const groups = searchAll(q);
  // 정확 일치가 하나라도 있으면 기존 동작 그대로 — 오타 보정은 0건일 때만 끼어든다.
  const suggestions = groups.length ? [] : searchSuggest(q);
  groups.forEach(g => g.hits.forEach(h => searchFlat.push(h)));
  suggestions.forEach(h => searchFlat.push(h));  // 제안 항목도 ↓/↑·Enter로 그대로 움직인다

  const itemHtml = h => `
    <button type="button" class="search-item" data-i="${searchFlat.indexOf(h)}">
      <span class="search-icon">${h.icon}</span>
      <span class="search-text">
        <span class="search-label">${escapeHtml(h.label)}</span>
        <span class="search-sub">${escapeHtml(h.sub)}</span>
      </span>
    </button>
  `;

  // 검색어를 넘기지 않는다 — 카카오를 쓰는 가게 검색과 사이트 내 검색은 별개 기능이라,
  // 여기서는 "저기 가면 가게를 찾을 수 있다"고 안내만 하고 대신 검색해주지 않는다.
  const hint = `<button type="button" class="search-hint" data-fallback="1">🏪 동네 가게 이름으로 찾으시나요? 가게 검색으로 가기</button>`;
  let body;
  if(groups.length){
    body = groups.map(g => `
      <div class="search-group">
        <div class="search-group-title">${escapeHtml(g.type)}</div>
        ${g.hits.map(itemHtml).join('')}
      </div>
    `).join('');
  }else{
    const none = (t('searchNoResultsFor') || '"{q}"에 해당하는 결과가 없어요.').replace('{q}', () => escapeHtml(q));
    body = `<div class="search-empty">${none}${suggestions.length ? ''
      : `<span class="search-check">${t('searchCheckSpelling') || '검색어가 정확한지 확인해주세요.'}</span>`}</div>`;
    if(suggestions.length){
      body += `
        <div class="search-group">
          <div class="search-group-title">${t('searchDidYouMean') || '이런 걸 찾으셨나요?'}</div>
          ${suggestions.map(itemHtml).join('')}
        </div>
      `;
    }
  }
  container.innerHTML = body + hint;
  container.classList.add('show');

  container.querySelectorAll('.search-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = searchFlat[Number(btn.dataset.i)];
      if(item) item.run();
    });
  });
  const fallback = container.querySelector('.search-hint');
  if(fallback) fallback.addEventListener('click', () => goLiveSearch());
}

function paintSearchActive(container){
  container.querySelectorAll('.search-item').forEach(btn => {
    const on = Number(btn.dataset.i) === searchActiveIndex;
    btn.classList.toggle('active', on);
    if(on) btn.scrollIntoView({block:'nearest'});
  });
}

// Enter로 검색어를 동네 가게 검색에 넘긴다 (기존 헤더 검색은 스크롤만 하고 검색어를 버렸다)
// 헤더 검색은 "사이트 안에서 찾기"라 외부 API를 부르지 않는다. eat local의 가게 검색은
// 카카오 API를 쓰는 별개 기능이므로, 여기서는 그쪽 검색창으로 데려다주기만 하고
// 검색어를 옮기거나 대신 실행하지 않는다 — 두 검색을 섞지 않기 위한 의도적인 선택이다.
function goLiveSearch(){
  closeAllSearch();
  document.getElementById('restaurants').scrollIntoView({behavior:'smooth'});
  liveSearchInput.focus({preventScroll:true});
}

function handleSearchKey(e, input, container){
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    if(!searchFlat.length) return;
    e.preventDefault();
    const last = searchFlat.length - 1;
    if(e.key === 'ArrowDown') searchActiveIndex = searchActiveIndex >= last ? 0 : searchActiveIndex + 1;
    else searchActiveIndex = searchActiveIndex <= 0 ? last : searchActiveIndex - 1;
    paintSearchActive(container);
    return;
  }
  if(e.key === 'Enter'){
    e.preventDefault();
    const item = searchFlat[searchActiveIndex];
    if(item) item.run();
    else if(input.value.trim()) goLiveSearch();
    return;
  }
  if(e.key === 'Escape'){
    closeAllSearch();
  }
}

function closeSearchDropdown(){
  searchResults.classList.remove('show');
  searchActiveIndex = -1;
}
function openSearch(){
  overlaySearchInput.value = headerSearchInput.value;
  runSearch(overlaySearchInput.value, overlaySearchResults);
  searchOverlay.classList.add('show');
  // 모바일 키보드가 바로 올라오도록
  setTimeout(() => overlaySearchInput.focus(), 50);
}
function closeSearch(){ searchOverlay.classList.remove('show'); }
function closeSearchOnOverlay(e){ if(e.target === searchOverlay) closeSearch(); }
function closeAllSearch(){
  closeSearchDropdown();
  closeSearch();
}

headerSearchInput.addEventListener('input', () => runSearch(headerSearchInput.value, searchResults));
headerSearchInput.addEventListener('keydown', e => handleSearchKey(e, headerSearchInput, searchResults));
headerSearchInput.addEventListener('focus', () => { if(headerSearchInput.value.trim()) runSearch(headerSearchInput.value, searchResults); });
overlaySearchInput.addEventListener('input', () => runSearch(overlaySearchInput.value, overlaySearchResults));
overlaySearchInput.addEventListener('keydown', e => handleSearchKey(e, overlaySearchInput, overlaySearchResults));

// 드롭다운 바깥을 누르면 닫는다 (모달 오버레이는 자기 배경 클릭으로 따로 닫힌다)
document.addEventListener('click', e => {
  if(!e.target.closest('.nav-search-wrap')) closeSearchDropdown();
});

// ================= Esc 키로 팝업 닫기 =================
// 지금까지는 통합검색 오버레이만 Esc가 먹었고 나머지 15개는 키보드로 못 닫았다.
// 떠 있는 것 중 "가장 위" 하나만 닫는다:
//   확인창(#confirmOverlay)은 z-index:1100으로 항상 맨 앞이라 먼저 보고,
//   나머지는 z-index가 같아서 문서에 늦게 나온 쪽이 위에 그려지므로 뒤에서부터 고른다.
// 닫는 길은 X 버튼과 똑같다 — 설문·게임·리뷰·문의는 "그만두시겠어요?"를 거친다.
const ESC_CLOSERS = {
  toastOverlay:      () => closeToast(),
  surveyOverlay:     () => requestCloseSurvey(),
  gameOverlay:       () => requestCloseGame(),
  reviewFormOverlay: () => requestCloseReviewForm(),
  visitVerifyOverlay:() => requestCloseVisitVerify(),
  contactOverlay:    () => requestCloseContact(),
  searchOverlay:     () => closeSearch(),
  passOverlay:       () => closePass(),
  passInfoOverlay:   () => closePassInfo(),
  introOverlay:      () => closeIntro(),
  faqOverlay:        () => closeFaq(),
  detailOverlay:     () => closeDetail(),
  authOverlay:       () => closeAuth(),
  mypageOverlay:     () => closeMypage(),
  communityOverlay:  () => closeCommunity(),
  langOverlay:       () => closeLang(),
};

document.addEventListener('keydown', e => {
  if(e.key !== 'Escape') return;
  // 검색 입력칸에는 자체 Esc 처리(handleSearchKey)가 있다. 여기서 또 닫으면
  // 검색을 닫는 김에 그 아래 열려 있던 팝업까지 같이 닫힌다.
  if(e.target && e.target.closest && e.target.closest('.nav-search-wrap, #searchOverlay')) return;

  if(confirmOverlay.classList.contains('show')){ closeConfirm(); return; }

  const open = document.querySelectorAll('.survey-overlay.show, .toast-overlay.show');
  const top = open[open.length - 1];
  if(!top) return;
  const close = ESC_CLOSERS[top.id];
  if(close) close();
});

// owner.html의 CTA(?apply=owner)로 넘어오면 사장님 제휴 신청 모달을 자동으로 연다.
if(new URLSearchParams(location.search).get('apply') === 'owner'){
  openContact('partnerStore');
  history.replaceState(null, '', location.pathname + location.hash);
}
