// ---- Dummy restaurant data ----
const restaurants = [
  {name:"조치원 할매국밥", cat:"한식", emoji:"🍚", desc:"40년 전통, 진한 국물의 소문난 국밥집", rating:4.8, reviewCount:212, price:"₩", priceValue:9000, saved:false, visited:false, detail:{
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
  }},
  {name:"골목 손칼국수", cat:"한식", emoji:"🍜", desc:"매일 반죽하는 쫄깃한 면발이 일품", rating:4.6, reviewCount:98, price:"₩", priceValue:8000, saved:true, visited:true},
  {name:"조치원 화덕피자", cat:"양식", emoji:"🍕", desc:"동네 사장님이 직접 굽는 화덕 피자", rating:4.5, reviewCount:64, price:"₩₩", priceValue:16000, saved:false, visited:false},
  {name:"역전 왕돈까스", cat:"양식", emoji:"🍱", desc:"두툼한 수제 돈까스, 넉넉한 인심", rating:4.7, reviewCount:151, price:"₩", priceValue:9000, saved:false, visited:false},
  {name:"청춘 짜장면", cat:"중식", emoji:"🥡", desc:"30년째 한 자리, 정겨운 노포 중식당", rating:4.4, reviewCount:87, price:"₩", priceValue:7000, saved:false, visited:false},
  {name:"조치원 마라탕", cat:"중식", emoji:"🌶️", desc:"학생들 사이 입소문난 얼큰한 마라탕", rating:4.3, reviewCount:176, price:"₩₩", priceValue:13000, saved:true, visited:false},
  {name:"세종 스시하루", cat:"일식", emoji:"🍣", desc:"가성비 좋은 오마카세급 초밥 정식", rating:4.6, reviewCount:73, price:"₩₩", priceValue:15000, saved:false, visited:false},
  {name:"조치원 라멘야", cat:"일식", emoji:"🍥", desc:"진한 돈코츠 육수, 사장님 손맛 그대로", rating:4.5, reviewCount:59, price:"₩", priceValue:9000, saved:false, visited:true},
  {name:"할머니 떡볶이", cat:"분식", emoji:"🍢", desc:"매콤달콤 옛날 떡볶이, 학생 최애 간식", rating:4.9, reviewCount:264, price:"₩", priceValue:4000, saved:true, visited:false},
  {name:"조치원 김밥천국", cat:"분식", emoji:"🍙", desc:"든든한 한 끼, 다양한 종류의 김밥", rating:4.2, reviewCount:41, price:"₩", priceValue:5000, saved:false, visited:false},
  {name:"등굣길 순대국", cat:"한식", emoji:"🍲", desc:"아침 일찍 여는 든든한 순대국집", rating:4.5, reviewCount:118, price:"₩", priceValue:8000, saved:false, visited:false},
  {name:"조치원 파스타공방", cat:"양식", emoji:"🍝", desc:"직접 뽑는 생면 파스타 전문점", rating:4.4, reviewCount:52, price:"₩₩", priceValue:14000, saved:false, visited:false},
];

const cardGrid = document.getElementById('cardGrid');
const filterCount = document.getElementById('filterCount');
const filterEmpty = document.getElementById('filterEmpty');
const cardSearch = document.getElementById('cardSearch');
const sortSelect = document.getElementById('sortSelect');
const priceMinInput = document.getElementById('priceMin');
const priceMaxInput = document.getElementById('priceMax');
let currentCat = "전체";
let currentQuery = "";
let currentSort = "recommend";

function getFilteredList(){
  let list = restaurants.filter(r => currentCat === "전체" || r.cat === currentCat);
  const q = currentQuery.trim().toLowerCase();
  if(q){
    list = list.filter(r => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.cat.includes(q));
  }
  const minP = priceMinInput.value ? Number(priceMinInput.value) : null;
  const maxP = priceMaxInput.value ? Number(priceMaxInput.value) : null;
  if(minP !== null) list = list.filter(r => r.priceValue >= minP);
  if(maxP !== null) list = list.filter(r => r.priceValue <= maxP);
  switch(currentSort){
    case "name":
      list = list.slice().sort((a,b) => a.name.localeCompare(b.name, 'ko'));
      break;
    case "rating":
      list = list.slice().sort((a,b) => b.rating - a.rating);
      break;
    case "reviews":
      list = list.slice().sort((a,b) => b.reviewCount - a.reviewCount);
      break;
    default:
      list = list.slice().sort((a,b) => b.rating - a.rating);
  }
  return list;
}

