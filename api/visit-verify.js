// 방문 인증 — 영수증이나 가게 간판 사진을 받아 Gemini가 "이 가게가 맞는지"를 판정한다.
// 리뷰 작성이 방문 완료를 관문으로 쓰기 때문에(openReviewForm), 방문 완료 자체를 아무나
// 누를 수 있으면 가보지도 않은 사람이 리뷰를 남길 수 있다. 그 앞을 막는 게 이 엔드포인트다.
//
// 완전한 증명은 아니다(남의 영수증 사진도 통과할 수 있다) — 억지력이다. 안내 문구도 그렇게 쓴다.
// GEMINI_API_KEY는 서버(Vercel 환경변수)에만 존재하며 클라이언트로 절대 내려가지 않는다.
// 사진은 판정에만 쓰고 어디에도 저장하지 않는다.

// review-analysis.js와 같은 이유로 lite 계열을 쓴다 — 3.6-flash는 무료 티어 하루 20건이라
// 인증이 하루 스무 번만 되는 셈이 된다. 자세한 배경은 그 파일의 주석 참고.
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_RETRIES = 2;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    kind: { type: 'STRING', enum: ['RECEIPT', 'SIGN', 'OTHER'], description: '영수증 / 가게 간판·외관 / 둘 다 아님' },
    nameMatch: { type: 'BOOLEAN', description: '사진에서 읽히는 상호가 대상 가게와 같은 곳으로 보이면 true' },
    reason: { type: 'STRING', description: '판정 이유 한 문장' },
  },
  required: ['kind', 'nameMatch', 'reason'],
};

const LANG_NAME = { ko: '한국어', en: 'English', zh: '중국어(간체)', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function systemInstruction(lang) {
  return [
    '너는 식당 방문 인증 심사자다. 사진 한 장을 보고 지정된 JSON 스키마로만 응답한다.',
    'kind: 영수증이면 RECEIPT, 가게 간판·외관·내부처럼 그 가게임을 알 수 있는 사진이면 SIGN, 둘 다 아니면 OTHER.',
    'nameMatch: 사진에서 실제로 읽히는 상호가 주어진 가게와 같은 곳으로 보일 때만 true.',
    '사진에 상호가 전혀 안 보이면 nameMatch는 false다. 추측해서 맞다고 하지 마라.',
    '간판 사진의 상호는 띄어쓰기나 영문 표기가 다를 수 있으니 그 정도 차이는 같은 곳으로 본다.',
    `reason은 ${LANG_NAME[lang] || '한국어'}로 한 문장만 쓴다.`,
  ].join(' ');
}

function parseDataUrl(image) {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(String(image || ''));
  if (!m) return null;
  return { mimeType: m[1], data: m[2] };
}

async function callGemini(apiKey, parts, lang) {
  const url = `${API_BASE}/${GEMINI_MODEL}:generateContent`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction(lang) }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      maxOutputTokens: 512,
      // 3.x는 thinkingBudget을 거부한다(400). thinkingLevel로 최소한만 생각하게 한다.
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
  body = body || {};

  const name = String(body.name || '').trim();
  const address = String(body.address || '').trim();
  const lang = ['ko', 'en', 'zh', 'es', 'fr', 'de', 'ja'].includes(body.lang) ? body.lang : 'ko';
  const image = parseDataUrl(body.image);

  if (!name || !image) {
    res.status(400).json({ error: 'missing_params' });
    return;
  }
  if (Buffer.byteLength(image.data, 'base64') > MAX_IMAGE_BYTES) {
    res.status(413).json({ error: 'image_too_large' });
    return;
  }

  const prompt = [
    `대상 가게 이름: ${name}`,
    address ? `대상 가게 주소: ${address}` : '',
    '이 사진이 위 가게의 영수증 또는 간판·외관 사진인지 판정하라.',
  ].filter(Boolean).join('\n');

  try {
    const envelope = await callGemini(apiKey, [
      { text: prompt },
      { inlineData: { mimeType: image.mimeType, data: image.data } },
    ], lang);
    const data = extractJson(envelope);
    const kind = ['RECEIPT', 'SIGN', 'OTHER'].includes(data.kind) ? data.kind : 'OTHER';
    const nameMatch = data.nameMatch === true;
    res.status(200).json({
      ok: kind !== 'OTHER' && nameMatch,
      kind,
      nameMatch,
      reason: String(data.reason || ''),
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream_error' });
  }
};
