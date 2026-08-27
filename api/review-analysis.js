// 가게 리뷰 텍스트를 받아 Gemini로 요약 + 키워드를 뽑아 반환한다.
// GEMINI_API_KEY는 서버(Vercel 환경변수)에만 존재하며 클라이언트로 절대 내려가지 않는다.
// 가게당 리뷰가 5건 안팎이라 map-reduce/배치 없이 단일 호출로 끝낸다.

// 모델 선택은 취향이 아니라 무료 티어 한도 문제다. gemini-3.6-flash는 하루 20건이 끝이라
// (실측: GenerateRequestsPerDayPerProjectPerModel-FreeTier, limit 20) 조금만 써도 429가 난다.
// lite 계열은 한도가 훨씬 넉넉하고 이 작업(짧은 리뷰 5건 요약)에는 성능도 충분하다.
// 한도는 모델별로 따로 세므로, 모델을 바꾸면 그날 다른 모델에서 쓴 양과도 무관해진다.
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_CONTENT_CHARS = 500;
const MAX_RETRIES = 2;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: '리뷰 전체를 요약한 2~3문장' },
    keywords: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING', description: '짧은 명사구 키워드' },
          sentiment: { type: 'STRING', enum: ['POSITIVE', 'NEGATIVE'] },
        },
        required: ['label', 'sentiment'],
      },
    },
  },
  required: ['summary', 'keywords'],
};

// 리뷰 원문은 대부분 한국어지만 출력 언어는 사이트 언어를 따라가야 한다 —
// 영어로 보는 사람에게 한국어 요약만 나오면 이 기능이 없는 것과 같다.
const LANG_NAME = { ko: '한국어', en: '영어', zh: '중국어(간체)', es: '스페인어' };

