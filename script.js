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
  },
  // pass가 있는 가게만 손주 식권 섹션과 검색에 노출된다 (detail과 같은 방식 — 일부만 채워둔 예시)
  pass:{unit:9000, bundles:[{count:5,bonus:0},{count:10,bonus:1}], benefit:"10장 사면 1장 더", validDays:180}},
  {name:"골목 손칼국수", cat:"한식", emoji:"🍜", desc:"매일 반죽하는 쫄깃한 면발이 일품", rating:4.6, reviewCount:98, price:"₩", priceValue:8000, saved:true, visited:true,
    pass:{unit:8000, bundles:[{count:5,bonus:0},{count:10,bonus:1}], benefit:"10장 사면 1장 더", validDays:180}},
  {name:"조치원 화덕피자", cat:"양식", emoji:"🍕", desc:"동네 사장님이 직접 굽는 화덕 피자", rating:4.5, reviewCount:64, price:"₩₩", priceValue:16000, saved:false, visited:false},
  {name:"역전 왕돈까스", cat:"양식", emoji:"🍱", desc:"두툼한 수제 돈까스, 넉넉한 인심", rating:4.7, reviewCount:151, price:"₩", priceValue:9000, saved:false, visited:false,
    pass:{unit:9000, bundles:[{count:5,bonus:0},{count:10,bonus:1}], benefit:"10장 사면 1장 더", validDays:90}},
  {name:"청춘 짜장면", cat:"중식", emoji:"🥡", desc:"30년째 한 자리, 정겨운 노포 중식당", rating:4.4, reviewCount:87, price:"₩", priceValue:7000, saved:false, visited:false},
  {name:"조치원 마라탕", cat:"중식", emoji:"🌶️", desc:"학생들 사이 입소문난 얼큰한 마라탕", rating:4.3, reviewCount:176, price:"₩₩", priceValue:13000, saved:true, visited:false},
  {name:"세종 스시하루", cat:"일식", emoji:"🍣", desc:"가성비 좋은 오마카세급 초밥 정식", rating:4.6, reviewCount:73, price:"₩₩", priceValue:15000, saved:false, visited:false},
  {name:"조치원 라멘야", cat:"일식", emoji:"🍥", desc:"진한 돈코츠 육수, 사장님 손맛 그대로", rating:4.5, reviewCount:59, price:"₩", priceValue:9000, saved:false, visited:true},
  {name:"할머니 떡볶이", cat:"분식", emoji:"🍢", desc:"매콤달콤 옛날 떡볶이, 학생 최애 간식", rating:4.9, reviewCount:264, price:"₩", priceValue:4000, saved:true, visited:false,
    pass:{unit:4000, bundles:[{count:10,bonus:1},{count:20,bonus:3}], benefit:"20장 사면 3장 더", validDays:180}},
  {name:"조치원 김밥천국", cat:"분식", emoji:"🍙", desc:"든든한 한 끼, 다양한 종류의 김밥", rating:4.2, reviewCount:41, price:"₩", priceValue:5000, saved:false, visited:false},
  {name:"등굣길 순대국", cat:"한식", emoji:"🍲", desc:"아침 일찍 여는 든든한 순대국집", rating:4.5, reviewCount:118, price:"₩", priceValue:8000, saved:false, visited:false},
  {name:"조치원 파스타공방", cat:"양식", emoji:"🍝", desc:"직접 뽑는 생면 파스타 전문점", rating:4.4, reviewCount:52, price:"₩₩", priceValue:14000, saved:false, visited:false},
];