function renderCards(){
  cardGrid.innerHTML = "";
  const list = getFilteredList();
  filterCount.textContent = `${list.length}곳의 맛집`;
  filterEmpty.style.display = list.length === 0 ? 'block' : 'none';
  list.forEach((r, i) => {
    const idx = restaurants.indexOf(r);
    const card = document.createElement('div');
    card.className = 'food-card';
    card.addEventListener('click', () => openDetail(idx));
    card.innerHTML = `
      <div class="food-thumb" style="background:${thumbColor(i)}">
        <span>${r.emoji}</span>
        <button class="save-toggle ${r.saved ? 'saved':''}" data-idx="${idx}" title="가보고 싶은 곳">${r.saved ? '♥':'♡'}</button>
        <div class="visit-badge ${r.visited ? 'show':''}">✔ 가본 곳</div>
      </div>
      <div class="food-body">
        <span class="food-cat">${r.cat}</span>
        <div class="food-name">${r.name}</div>
        <div class="food-desc">${r.desc}</div>
        <div class="food-meta">
          <span class="stars">★ ${r.rating} <span style="color:var(--ink-soft);font-weight:400;">(${r.reviewCount})</span></span>
          <span>${r.priceValue.toLocaleString()}원</span>
        </div>
        <button class="visit-flow-btn" data-idx="${idx}">${r.visited ? '✔ 방문 기록 있음' : (r.saved ? '방문 완료로 표시하기' : '가보고 싶은 곳에 담기')}</button>
      </div>
    `;
    cardGrid.appendChild(card);
  });

  document.querySelectorAll('.save-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = e.currentTarget.dataset.idx;
      restaurants[idx].saved = !restaurants[idx].saved;
      renderCards();
    });
  });
  document.querySelectorAll('.visit-flow-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = e.currentTarget.dataset.idx;
      const r = restaurants[idx];
      if(!r.saved){ r.saved = true; }
      else if(!r.visited){ r.visited = true; }
      renderCards();
    });
  });
}

function thumbColor(i){
  const colors = ['#E3E9EF','#F3E7DE','#EAE3D9','#E9EDF2'];
  return colors[i % colors.length];
}

document.querySelectorAll('.cat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentCat = chip.dataset.cat;
    renderCards();
  });
});

cardSearch.addEventListener('input', () => {
  currentQuery = cardSearch.value;
  renderCards();
});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  renderCards();
});

priceMinInput.addEventListener('input', renderCards);
priceMaxInput.addEventListener('input', renderCards);

renderCards();

// ---- Dummy reviews ----
const reviews = [
  {name:"익명의 재학생", emoji:"🎓", stars:5, place:"할머니 떡볶이", text:"학교 끝나고 늘 여기 와요. 사장님이 항상 반겨주셔서 더 정겹습니다."},
  {name:"교환학생 Lee", emoji:"🌏", stars:5, place:"세종 스시하루", text:"가격 대비 퀄리티가 정말 좋아요. 한국 온 뒤 최고의 발견이었어요."},
  {name:"행정팀 직원", emoji:"💼", stars:4, place:"조치원 할매국밥", text:"점심시간에 자주 가는데 국물이 진짜 진해요. 강력 추천합니다."},
  {name:"기숙사생 K", emoji:"🏠", stars:5, place:"골목 손칼국수", text:"면이 쫄깃쫄깃하고 양도 많아서 자취생한테 딱이에요."},
];
const reviewList = document.getElementById('reviewList');
reviews.forEach(r => {
  const div = document.createElement('div');
  div.className = 'review-item';
  div.innerHTML = `
    <div class="review-avatar">${r.emoji}</div>
    <div class="review-body">
      <div class="review-top">
        <span class="review-name">${r.name}</span>
        <span class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span>
      </div>
      <div class="review-text">${r.text}</div>
      <span class="review-place">📍 ${r.place}</span>
    </div>
  `;
  reviewList.appendChild(div);
});

