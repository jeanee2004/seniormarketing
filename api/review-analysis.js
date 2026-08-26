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
const LANG_NAME = { ko: '한국어', en: '영어', zh: '중국어(간체)' };

function systemInstruction(lang){
  const out = LANG_NAME[lang] || LANG_NAME.ko;
  return '너는 식당 리뷰 요약 어시스턴트다. 주어진 리뷰들을 분석해 지정된 JSON 스키마로만 응답한다. ' +
    '요약은 실제 리뷰 내용에 근거해야 하며 추측을 지어내지 않는다. ' +
    '키워드는 "맛있어요" 같은 일반어 대신 구체적인 특징(예: 국물이 진함, 친절한 사장님, 가성비)을 최대 6개까지 고른다. ' +
    '리뷰 원문의 언어와 상관없이 summary와 keywords의 label은 모두 ' + out + '로 작성한다.';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  const lang = ['ko', 'en', 'zh'].includes(body && body.lang) ? body.lang : 'ko';
  if (reviews.length === 0) {
    res.status(200).json({ found: false });
    return;
  }

  try {
    const envelope = await callGemini(apiKey, buildPrompt(reviews), lang);
    const data = extractJson(envelope);
    res.status(200).json({
      found: true,
      summary: String(data.summary || ''),
      keywords: (Array.isArray(data.keywords) ? data.keywords : []).slice(0, 6).map((k) => ({
        label: String(k.label || ''),
        sentiment: k.sentiment === 'NEGATIVE' ? 'NEGATIVE' : 'POSITIVE',
      })),
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream_error' });
  }
};
