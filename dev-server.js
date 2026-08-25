// 로컬 개발 서버 — 정적 파일 + api/*.js 서버리스 함수를 같이 띄운다.
//
// 왜 필요한가: script.js는 `/api/kakao-search`, `/api/google-reviews`를 절대경로로
// 호출하는데, 이 핸들러들은 Vercel 서버리스 함수다. index.html을 브라우저로 직접
// 열면(file://) 그 경로를 실행할 주체가 없어서 카카오 검색과 구글 리뷰가 항상 실패한다.
// 단순 정적 서버로 띄워도 마찬가지로 404다. 이 파일이 그 빈자리를 메운다.
//
// 실행: node dev-server.js   →   http://localhost:3000
//
// Node 내장 모듈만 쓴다(의존성 설치 불필요). API 키는 .env.local에서 직접 읽는다.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

// ── .env.local 로더 ──────────────────────────────────────────
// dotenv 의존성 없이 KEY=VALUE 형식만 최소한으로 파싱한다.
function loadEnvLocal() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) {
    console.warn('[dev] .env.local 이 없습니다 — 카카오/구글 기능은 동작하지 않습니다.');
    return;
  }
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // 값이 따옴표로 감싸져 있으면 벗긴다
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// ── Vercel 핸들러 shim ───────────────────────────────────────
// api/*.js는 (req, res)를 받되 req.query와 res.status().json()을 기대한다.
// Node의 기본 http 객체에는 없으므로 여기서 씌워준다.
function decorate(req, res, url) {
  req.query = Object.fromEntries(url.searchParams);

  res.status = (code) => {
    res.statusCode = code;
    return res; // 체이닝(res.status(200).json(...))을 위해 반드시 res를 반환
  };

  res.json = (obj) => {
    const body = JSON.stringify(obj);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(body);
    return res;
  };

  res.send = (body) => {
    res.end(body);
    return res;
  };
}

// Vercel은 POST의 JSON 본문을 자동으로 req.body에 파싱해서 넘겨준다.
// Node 기본 http에는 그게 없으므로, review-analysis.js 같은 POST 핸들러를 위해 여기서 흉내낸다.
function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.method !== 'POST') { resolve(undefined); return; }
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); }
    });
  });
}

async function handleApi(req, res, url) {
  const name = url.pathname.replace(/^\/api\//, '');

  // 경로 조작 차단: 파일명에 슬래시나 점이 섞이면 거부
  if (!/^[a-z0-9-]+$/i.test(name)) {
    res.statusCode = 400;
    res.end('bad api route');
    return;
  }

  const file = path.join(ROOT, 'api', name + '.js');
  if (!fs.existsSync(file)) {
    res.statusCode = 404;
    res.end('no such api route: ' + name);
    return;
  }

  decorate(req, res, url);
  req.body = await readJsonBody(req);

  try {
    // 매 요청마다 캐시를 비워서 핸들러를 고치면 서버 재시작 없이 반영되게 한다.
    delete require.cache[require.resolve(file)];
    const handler = require(file);
    await handler(req, res);
    console.log(`[api] ${name} → ${res.statusCode}`);
  } catch (e) {
    console.error(`[api] ${name} 실패:`, e);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('handler error');
    }
  }
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  // ROOT 밖으로 나가는 경로는 막는다
  const target = path.join(ROOT, pathname);
  if (!target.startsWith(ROOT)) {
    res.statusCode = 403;
    res.end('forbidden');
    return;
  }

  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 — ' + pathname);
      return;
    }
    res.setHeader('Content-Type', MIME[path.extname(target).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store'); // 개발 중엔 항상 최신 파일
    fs.createReadStream(target).pipe(res);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url);
  } else {
    serveStatic(req, res, url);
  }
}).listen(PORT, () => {
  const has = (k) => (process.env[k] ? 'OK' : '없음');
  console.log(`\n  밥먹으러와 로컬 서버  http://localhost:${PORT}`);
  console.log(`  메모장(연동 데모)     http://localhost:${PORT}/supabase-demo.html`);
  console.log(`\n  GOOGLE_PLACES_API_KEY: ${has('GOOGLE_PLACES_API_KEY')}`);
  console.log(`  KAKAO_REST_KEY:        ${process.env.KAKAO_REST_KEY || process.env.KAKAO_REST_API_KEY ? 'OK' : '없음'}`);
  console.log('\n  종료: Ctrl + C\n');
});
