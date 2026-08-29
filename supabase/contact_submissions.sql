-- ============================================================
-- 밥 먹으러 와 — 손주 힘 보태기 · 사장님 제휴 등 문의 접수함
-- ============================================================
-- Supabase 대시보드 → SQL Editor에 통째로 붙여넣고 Run 하면 된다.
-- 여러 번 실행해도 오류가 나지 않는다(if not exists / drop policy if exists).
--
-- extra.md §7의 참여/후원/제휴 문의 폼(submitContact())이 쓰는 접수함이다.
-- store_owners와 같은 철학: RLS로 클라이언트 접근을 막아두고, 관리자는
-- api/admin-contacts.js(서비스 role, RLS 우회 + ADMIN_EMAIL 검증)를 거쳐서만 읽고 쓴다.
-- 그래서 select/update 정책도 두지 않는다 — 문의는 "보내고 나면 남이 못 보는" 편지함이고,
-- 관리자 화면(마이페이지의 "관리자" 탭)조차 클라이언트에서 이 표를 직접 읽지 않는다.
--
-- status 값: new(신규) / contacted(연락함) / approved(승인·사장님 등록됨) / rejected(거절).
-- ============================================================

-- 1) 표 만들기
create table if not exists public.contact_submissions (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,                     -- team/sponsor/partnerStore/partnerOrg/expand
  name            text not null,
  reach           text not null,                     -- 이메일 또는 전화번호
  field           text,                               -- 선택한 옵션 또는 자유 입력(지역 등)
  message         text,
  user_id         uuid references auth.users(id) on delete set null, -- 로그인 상태로 남겼다면 연결
  status          text not null default 'new',        -- new/contacted/approved/rejected
  admin_note      text,                                -- 관리자 메모·거절 사유 (선택)
  created_at      timestamptz not null default now()
);

-- 1-1) 이미 표가 있던 경우(이전 세션에 만들어둔 버전) admin_note만 추가로 얹는다
alter table public.contact_submissions add column if not exists admin_note text;

-- 2) 관리자가 최신순으로 훑어보기 위한 인덱스
create index if not exists contact_submissions_created_idx
  on public.contact_submissions (created_at desc);

-- 3) 보안 규칙(RLS) — 누구나 보낼 수 있지만, 아무도(로그인해도) 다시 읽을 수 없다
alter table public.contact_submissions enable row level security;

drop policy if exists "insert contact submissions" on public.contact_submissions;
create policy "insert contact submissions" on public.contact_submissions
  for insert with check (true);