// ================= 로컬 저장 (백엔드 전환 지점) =================
// 나중에 Supabase 같은 백엔드를 붙일 때는 loadState / saveState 두 함수만 갈아끼우면 된다.
// marks는 배열 인덱스가 아니라 가게 이름을 키로 잡는다 — restaurants 순서가 바뀌거나
// 항목이 추가돼도 저장된 값이 엉뚱한 가게에 붙지 않도록.
const STORE_KEY = 'bmw:v1';
let store = { auth:{isLoggedIn:false, name:''}, marks:{}, reviews:[], passOrders:[] };

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return;
    const parsed = JSON.parse(raw);
    store = {
      auth:{
        isLoggedIn: !!(parsed.auth && parsed.auth.isLoggedIn),
        name: (parsed.auth && parsed.auth.name) || '',
      },
      marks: parsed.marks || {},
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      passOrders: Array.isArray(parsed.passOrders) ? parsed.passOrders : [],
    };
  }catch(e){
    // 저장소가 막힌 환경(사생활 보호 모드 등) — 조용히 메모리 전용으로 동작한다
  }
}

// 저장 성공 여부를 돌려준다 (사진 첨부로 용량을 넘길 수 있어서 호출부에서 안내가 필요함)
function saveState(){
  store.auth = { isLoggedIn, name: currentUserName };
  store.marks = {};
  restaurants.forEach(r => {
    if(r.saved || r.visited) store.marks[r.name] = { saved:!!r.saved, visited:!!r.visited };
  });
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return true;
  }catch(e){
    return false;
  }
}

function applyState(){
  restaurants.forEach(r => {
    const m = store.marks[r.name];
    if(m){ r.saved = !!m.saved; r.visited = !!m.visited; }
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

loadState();
applyState();

// 로그인 상태는 renderCards()가 첫 렌더 때부터 참조하므로 여기서 선언한다
// (손주 로그인 섹션에서 선언하면 초기 renderCards() 호출 시점에 TDZ 에러가 난다).
let isLoggedIn = store.auth.isLoggedIn;
let currentUserName = store.auth.name;

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
    // 담기/방문 표시는 로그인한 손주 개인의 기록이므로, 비로그인 상태에서는
    // 카드를 전부 초기 상태(빈 하트 · 배지 없음 · "가보고 싶은 곳에 담기")로 통일해서 보여준다.
    const saved = isLoggedIn && r.saved;
    const visited = isLoggedIn && r.visited;
    const card = document.createElement('div');
    card.className = 'food-card';
    card.addEventListener('click', () => openDetail(idx));
    card.innerHTML = `
      <div class="food-thumb" style="background:${thumbColor(i)}">
        <span>${r.emoji}</span>
        <button class="save-toggle ${saved ? 'saved':''}" data-idx="${idx}" title="가보고 싶은 곳">${saved ? '♥':'♡'}</button>
        <div class="visit-badge ${visited ? 'show':''}">✔ 가본 곳</div>
      </div>
      <div class="food-body">
        <span class="food-cat">${r.cat}</span>
        <div class="food-name">${r.name}</div>
        <div class="food-desc">${r.desc}</div>
        <div class="food-meta">
          <span class="stars">★ ${r.rating} <span style="color:var(--ink-soft);font-weight:400;">(${r.reviewCount})</span></span>
          <span>${r.priceValue.toLocaleString()}원</span>
        </div>
        <button class="visit-flow-btn" data-idx="${idx}">${visited ? '✔ 방문 기록 있음' : (saved ? '방문 완료로 표시하기' : '가보고 싶은 곳에 담기')}</button>
      </div>
    `;
    cardGrid.appendChild(card);
  });

  document.querySelectorAll('.save-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(!requireLogin('save')) return;
      const r = restaurants[e.currentTarget.dataset.idx];
      if(r.saved){
        confirmMark(r, '💔', '가보고 싶은 곳에서 해제하시겠습니까?', () => { r.saved = false; });
      } else {
        confirmMark(r, '💌', '이 맛집을 가보고 싶은 곳에 담으시겠습니까?', () => { r.saved = true; });
      }
    });
  });
  document.querySelectorAll('.visit-flow-btn').forEach(btn => {
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
        confirmMark(r, '💌', '이 맛집을 가보고 싶은 곳에 담으시겠습니까?', () => { r.saved = true; });
      } else {
        confirmMark(r, '✔️', '이 맛집을 방문 완료로 표시하시겠습니까?', () => { r.visited = true; });
      }
    });
  });
}

