// 관리자 마이페이지("관리자" 탭)가 쓰는 단일 엔드포인트 — 문의 목록 조회, 상태 변경,
// 사장님(store_owners) 승인을 전부 여기서 처리한다.
//
// 왜 서버를 거치는가: contact_submissions/store_owners는 RLS로 클라이언트(로그인 여부와
// 무관하게) 접근이 완전히 막혀 있다. 여기서만 SUPABASE_SECRET_KEY(RLS 우회, 서버 전용)를
// 써서 실제로 읽고 쓴다 — api/review-analysis.js의 REST + 시크릿 키 헤더 패턴을 그대로 따른다.
//
// 관리자 여부는 클라이언트가 주장하는 값을 절대 믿지 않는다. 요청에 실린 Supabase 세션
// 토큰을 Supabase Auth 자체(GET /auth/v1/user)로 검증해 진짜 로그인된 이메일을 얻고,
// 그 이메일이 서버 환경변수 ADMIN_EMAIL과 일치할 때만 통과시킨다. 이 파일 자체가 그 검증
// 로직을 갖고 있으므로, 소스를 읽어도 통과할 수 있는 값(비밀번호 같은 것)이 없다 —
// script.js의 ADMIN_PASSPHRASE(이용 분석 게이트)와는 성격이 다르다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mLipCnG1P2J2iJckvbaVZg_daYRe2VR';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const configured = () => !!(SUPABASE_URL && SUPABASE_SECRET_KEY && ADMIN_EMAIL);

const baseUrl = () => String(SUPABASE_URL).replace(/[/]+$/, '');
const restHeaders = () => ({
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

async function verifyAdmin(req) {
  const auth = req.headers && req.headers.authorization;
  const token = auth && /^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, '') : '';
  if (!token) return false;
  try {
    const res = await fetch(`${baseUrl()}/auth/v1/user`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const user = await res.json();
    return !!user && typeof user.email === 'string' && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  } catch (e) {
    return false;
  }
}

async function listSubmissions() {
  const url = `${baseUrl()}/rest/v1/contact_submissions?select=id,type,name,reach,field,message,status,admin_note,created_at&order=created_at.desc`;
  const res = await fetch(url, { headers: restHeaders() });
  if (!res.ok) throw new Error(`list_${res.status}`);
  return res.json();
}

async function setStatus(id, status, adminNote) {
  const url = `${baseUrl()}/rest/v1/contact_submissions?id=eq.${encodeURIComponent(id)}`;
  const patch = { status };
  if (adminNote !== undefined) patch.admin_note = adminNote;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...restHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`setStatus_${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : null;
}

// 가입 여부는 이메일로만 조회한다 — 문의를 전화번호로 남긴 경우 관리자가 화면에서
// 실제 가입 이메일을 직접 입력해 넘겨야 한다(ownerEmail 파라미터).
async function findAuthUserByEmail(email) {
  const url = `${baseUrl()}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { headers: restHeaders() });
  if (!res.ok) throw new Error(`lookup_${res.status}`);
  const data = await res.json();
  const users = Array.isArray(data) ? data : (data && Array.isArray(data.users) ? data.users : []);
  return users[0] || null;
}

async function upsertStoreOwner(userId, restaurantId) {
  const url = `${baseUrl()}/rest/v1/store_owners?on_conflict=user_id,restaurant_id`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...restHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, restaurant_id: restaurantId }),
  });
  if (!res.ok) throw new Error(`store_owners_${res.status}`);
}

module.exports = async function handler(req, res) {
  if (!configured()) {
    res.status(500).json({ ok: false, error: 'server_missing_config' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }
  if (!(await verifyAdmin(req))) {
    res.status(403).json({ ok: false, error: 'forbidden' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  try {
    if (body.action === 'list') {
      const items = await listSubmissions();
      res.status(200).json({ ok: true, items });
      return;
    }

    if (body.action === 'setStatus') {
      const id = String(body.id || '').trim();
      const status = String(body.status || '').trim();
      if (!id || !['new', 'contacted', 'approved', 'rejected'].includes(status)) {
        res.status(400).json({ ok: false, error: 'bad_request' });
        return;
      }
      const item = await setStatus(id, status, body.admin_note);
      res.status(200).json({ ok: true, item });
      return;
    }

    if (body.action === 'approve') {
      const id = String(body.id || '').trim();
      const restaurantId = String(body.restaurantId || '').trim();
      const ownerEmail = String(body.ownerEmail || '').trim();
      if (!id || !restaurantId || !ownerEmail) {
        res.status(400).json({ ok: false, error: 'bad_request' });
        return;
      }
      const authUser = await findAuthUserByEmail(ownerEmail);
      if (!authUser) {
        res.status(200).json({ ok: false, error: 'not_signed_up' });
        return;
      }
      await upsertStoreOwner(authUser.id, restaurantId);
      const item = await setStatus(id, 'approved');
      res.status(200).json({ ok: true, item });
      return;
    }

    res.status(400).json({ ok: false, error: 'unknown_action' });
  } catch (e) {
    res.status(502).json({ ok: false, error: 'upstream_error' });
  }
};
