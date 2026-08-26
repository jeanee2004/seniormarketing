-- ============================================================
-- 밥 먹으러 와 — 사장님 권한(role) 테이블
-- ============================================================
-- Supabase 대시보드 → SQL Editor에 통째로 붙여넣고 Run 하면 된다.
-- 여러 번 실행해도 오류가 나지 않는다(if not exists / drop policy if exists).
--
-- 지금 단계는 접근 제어 "구조"만 만든다 — 사장님 화면 자체는 아직 없다(next.md C5).
-- 행 하나 = "이 사람이 이 가게의 사장님"이라는 사실 하나.
--
-- 권한 부여는 신청/승인 폼이 아니라 관리자가 직접 지정한다(9월 현장조사 전이라
-- 실제 사장님 계정이 아직 없음). 그래서 insert/update/delete 정책을 의도적으로
-- 하나도 두지 않는다 — RLS가 켜진 채로 정책이 없으면 클라이언트(로그인한 손주
-- 계정 포함)는 아무도 이 표에 쓸 수 없고, 오직 대시보드/SQL Editor(서비스 role,
-- RLS를 우회함)로만 행을 추가·삭제할 수 있다. select만 "내 것"으로 열려 있어
-- 로그인한 사장님이 자신이 어느 가게의 사장님으로 지정됐는지 확인할 수 있다.
-- ============================================================

-- 1) 표 만들기
create table if not exists public.store_owners (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  restaurant_id   text not null,                     -- 가게 슬러그 (restaurants[].id)
  created_at      timestamptz not null default now(),

  -- 같은 사람이 같은 가게에 중복으로 지정되지 않는다
  constraint store_owners_user_restaurant_unique unique (user_id, restaurant_id)
);

-- 2) 로그인한 사람이 자신의 권한을 빨리 조회하기 위한 인덱스
create index if not exists store_owners_user_idx on public.store_owners (user_id);

-- 3) 보안 규칙(RLS) — 읽기는 내 것만, 쓰기는 아무도 못한다(관리자만 서비스 role로 직접 조작)
alter table public.store_owners enable row level security;

drop policy if exists "select own ownership" on public.store_owners;
create policy "select own ownership" on public.store_owners
  for select using (auth.uid() = user_id);