// 저장/방문 상태 변경은 전부 확인 모달을 거친다 (extra.md §2)
function confirmMark(r, emoji, question, apply){
  openConfirm({
    emoji, title:r.name, text:question,
    okLabel:'확인', cancelLabel:'아니요',
    onOk: () => { apply(); saveState(); renderCards(); closeConfirm(); }
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

// 사용자가 남긴 리뷰(store.reviews)를 위에, 시드 더미 리뷰를 아래에 붙여 최신순으로 보여준다
function renderReviews(){
  reviewList.innerHTML = '';
  store.reviews.concat(reviews).forEach(r => {
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
        <span class="review-place">📍 ${escapeHtml(r.place)}</span>
      </div>
    `;
    reviewList.appendChild(div);
  });
}
renderReviews();

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
function closeConfirmOnOverlay(e){ if(e.target === confirmOverlay) closeConfirm(); }

// 로그인 필요한 동작 앞에 세우는 게이트. 통과하면 true, 아니면 유도 팝업을 띄우고 false.
function requireLogin(intent){
  if(isLoggedIn) return true;
  openConfirm({
    emoji:'👤',
    title:'로그인이 필요해요',
    text:'로그인이 필요한 기능이에요. 로그인하고 나만의 맛집 목록을 만들어보세요!',
    okLabel:'로그인하기',
    cancelLabel:'닫기',
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

// 헤더 통합검색은 파일 하단 "통합 검색" 섹션에서 처리한다.

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
// isLoggedIn / currentUserName은 renderCards()보다 먼저 필요해서 파일 상단(로컬 저장 바로 아래)에 선언돼 있다.

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
  review:{emoji:'📝', text:'리뷰를 남기려면 먼저 손주로 등록해주세요.'},
  pass:{emoji:'🎟️', text:'식권은 손주 계정에 담기기 때문에, 먼저 등록이 필요해요.'},
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
  // 로그인 모드에는 이름 입력칸이 없으므로, 저장돼 있던 이름을 지우지 않는다
  currentUserName = name || currentUserName || '';
  updateHeaderAuthUI();
  saveState();
  renderCards();
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
  if(!requireLogin('mypage')) return;
  mypageTab = tab || 'saved';
  renderMypage();
  mypageOverlay.classList.add('show');
}
function closeMypage(){ mypageOverlay.classList.remove('show'); }
function closeMypageOnOverlay(e){ if(e.target === mypageOverlay) closeMypage(); }

function renderMypage(){
  // 식권 탭은 가게 목록이 아니라 예약 내역이라 카드 모양이 달라서 분기한다
  const body = mypageTab === 'pass' ? renderMypagePassList() : renderMypagePlaceList();
  mypageBody.innerHTML = `
    <div class="mypage-head">
      <div class="emoji">🌱</div>
      <h3>${currentUserName ? `${escapeHtml(currentUserName)} 손주님의 마이페이지` : '마이페이지'}</h3>
    </div>
    <div class="mypage-tabs">
      <button type="button" class="mypage-tab ${mypageTab==='saved'?'active':''}" id="tabSaved">가보고 싶은 곳</button>
      <button type="button" class="mypage-tab ${mypageTab==='visited'?'active':''}" id="tabVisited">가본 곳</button>
      <button type="button" class="mypage-tab ${mypageTab==='pass'?'active':''}" id="tabPass">식권</button>
    </div>
    <div class="mypage-list">${body}</div>
    <button type="button" class="survey-close-btn" style="margin-top:16px;" onclick="closeMypage()">닫기</button>
  `;
  document.getElementById('tabSaved').addEventListener('click', () => { mypageTab='saved'; renderMypage(); });
  document.getElementById('tabVisited').addEventListener('click', () => { mypageTab='visited'; renderMypage(); });
  document.getElementById('tabPass').addEventListener('click', () => { mypageTab='pass'; renderMypage(); });
}

function renderMypagePlaceList(){
  const list = restaurants.filter(r => mypageTab === 'saved' ? r.saved : r.visited);
  if(list.length === 0) return `<div class="mypage-empty">아직 ${mypageTab==='saved'?'저장한':'방문 기록이 있는'} 맛집이 없어요.</div>`;
  return list.map(r => `
    <div class="survey-result-card">
      <span class="emoji">${r.emoji}</span>
      <div class="info">
        <strong>${r.name}</strong>
        <span>${r.cat} · ★ ${r.rating} · ${r.desc}</span>
      </div>
    </div>
  `).join('');
}

function renderMypagePassList(){
  if(store.passOrders.length === 0){
    return `<div class="mypage-empty">아직 예약한 식권이 없어요.<br>손주 식권 섹션에서 마음에 드는 가게를 골라보세요.</div>`;
  }
  return store.passOrders.map(o => `
    <div class="survey-result-card">
      <span class="emoji">${o.emoji}</span>
      <div class="info">
        <strong>${escapeHtml(o.place)}</strong>
        <span>${o.count + o.bonus}장 (${o.count}장${o.bonus ? ` + 보너스 ${o.bonus}장` : ''}) · ${o.total.toLocaleString()}원 · ${escapeHtml(o.at)} 예약</span>
      </div>
    </div>
  `).join('');
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
      title:'아직 리뷰를 남길 수 없어요',
      text:'방문 완료로 표시한 맛집에만 리뷰를 남길 수 있어요.',
      okLabel:'맛집 보러가기',
      cancelLabel:'닫기',
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
function closeReviewFormOnOverlay(e){ if(e.target === reviewFormOverlay) closeReviewForm(); }

function renderReviewForm(){
  const visitedList = restaurants.filter(r => r.visited);
  reviewFormBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">📝</div>
      <h3>나도 리뷰 남기기</h3>
      <p>다녀온 맛집의 솔직한 후기를 남겨주세요.</p>
    </div>
    <form id="reviewForm">
      <div class="auth-field">
        <label>평점</label>
        <div class="review-star-pick" id="reviewStars">
          ${[1,2,3,4,5].map(n => `<button type="button" class="review-star ${n<=reviewRating?'on':''}" data-score="${n}" aria-label="${n}점">★</button>`).join('')}
        </div>
      </div>
      <div class="auth-field">
        <label>방문한 곳</label>
        <select id="reviewPlace" class="review-select">
          ${visitedList.map(r => `<option value="${escapeHtml(r.name)}">${r.emoji} ${escapeHtml(r.name)}</option>`).join('')}
        </select>
      </div>
      <div class="auth-field">
        <label>공개 방식</label>
        <div class="review-radio-row">
          <label class="review-radio"><input type="radio" name="reviewVisibility" value="real" checked> 실명 (${escapeHtml(currentUserName || '손주')})</label>
          <label class="review-radio"><input type="radio" name="reviewVisibility" value="anon"> 익명</label>
        </div>
      </div>
      <div class="auth-field">
        <label>사진 첨부 <span class="review-optional">선택</span></label>
        <input type="file" id="reviewPhotoInput" accept="image/*" class="review-file">
        <div id="reviewPhotoPreview"></div>
      </div>
      <div class="auth-field">
        <label>리뷰 내용</label>
        <textarea id="reviewText" class="review-textarea" maxlength="${REVIEW_MAX}" placeholder="어떤 점이 좋았나요?"></textarea>
        <div class="review-counter"><span id="reviewCount">0</span>/${REVIEW_MAX}자</div>
      </div>
      <p class="auth-error" id="reviewError"></p>
      <div class="game-action-row">
        <button type="button" class="btn-ghost" style="flex:1;" onclick="closeReviewForm()">닫기</button>
        <button type="submit" class="survey-close-btn" style="flex:1;">리뷰 등록하기</button>
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

function handleReviewPhoto(e){
  const file = e.target.files && e.target.files[0];
  const preview = document.getElementById('reviewPhotoPreview');
  if(!file){ reviewPhoto = ''; preview.innerHTML = ''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      // 원본 base64를 그대로 저장하면 localStorage 용량 한도를 금방 넘긴다 — 최대 800px JPEG로 줄여 보관
      const max = 800;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      reviewPhoto = canvas.toDataURL('image/jpeg', 0.7);
      preview.innerHTML = `<img class="review-photo" src="${reviewPhoto}" alt="첨부한 사진 미리보기">`;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function submitReview(e){
  e.preventDefault();
  const errEl = document.getElementById('reviewError');
  const text = document.getElementById('reviewText').value.trim();
  errEl.textContent = '';
  if(!text){
    errEl.textContent = '리뷰 내용을 입력해주세요.';
    return;
  }
  const anonymous = document.querySelector('input[name="reviewVisibility"]:checked').value === 'anon';
  store.reviews.unshift({
    name: anonymous ? '익명의 손주' : (currentUserName ? `${currentUserName} 손주` : '손주'),
    emoji: anonymous ? '🙈' : '🌱',
    stars: reviewRating,
    place: document.getElementById('reviewPlace').value,
    text,
    photo: reviewPhoto || '',
  });
  const stored = saveState();
  renderReviews();
  reviewFormBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>리뷰가 등록됐어요!</h3>
      <p>${stored
        ? '소중한 후기 고맙습니다. 리뷰 목록에 바로 반영했어요.'
        : '리뷰 목록에 반영했어요. 다만 사진 용량이 커서 저장하진 못했어요 — 새로고침하면 사라질 수 있어요.'}</p>
      <div class="game-action-row">
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeReviewForm()">확인</button>
      </div>
    </div>
  `;
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
      <p>조치원읍 로컬 맛집 발견 서비스</p>
    </div>
    <div class="intro-vision">지도에 없는 우리 동네 진짜 맛집을 발굴하고, 소비자와 상인이 함께 상생하는 로컬 상권 생태계를 만든다</div>
    <div class="intro-block">
      <h4>프로젝트 개요</h4>
      <p>고려대학교 세종캠퍼스 사회공헌 프로젝트로 시작된 학생 주도 서비스예요. 네이버·카카오맵에 잘 등록되지 않은 조치원읍 로컬 맛집을 학생과 주민이 직접 발굴해 소개합니다.</p>
    </div>
    <div class="intro-block">
      <h4>만든 사람</h4>
      <p>고려대학교 세종캠퍼스 경제정책학전공 학생이 기획·개발한 사회공헌 프로젝트입니다.</p>
    </div>
    <div class="intro-block">
      <h4>진행 상황</h4>
      <p>현재는 사전 신청을 받는 준비 단계예요. 9월 개강 이후 현장 조사로 실제 맛집 데이터를 채워 정식 서비스를 시작할 예정입니다.</p>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="closeIntro(); openFaq();">자주 묻는 질문</button>
      <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeIntro()">닫기</button>
    </div>
  `;
}

// ================= 문의하기 — FAQ (extra.md §4-2) =================
const faqs = [
  {q:'밥 먹으러 와는 어떤 서비스인가요?',
   a:'네이버·카카오맵 등 온라인 지도에 잘 등록되지 않은 조치원읍 로컬 맛집을 학생과 주민이 직접 발굴하고 소개하는 서비스예요.'},
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
  faqBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">💬</div>
      <h3>문의하기</h3>
      <p>자주 묻는 질문을 먼저 확인해보세요.</p>
    </div>
    <div class="faq-list">
      ${faqs.map((f, i) => `
        <div class="faq-item ${i===faqOpenIndex?'open':''}">
          <button type="button" class="faq-q" data-index="${i}">
            <span class="faq-mark">Q${i+1}</span>
            <span>${escapeHtml(f.q)}</span>
            <span class="faq-arrow">▾</span>
          </button>
          <div class="faq-a">${escapeHtml(f.a)}</div>
        </div>
      `).join('')}
    </div>
    <div class="faq-foot">
      찾는 답이 없다면 <b>손주 힘 보태기</b>로 직접 문의를 남겨주세요.<br>
      <a href="privacy.html" style="text-decoration:underline;">개인정보처리방침</a> ·
      <a href="terms.html" style="text-decoration:underline;">이용약관</a>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="closeFaq(); openSupport();">문의 남기기</button>
      <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeFaq()">닫기</button>
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
function openContact(type){
  renderContactForm(type);
  contactOverlay.classList.add('show');
}
function closeContact(){ contactOverlay.classList.remove('show'); }
function closeContactOnOverlay(e){ if(e.target === contactOverlay) closeContact(); }

function renderSupportChoice(){
  contactBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">🤝</div>
      <h3>손주 힘 보태기</h3>
      <p>이 프로젝트에 함께할 손길을 기다려요.</p>
    </div>
    <div class="game-choice-grid">
      <button type="button" class="game-choice-btn" data-type="team">
        <span class="icon">🙋</span>
        <span>
          <strong>팀원으로 참여하고 싶어요</strong>
          <span class="desc">현장 조사부터 기획·개발까지, 함께할 자리가 열려 있어요.</span>
        </span>
      </button>
      <button type="button" class="game-choice-btn" data-type="sponsor">
        <span class="icon">🌱</span>
        <span>
          <strong>후원하고 싶어요</strong>
          <span class="desc">비영리 취지로 운영되는 프로젝트에 힘을 보태주세요.</span>
        </span>
      </button>
    </div>
    <div class="game-action-row">
      <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeContact()">닫기</button>
    </div>
  `;
  contactBody.querySelectorAll('.game-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => renderContactForm(btn.dataset.type));
  });
}

function renderContactForm(type){
  const c = contactTypes[type] || contactTypes.expand;
  // 손주 힘 보태기에서 들어온 경우에만 카테고리 선택으로 되돌아갈 수 있다
  const backBtn = (type === 'team' || type === 'sponsor')
    ? `<button type="button" class="btn-ghost" style="flex:1;" id="contactBack">뒤로</button>`
    : `<button type="button" class="btn-ghost" style="flex:1;" onclick="closeContact()">닫기</button>`;
  contactBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">${c.emoji}</div>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.sub)}</p>
    </div>
    <div class="contact-note">${escapeHtml(c.note)}</div>
    <form id="contactForm">
      <div class="auth-field">
        <label>이름</label>
        <input type="text" id="contactName" placeholder="이름 또는 닉네임" value="${escapeHtml(currentUserName || '')}">
      </div>
      <div class="auth-field">
        <label>연락처 / 이메일</label>
        <input type="text" id="contactReach" placeholder="연락 받으실 이메일 또는 전화번호">
      </div>
      <div class="auth-field">
        <label>${escapeHtml(c.fieldLabel)}</label>
        ${c.options
          ? `<select id="contactField" class="review-select">${c.options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}</select>`
          : `<input type="text" id="contactField" placeholder="예) 세종시 도담동, 청주시 사창동">`}
      </div>
      <div class="auth-field">
        <label>${escapeHtml(c.messageLabel)} <span class="review-optional">선택</span></label>
        <textarea id="contactMessage" class="contact-textarea" maxlength="500" placeholder="${escapeHtml(c.messagePlaceholder)}"></textarea>
      </div>
      <p class="auth-error" id="contactError"></p>
      <div class="game-action-row">
        ${backBtn}
        <button type="submit" class="survey-close-btn" style="flex:1;">문의 남기기</button>
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
  if(!name){ errEl.textContent = '이름을 입력해주세요.'; return; }
  if(!isEmailOrPhone(reach)){ errEl.textContent = '연락 받으실 이메일 또는 전화번호를 정확히 입력해주세요.'; return; }
  const c = contactTypes[type] || contactTypes.expand;
  contactBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>문의가 접수됐어요!</h3>
      <p>${escapeHtml(name)} 님, 고맙습니다. 남겨주신 연락처로 안내드릴게요.<br>(${escapeHtml(c.title)})</p>
      <div class="game-action-row">
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closeContact()">확인</button>
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
            <strong>${escapeHtml(r.name)}</strong>
            <span class="pass-cat">${r.cat}</span>
          </div>
        </div>
        <div class="pass-price">장당 <b>${r.pass.unit.toLocaleString()}원</b></div>
        <span class="pass-benefit-chip">🎁 ${escapeHtml(r.pass.benefit)}</span>
        <div class="pass-valid">유효기간 ${r.pass.validDays}일</div>
        <button type="button" class="pass-buy-btn" data-idx="${idx}">식권 예약하기</button>
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

function renderPassSelect(){
  const r = restaurants[passIdx];
  const p = r.pass;
  const picked = p.bundles[passBundleIdx];
  const total = p.unit * picked.count;
  passBody.innerHTML = `
    <div class="auth-head">
      <div class="emoji">${r.emoji}</div>
      <h3>${escapeHtml(r.name)} 식권</h3>
      <p>장당 ${p.unit.toLocaleString()}원 · ${escapeHtml(p.benefit)}</p>
    </div>
    <div class="auth-field">
      <label>몇 장 담을까요?</label>
      <div class="pass-bundle-list">
        ${p.bundles.map((b, i) => `
          <button type="button" class="pass-bundle ${i===passBundleIdx?'selected':''}" data-i="${i}">
            <span class="pass-bundle-count">${b.count}장${b.bonus ? ` <b>+${b.bonus}</b>` : ''}</span>
            <span class="pass-bundle-price">${(p.unit * b.count).toLocaleString()}원</span>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="pass-summary">
      <div class="pass-summary-row"><span>식권 ${picked.count}장</span><span>${total.toLocaleString()}원</span></div>
      ${picked.bonus ? `<div class="pass-summary-row bonus"><span>사장님 혜택 +${picked.bonus}장</span><span>0원</span></div>` : ''}
      <div class="pass-summary-row total"><span>실제 받는 식권</span><span>${picked.count + picked.bonus}장</span></div>
      <div class="pass-summary-row total"><span>결제 예정 금액</span><span>${total.toLocaleString()}원</span></div>
    </div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" onclick="closePass()">닫기</button>
      <button type="button" class="survey-close-btn" style="flex:1;" id="passNext">다음</button>
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
      <h3>이렇게 예약할까요?</h3>
      <p>아래 내용으로 사전 예약을 접수합니다.</p>
    </div>
    <div class="pass-summary">
      <div class="pass-summary-row"><span>가게</span><span>${r.emoji} ${escapeHtml(r.name)}</span></div>
      <div class="pass-summary-row"><span>구매 식권</span><span>${picked.count}장</span></div>
      ${picked.bonus ? `<div class="pass-summary-row bonus"><span>사장님 혜택</span><span>+${picked.bonus}장</span></div>` : ''}
      <div class="pass-summary-row total"><span>실제 받는 식권</span><span>${picked.count + picked.bonus}장</span></div>
      <div class="pass-summary-row total"><span>결제 예정 금액</span><span>${total.toLocaleString()}원</span></div>
      <div class="pass-summary-row"><span>유효기간</span><span>사용 시작일부터 ${p.validDays}일</span></div>
    </div>
    <div class="contact-note">지금은 <b>사전 예약</b>만 접수돼요. 실제 결제는 정식 오픈 때 연동될 예정이라, 지금 단계에서는 돈이 빠져나가지 않아요.</div>
    <div class="game-action-row">
      <button type="button" class="btn-ghost" style="flex:1;" id="passBack">뒤로</button>
      <button type="button" class="survey-close-btn" style="flex:1;" id="passSubmit">사전 예약 접수하기</button>
    </div>
  `;
  document.getElementById('passBack').addEventListener('click', renderPassSelect);
  document.getElementById('passSubmit').addEventListener('click', submitPassOrder);
}

function submitPassOrder(){
  const r = restaurants[passIdx];
  const p = r.pass;
  const picked = p.bundles[passBundleIdx];
  store.passOrders.unshift({
    place: r.name,
    emoji: r.emoji,
    count: picked.count,
    bonus: picked.bonus,
    unit: p.unit,
    total: p.unit * picked.count,
    at: new Date().toISOString().slice(0, 10),
  });
  const stored = saveState();
  passBody.innerHTML = `
    <div class="auth-welcome">
      <div class="emoji">🌾</div>
      <h3>예약이 접수됐어요!</h3>
      <p>${stored
        ? `${escapeHtml(r.name)} 식권 ${picked.count + picked.bonus}장을 담아뒀어요. 정식 오픈하면 결제 안내를 드릴게요.`
        : `${escapeHtml(r.name)} 식권을 담아뒀어요. 다만 저장 공간이 가득 차서 기록은 남기지 못했어요 — 새로고침하면 사라질 수 있어요.`}</p>
      <div class="game-action-row">
        <button type="button" class="btn-ghost" style="flex:1;" onclick="closePass()">닫기</button>
        <button type="button" class="survey-close-btn" style="flex:1;" onclick="closePass(); openMypage('pass');">내 식권 보기</button>
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
  {icon:'🎟️', label:'손주 식권', sub:'식권 예약과 제휴 안내', keywords:'식권 패스 pass 제휴 구매 예약 할인 멤버십', run:() => goSection('pass')},
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
      sub: `${r.cat} · ★ ${r.rating} · ${r.priceValue.toLocaleString()}원`,
      keywords: `${r.name} ${r.desc} ${r.cat}`,
      run: () => { closeAllSearch(); openDetail(i); },
    })),
  },
  {
    type:'손주 식권',
    items: () => getPassRestaurants().map(r => ({
      icon:'🎟️',
      label: `${r.name} 식권`,
      sub: `장당 ${r.pass.unit.toLocaleString()}원 · ${r.pass.benefit}`,
      keywords: `${r.name} 식권 패스 pass 쿠폰 ${r.pass.benefit} ${r.cat}`,
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
  groups.forEach(g => g.hits.forEach(h => searchFlat.push(h)));

  const hint = `<button type="button" class="search-hint" data-fallback="1">🔍 맛집 목록에서 "${escapeHtml(q)}" 찾아보기</button>`;
  container.innerHTML = groups.length === 0
    ? `<div class="search-empty">"${escapeHtml(q)}"에 해당하는 결과가 없어요.</div>${hint}`
    : groups.map(g => `
        <div class="search-group">
          <div class="search-group-title">${escapeHtml(g.type)}</div>
          ${g.hits.map(h => {
            const i = searchFlat.indexOf(h);
            return `
              <button type="button" class="search-item" data-i="${i}">
                <span class="search-icon">${h.icon}</span>
                <span class="search-text">
                  <span class="search-label">${escapeHtml(h.label)}</span>
                  <span class="search-sub">${escapeHtml(h.sub)}</span>
                </span>
              </button>
            `;
          }).join('')}
        </div>
      `).join('') + hint;
  container.classList.add('show');

  container.querySelectorAll('.search-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = searchFlat[Number(btn.dataset.i)];
      if(item) item.run();
    });
  });
  const fallback = container.querySelector('.search-hint');
  if(fallback) fallback.addEventListener('click', () => applyHeaderQuery(q));
}

function paintSearchActive(container){
  container.querySelectorAll('.search-item').forEach(btn => {
    const on = Number(btn.dataset.i) === searchActiveIndex;
    btn.classList.toggle('active', on);
    if(on) btn.scrollIntoView({block:'nearest'});
  });
}

// Enter로 검색어를 맛집 목록 필터에 넘긴다 (기존 헤더 검색은 스크롤만 하고 검색어를 버렸다)
function applyHeaderQuery(q){
  currentQuery = q;
  cardSearch.value = q;
  renderCards();
  closeAllSearch();
  document.getElementById('restaurants').scrollIntoView({behavior:'smooth'});
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
    else if(input.value.trim()) applyHeaderQuery(input.value.trim());
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