function systemInstruction(lang){
  const out = LANG_NAME[lang] || LANG_NAME.ko;
  return '너는 식당 리뷰 요약 어시스턴트다. 주어진 리뷰들을 분석해 지정된 JSON 스키마로만 응답한다. ' +
    '요약은 실제 리뷰 내용에 근거해야 하며 추측을 지어내지 않는다. ' +
    '키워드는 "맛있어요" 같은 일반어 대신 구체적인 특징(예: 국물이 진함, 친절한 사장님, 가성비)을 최대 6개까지 고른다. ' +
    '리뷰 원문의 언어와 상관없이 summary와 keywords의 label은 모두 ' + out + '로 작성한다.';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 공용 캐시 (Supabase public.review_summaries) ───────────────────────────
// 요약은 모든 사용자에게 똑같은 결과인데 캐시가 브라우저 로컬에만 있으면 호출이
// "방문자 수 × 가게 수 × 언어 수"로 늘어난다. Gemini 무료 티어는 모델별 일일 한도가 있어서
// (실측: gemini-3.6-flash = 20건/일) 금방 429가 난다. 서버에 한 번만 저장해두면
// 호출이 "가게 수 × 언어 수"로 고정되고, 그 뒤로는 방문자가 몇 명이든 0건이다.
//
// SUPABASE_SECRET_KEY는 RLS를 우회하는 서버 전용 키다. 이 표는 RLS만 켜고 정책이 하나도 없어서
// 공개 키로는 읽기도 쓰기도 안 된다 — 공개 키로 insert를 열면 누구나 아무 가게의 요약을
// 심을 수 있다(리뷰가 공개라 source_hash도 계산 가능하다).
//
// 키나 URL이 없으면 캐시를 통째로 건너뛰고 예전처럼 매번 Gemini를 부른다.
// 지도(config.js 없음)·구글 리뷰(CDN 막힘)와 같은 "조용히 degrade" 관례다.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const cacheEnabled = () => !!(SUPABASE_URL && SUPABASE_SECRET_KEY);

const REST = () => String(SUPABASE_URL).replace(/[/]+$/, '') + '/rest/v1/review_summaries';
const restHeaders = () => ({
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

// 리뷰 원문이 바뀌면 해시가 달라져 요약을 다시 만든다.
// 별점까지 넣는 이유: 본문이 같아도 별점이 바뀌면 요약의 톤이 달라져야 한다.
function sourceHash(reviews) {
  const basis = reviews
    .map((r) => `${r.rating || ''}:${String(r.text || '').trim()}`)
    .join('|~|');
  return require('crypto').createHash('sha256').update(basis).digest('hex');
}

async function readCache(restaurantId, lang, hash) {
  if (!cacheEnabled() || !restaurantId) return null;
  try {
    const url = `${REST()}?restaurant_id=eq.${encodeURIComponent(restaurantId)}`
      + `&lang=eq.${encodeURIComponent(lang)}&select=summary,keywords,source_hash&limit=1`;
    const res = await fetch(url, { headers: restHeaders() });
    if (!res.ok) return null;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    // 해시가 다르면 구글 리뷰가 바뀐 것이라 캐시를 안 쓴다(아래에서 새로 만들어 덮어쓴다).
    if (!row || row.source_hash !== hash) return null;
    return { summary: String(row.summary || ''), keywords: Array.isArray(row.keywords) ? row.keywords : [] };
  } catch (e) {
    return null;  // 캐시 실패가 기능 실패가 되면 안 된다
  }
}

async function writeCache(restaurantId, lang, hash, payload) {
  if (!cacheEnabled() || !restaurantId) return;
  try {
    await fetch(`${REST()}?on_conflict=restaurant_id,lang`, {
      method: 'POST',
      headers: { ...restHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        lang,
        source_hash: hash,
        summary: payload.summary,
        keywords: payload.keywords,
        model: GEMINI_MODEL,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    // 저장 실패는 무시한다 — 사용자는 이미 요약을 받았고, 다음 사람이 다시 만들면 된다
  }
}

function buildPrompt(reviews) {
  const data = reviews.map((r) => ({
    rating: r.rating || null,
    content: String(r.text || '').slice(0, MAX_CONTENT_CHARS),
  }));
  return [
    '아래 식당 리뷰들을 분석해 summary(2~3문장 요약)와 keywords(최대 6개)를 JSON으로 반환하라.',
    '리뷰 목록(JSON):',
    JSON.stringify(data),
  ].join('\n');
}

async function callGemini(apiKey, prompt, lang) {
  const url = `${API_BASE}/${GEMINI_MODEL}:generateContent`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction(lang) }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      maxOutputTokens: 1024,
      // 3.x는 thinkingBudget을 안 받는다(400). thinkingLevel로 최소한만 생각하게 한다.
      thinkingConfig: { thinkingLevel: 'low' },
    },
  });

  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
    });
    if (res.ok) return res.json();

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < MAX_RETRIES) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    const detail = await res.text().catch(() => '');
    throw new Error(`gemini_${res.status}: ${detail.slice(0, 200)}`);
  }
}

function extractJson(envelope) {
  const text = (envelope?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || '')
    .join('')
    .trim();
  if (!text) throw new Error('empty_response');
  return JSON.parse(text);
}

module.exports = async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'server_missing_api_key' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const reviews = (body && Array.isArray(body.reviews)) ? body.reviews : [];
  const lang = ['ko', 'en', 'zh', 'es'].includes(body && body.lang) ? body.lang : 'ko';
  // 가게 이름이 아니라 슬러그로 잡는다 — 이름은 바뀔 수 있고 슬러그는 안 바뀐다.
  const restaurantId = String((body && body.id) || '').trim();
  if (reviews.length === 0) {
    res.status(200).json({ found: false });
    return;
  }

  const hash = sourceHash(reviews);
  const hit = await readCache(restaurantId, lang, hash);
  if (hit) {
    res.status(200).json({ found: true, cached: true, summary: hit.summary, keywords: hit.keywords });
    return;
  }

  try {
    const envelope = await callGemini(apiKey, buildPrompt(reviews), lang);
    const data = extractJson(envelope);
    const payload = {
      summary: String(data.summary || ''),
      keywords: (Array.isArray(data.keywords) ? data.keywords : []).slice(0, 6).map((k) => ({
        label: String(k.label || ''),
        sentiment: k.sentiment === 'NEGATIVE' ? 'NEGATIVE' : 'POSITIVE',
      })),
    };
    // 저장을 기다렸다 응답하면 사용자만 느려진다 — 응답이 먼저다.
    res.status(200).json({ found: true, cached: false, ...payload });
    await writeCache(restaurantId, lang, hash, payload);
  } catch (e) {
    res.status(502).json({ error: 'upstream_error' });
  }
};