// ---- Toast / popup (준비중 안내) ----
const toastContent = {
  save:{emoji:'🌾', title:'출시 예정이에요', text:'저장 기능은 곧 만나보실 수 있어요. 청년 농부가 부지런히 준비 중입니다!'},
  login:{emoji:'👤', title:'로그인 준비 중', text:'로그인하고 나만의 맛집 리스트를 관리하는 기능, 곧 만나보세요.'},
  mypage:{emoji:'📌', title:'마이페이지 준비 중', text:'방문 기록과 저장 목록을 한눈에 보는 마이페이지가 곧 열립니다.'},
  more:{emoji:'🍽️', title:'더 많은 맛집 준비 중', text:'9월 개강 후 현장 조사를 통해 더 많은 로컬 맛집을 채워나갈 예정이에요.'},
  vendor:{emoji:'🧑‍🌾', title:'사장님용 페이지 준비 중', text:'조치원 로컬 식당 사장님을 위한 입점 신청 페이지를 별도로 준비 중이에요.'},
  info:{emoji:'🌾', title:'준비 중이에요', text:'해당 페이지는 곧 열릴 예정입니다.'},
  share:{emoji:'💬', title:'공유 기능 준비 중', text:'친구에게 공유하는 기능이 곧 추가됩니다. 지금은 링크 복사를 이용해보세요!'},
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

function toastZoom(){ openToast('info'); }

function copyLink(){
  navigator.clipboard.writeText(window.location.href).then(()=>{
    openToast('info');
    document.getElementById('toastTitle').textContent = '링크 복사 완료';
    document.getElementById('toastText').textContent = '친구에게 붙여넣어 공유해보세요!';
    document.getElementById('toastEmoji').textContent = '🔗';
  }).catch(()=> openToast('share'));
}

// ---- Email signup ----
document.getElementById('signupForm').addEventListener('submit', function(e){
  e.preventDefault();
  const msg = document.getElementById('signupMsg');
  msg.style.display = 'block';
  this.reset();
});

// ---- Big text mode ----
function toggleBigText(){
  const on = document.documentElement.classList.toggle('big-text');
  const btn = document.querySelector('.a11y-toggle');
  if(btn) btn.textContent = on ? '🔍 기본 글씨로' : '🔍 큰글씨 모드';
}

// ---- Header search scrolls to restaurant list ----
document.getElementById('headerSearch').addEventListener('keydown', function(e){
  if(e.key === 'Enter'){
    e.preventDefault();
    const q = this.value.trim();
    if(q){
      document.getElementById('restaurants').scrollIntoView({behavior:'smooth'});
    }
  }
});

// ================= 취향 설문 (실제 동작) =================
const surveyQuestions = [
  {
    key:'spice',
    title:'매운맛은 어느 정도가 좋아요?',
    sub:'취향에 맞는 맛집을 찾는 데 참고할게요',
    options:['안 매운 게 좋아요','보통이 좋아요','매콤한 게 좋아요','아주 매워야 해요']
  },
  {
    key:'cat',
    title:'어떤 음식이 제일 끌리세요?',
    sub:'가장 자주 생각나는 카테고리를 골라주세요',
    options:['한식','양식','중식','일식','분식']
  },
  {
    key:'budget',
    title:'한 끼 예산은 어느 정도가 좋아요?',
    sub:'가성비에 맞는 곳부터 보여드릴게요',
    options:['₩ 가볍게','₩₩ 넉넉하게']
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
function closeSurveyOnOverlay(e){ if(e.target === surveyOverlay) closeSurvey(); }

function renderSurvey(){
  const totalDots = surveyQuestions.length + 1;
  surveyProgress.innerHTML = Array.from({length:totalDots}).map((_,i) =>
    `<span class="${i <= surveyStep ? 'done':''}"></span>`
  ).join('');

  if(surveyStep < surveyQuestions.length){
    const q = surveyQuestions[surveyStep];
    const picked = surveyAnswers[q.key];
    surveyBody.innerHTML = `
      <div class="survey-step">
        <h3>${q.title}</h3>
        <p class="step-sub">${q.sub}</p>
        <div class="survey-options">
          ${q.options.map(opt => `
            <button type="button" class="survey-option ${picked === opt ? 'selected':''}" data-opt="${opt}">${opt}</button>
          `).join('')}
        </div>
        <div class="survey-nav">
          ${surveyStep > 0 ? `<button type="button" class="survey-back" id="surveyBackBtn">이전</button>` : `<span></span>`}
          <button type="button" class="survey-next" id="surveyNextBtn" ${picked ? '' : 'disabled'}>${surveyStep === surveyQuestions.length - 1 ? '결과 보기' : '다음'}</button>
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
        <h3>이런 맛집은 어때요?</h3>
        <p class="step-sub">취향에 맞춰 골라본 로컬 맛집이에요</p>
        <div class="survey-result-list">
          ${picks.map(r => `
            <div class="survey-result-card">
              <span class="emoji">${r.emoji}</span>
              <div class="info">
                <strong>${r.name}</strong>
                <span>${r.cat} · ★ ${r.rating} · ${r.desc}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <button type="button" class="survey-close-btn" id="surveyDoneBtn">확인</button>
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

function openDetail(idx){
  const r = restaurants[idx];
  detailBody.innerHTML = r.detail ? renderFullDetail(r) : renderStubDetail(r);
  detailOverlay.classList.add('show');
}
function closeDetail(){ detailOverlay.classList.remove('show'); }
function closeDetailOnOverlay(e){ if(e.target === detailOverlay) closeDetail(); }

function renderStubDetail(r){
  return `
    <div class="detail-head">
      <span class="detail-emoji">${r.emoji}</span>
      <div>
        <span class="food-cat">${r.cat}</span>
        <h3>${r.name}</h3>
        <div class="detail-rating">★ ${r.rating} (${r.reviewCount}) · ${r.price}</div>
      </div>
    </div>
    <p class="detail-desc">${r.desc}</p>
    <div class="detail-stub-note">
      <strong>상세 정보 준비 중</strong> — 주소·영업시간·메뉴 구성·원산지 같은 상세 정보는 9월 현장 조사 후 채워질 예정이에요. 예시로 <b>조치원 할매국밥</b> 카드에서 어떤 정보가 담길지 미리 확인해보세요.
    </div>
    <button type="button" class="survey-close-btn" onclick="closeDetail()">닫기</button>
  `;
}

function renderFullDetail(r){
  const d = r.detail;
  const infoRows = [
    ['📍 주소', d.address],
    ['🕐 영업시간', d.hours],
    ['🚫 휴무일', d.closed],
    ['☎️ 전화', d.phone],
    ['📅 예약', d.reservation],
    ['🪑 수용 인원', d.capacity],
    ['🚗 주차', d.parking],
    ['📱 모바일페이', d.mobilePay],
    ['🎟️ 상품권/식권', d.vouchers],
  ];
  return `
    <div class="detail-head">
      <span class="detail-emoji">${r.emoji}</span>
      <div>
        <span class="food-cat">${r.cat}</span>
        <h3>${r.name}</h3>
        <div class="detail-rating">★ ${r.rating} (${r.reviewCount}) · ${r.price}</div>
      </div>
    </div>
    <p class="detail-desc">${r.desc}</p>

    <div class="detail-info-grid">
      ${infoRows.map(([label,val]) => `
        <div class="detail-info-row">
          <span class="detail-info-label">${label}</span>
          <span class="detail-info-val">${val}</span>
        </div>
      `).join('')}
    </div>

    <h4 class="detail-menu-title">메뉴</h4>
    <div class="detail-menu-list">
      ${d.menu.map(m => `
        <div class="detail-menu-item">
          <div class="detail-menu-top">
            <span class="detail-menu-name">${m.name}</span>
            <span class="detail-menu-price">${m.price}</span>
          </div>
          <div class="detail-menu-comp">${m.composition}</div>
          <div class="detail-menu-origin">원산지: ${m.origin}</div>
        </div>
      `).join('')}
    </div>
    <p class="detail-example-note">* 예시로 채워둔 상세 정보이며, 실제 데이터는 현장 조사 후 반영됩니다.</p>
    <button type="button" class="survey-close-btn" onclick="closeDetail()">닫기</button>
  `;
}

// ================= 3초 컷 빠르게 고르기 =================
function quickPick(){
  openGame();
}

// ================= 메뉴 추천 게임 (타로 / 룰렛) =================
const gameOverlay = document.getElementById('gameOverlay');
const gameBody = document.getElementById('gameBody');
let rouletteItems = [];

function openGame(){
  renderGameChoice();
  gameOverlay.classList.add('show');
}
function closeGame(){ gameOverlay.classList.remove('show'); }
function closeGameOnOverlay(e){ if(e.target === gameOverlay) closeGame(); }

function renderGameChoice(){
  gameBody.innerHTML = `
    <h3 class="game-title">오늘 뭐 먹지, 게임으로 정해요</h3>
    <p class="game-sub">결정장애 탈출! 둘 중 하나를 골라보세요</p>
    <div class="game-choice-grid">
      <button type="button" class="game-choice-btn" id="pickTarot">
        <span class="icon">🔮</span>
        <span><strong>오늘의 메뉴 타로</strong><span class="desc">카드 한 장 뽑고 오늘의 맛집 운명 확인하기</span></span>
      </button>
      <button type="button" class="game-choice-btn" id="pickRoulette">
        <span class="icon">🎡</span>
        <span><strong>메뉴 룰렛</strong><span class="desc">먹고 싶은 메뉴를 직접 적고 룰렛으로 정하기</span></span>
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
    <button type="button" class="game-back-btn" id="gameBackBtn">← 다른 게임 고르기</button>
    <h3 class="game-title">오늘의 메뉴 타로</h3>
    <p class="game-sub">${deck.length}장의 카드가 흐르고 있어요. 눌러서 오늘의 한 그릇을 뽑아보세요</p>
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
      <strong>${pick.name}</strong>
      <span>${pick.cat} · ★ ${pick.rating} · ${pick.desc}</span>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" id="tarotRedraw">다시 뽑기</button>
      <button type="button" class="survey-close-btn" style="flex:1;" id="tarotClose">닫기</button>
    </div>
  `;
  document.getElementById('tarotRedraw').addEventListener('click', renderTarot);
  document.getElementById('tarotClose').addEventListener('click', closeGame);
}

function renderRoulette(){
  rouletteItems = [];
  gameBody.innerHTML = `
    <button type="button" class="game-back-btn" id="gameBackBtn">← 다른 게임 고르기</button>
    <h3 class="game-title">메뉴 룰렛</h3>
    <p class="game-sub">먹고 싶은 메뉴를 2개 이상 적고 돌려보세요</p>
    <div class="roulette-input-row">
      <input type="text" id="rouletteInput" placeholder="예: 국밥, 피자, 마라탕">
      <button type="button" class="roulette-add-btn" id="rouletteAddBtn">추가</button>
    </div>
    <div class="roulette-chips" id="rouletteChips"></div>
    <div class="roulette-display" id="rouletteDisplay">메뉴를 추가해주세요</div>
    <div class="game-action-row">
      <button type="button" class="btn-primary" style="flex:1;" id="rouletteSpinBtn" disabled>🎡 돌리기</button>
    </div>
  `;
  document.getElementById('gameBackBtn').addEventListener('click', renderGameChoice);
  document.getElementById('rouletteAddBtn').addEventListener('click', addRouletteItem);
  document.getElementById('rouletteInput').addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); addRouletteItem(); }
  });
  document.getElementById('rouletteSpinBtn').addEventListener('click', spinRoulette);
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
  const display = document.getElementById('rouletteDisplay');
  if(!spinBtn) return;
  spinBtn.disabled = rouletteItems.length < 2;
  display.classList.remove('landed');
  display.textContent = rouletteItems.length < 2 ? '메뉴를 2개 이상 추가해주세요' : `${rouletteItems.length}개의 메뉴 중에서 골라드릴게요`;
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

function spinRoulette(){
  const display = document.getElementById('rouletteDisplay');
  const spinBtn = document.getElementById('rouletteSpinBtn');
  spinBtn.disabled = true;
  display.classList.remove('landed');
  let ticks = 0;
  const totalTicks = 18;
  const finalPick = rouletteItems[Math.floor(Math.random() * rouletteItems.length)];
  const interval = setInterval(() => {
    display.textContent = rouletteItems[Math.floor(Math.random() * rouletteItems.length)];
    ticks++;
    if(ticks >= totalTicks){
      clearInterval(interval);
      display.textContent = `🎉 ${finalPick}`;
      display.classList.add('landed');
      spinBtn.disabled = false;
      spinBtn.textContent = '🎡 다시 돌리기';
    }
  }, 90 + ticks * 4);
}

// ================= 손주 로그인 / 가입 =================
const authOverlay = document.getElementById('authOverlay');
const authBody = document.getElementById('authBody');
let authMode = 'signup';
let isLoggedIn = false;
let currentUserName = '';

function updateHeaderAuthUI(){
  const authBtn = document.getElementById('authHeaderBtn');
  const saveBtn = document.getElementById('saveHeaderBtn');
  const saveLabel = saveBtn.querySelector('.nav-label');
  if(isLoggedIn){
    authBtn.textContent = '🌱';
    authBtn.title = `${currentUserName || '손주'}님의 마이페이지`;
    authBtn.onclick = () => openMypage('saved');
    saveBtn.onclick = () => openMypage('saved');
    saveLabel.textContent = '저장 목록 보기';
  } else {
    authBtn.textContent = '👤';
    authBtn.title = '손주 로그인';
    authBtn.onclick = () => openAuth('login');
    saveBtn.onclick = () => openAuth('save');
    saveLabel.textContent = '데이터 저장하기';
  }
}
updateHeaderAuthUI();

function openAuth(intent){
  authMode = 'signup';
  renderAuth(intent);
  authOverlay.classList.add('show');
}
function closeAuth(){ authOverlay.classList.remove('show'); }
function closeAuthOnOverlay(e){ if(e.target === authOverlay) closeAuth(); }

const authIntentCopy = {
  save:{emoji:'💌', text:'가보고 싶은 곳을 저장하려면, 먼저 우리 손주가 되어주세요!'},
  mypage:{emoji:'📌', text:'마이페이지는 손주로 등록하면 이용할 수 있어요.'},
  login:{emoji:'👋', text:'다시 오셨네요! 손주 계정으로 로그인해주세요.'},
};

function renderAuth(intent){
  const info = authIntentCopy[intent] || authIntentCopy.login;
  authBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">${info.emoji}</div>
      <h3>손주가 되어주세요</h3>
      <p>${info.text}</p>
    </div>
    <div class="auth-tabs">
      <button type="button" class="auth-tab ${authMode==='signup'?'active':''}" id="tabSignup">손주 등록</button>
      <button type="button" class="auth-tab ${authMode==='login'?'active':''}" id="tabLogin">손주 로그인</button>
    </div>
    <form id="authForm">
      ${authMode==='signup' ? `
        <div class="auth-field">
          <label>손주 이름</label>
          <input type="text" id="authName" placeholder="어떻게 불러드릴까요?" required>
        </div>
      ` : ''}
      <div class="auth-field">
        <label>이메일 또는 전화번호</label>
        <input type="text" id="authId" placeholder="example@mail.com 또는 010-1234-5678" required>
      </div>
      <div class="auth-field">
        <label>비밀번호</label>
        <input type="password" id="authPw" placeholder="비밀번호" required>
      </div>
      ${authMode==='signup' ? `
        <div class="auth-field">
          <label>비밀번호 확인</label>
          <input type="password" id="authPw2" placeholder="비밀번호를 한 번 더 입력해주세요" required>
        </div>
      ` : ''}
      <p class="auth-error" id="authError"></p>
      <button type="submit" class="auth-submit-btn">${authMode==='signup' ? '손주 등록하고 시작하기' : '로그인하기'}</button>
    </form>
  `;
  document.getElementById('tabSignup').addEventListener('click', () => { authMode='signup'; renderAuth(intent); });
  document.getElementById('tabLogin').addEventListener('click', () => { authMode='login'; renderAuth(intent); });
  document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const errEl = document.getElementById('authError');
    const idVal = document.getElementById('authId').value.trim();
    errEl.textContent = '';

    if(!isEmailOrPhone(idVal)){
      errEl.textContent = '이메일 주소 또는 전화번호 형식으로 입력해주세요.';
      return;
    }
    if(authMode === 'signup'){
      const pw = document.getElementById('authPw').value;
      const pw2 = document.getElementById('authPw2').value;
      if(pw !== pw2){
        errEl.textContent = '비밀번호가 서로 달라요. 다시 확인해주세요.';
        return;
      }
    }
    const name = authMode==='signup' ? document.getElementById('authName').value.trim() : '';
    renderAuthWelcome(name);
  });
}

function isEmailOrPhone(v){
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneOk = /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(v.replace(/\s/g, ''));
  return emailOk || phoneOk;
}

function renderAuthWelcome(name){
  isLoggedIn = true;
  currentUserName = name || '';
  updateHeaderAuthUI();
  const label = name ? `${name} 손주님` : '손주님';
  authBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>환영해요, ${label}!</h3>
      <p>손주 등록이 완료됐어요. 정식 오픈하면 가장 먼저 알려드릴게요.</p>
      <div class="game-action-row">
        <button type="button" class="btn-ghost" style="flex:1;" onclick="closeAuth()">닫기</button>
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeAuth(); openMypage('saved');">마이페이지 보러가기</button>
      </div>
    </div>
  `;
}

// ================= 마이페이지 (로그인 후 하위 섹션) =================
const mypageOverlay = document.getElementById('mypageOverlay');
const mypageBody = document.getElementById('mypageBody');
let mypageTab = 'saved';

function openMypage(tab){
  if(!isLoggedIn){ openAuth('mypage'); return; }
  mypageTab = tab || 'saved';
  renderMypage();
  mypageOverlay.classList.add('show');
}
function closeMypage(){ mypageOverlay.classList.remove('show'); }
function closeMypageOnOverlay(e){ if(e.target === mypageOverlay) closeMypage(); }

function renderMypage(){
  const list = restaurants.filter(r => mypageTab === 'saved' ? r.saved : r.visited);
  mypageBody.innerHTML = `
    <div class="mypage-head">
      <div class="emoji">🌱</div>
      <h3>${currentUserName ? `${currentUserName} 손주님의 마이페이지` : '마이페이지'}</h3>
    </div>
    <div class="mypage-tabs">
      <button type="button" class="mypage-tab ${mypageTab==='saved'?'active':''}" id="tabSaved">가보고 싶은 곳</button>
      <button type="button" class="mypage-tab ${mypageTab==='visited'?'active':''}" id="tabVisited">가본 곳</button>
    </div>
    <div class="mypage-list">
      ${list.length === 0 ? `<div class="mypage-empty">아직 ${mypageTab==='saved'?'저장한':'방문 기록이 있는'} 맛집이 없어요.</div>` : list.map(r => `
        <div class="survey-result-card">
          <span class="emoji">${r.emoji}</span>
          <div class="info">
            <strong>${r.name}</strong>
            <span>${r.cat} · ★ ${r.rating} · ${r.desc}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <button type="button" class="survey-close-btn" style="margin-top:16px;" onclick="closeMypage()">닫기</button>
  `;
  document.getElementById('tabSaved').addEventListener('click', () => { mypageTab='saved'; renderMypage(); });
  document.getElementById('tabVisited').addEventListener('click', () => { mypageTab='visited'; renderMypage(); });
}

// ================= 언어 선택 (베타: 선택만 저장, 실제 번역은 로드맵) =================
const langOverlay = document.getElementById('langOverlay');
const langBody = document.getElementById('langBody');
let currentLang = 'ko';

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
      <p>베타 기간에는 언어 선택만 저장되고, 전체 번역은 정식 오픈 때 제공돼요.</p>
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
      currentLang = btn.dataset.code;
      const picked = languages.find(l => l.code === currentLang);
      renderLang();
      document.getElementById('langSelected').textContent = `✔ ${picked.label} 선택됨 — 정식 오픈 시 적용됩니다`;
    });
  });
}
