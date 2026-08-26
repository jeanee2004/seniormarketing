-- ============================================================
-- 밥 먹으러 와 — 손주 식권 사전예약 테이블
-- ============================================================
-- Supabase 대시보드 → SQL Editor에 통째로 붙여넣고 Run 하면 된다.
-- 여러 번 실행해도 오류가 나지 않는다(if not exists / drop policy if exists).
--
-- saved_restaurants와 같은 성격의 개인 목록이다 — 내 예약 내역은 나만 본다.
-- 실제 결제는 하지 않는다(사전예약 기록일 뿐). CLAUDE.md의 손주 식권 법적 제약 참고.
-- ============================================================

-- 1) 표 만들기
create table if not exists public.pass_orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  restaurant_id   text,                              -- 가게 슬러그
  restaurant_name text not null,                      -- 예약 시점 표시명(언어별로 그대로 저장)
  emoji           text,
  unit_price      integer not null,                   -- 장당 가격
  count           integer not null,                   -- 구매 수량
  bonus           integer not null default 0,          -- 10+1 등 사장님 보너스 수량
  total           integer not null,                    -- unit_price * count
  created_at      timestamptz not null default now()
);

-- 2) 내 예약 내역을 최신순으로 빨리 읽기 위한 인덱스
create index if not exists pass_orders_user_idx on public.pass_orders (user_id, created_at desc);

-- 3) 보안 규칙(RLS) — 내 줄만 읽고 쓸 수 있다
alter table public.pass_orders enable row level security;

drop policy if exists "select own pass orders" on public.pass_orders;
create policy "select own pass orders" on public.pass_orders
  for select using (auth.uid() = user_id);

drop policy if exists "insert own pass orders" on public.pass_orders;
create policy "insert own pass orders" on public.pass_orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "delete own pass orders" on public.pass_orders;
create policy "delete own pass orders" on public.pass_orders
  for delete using (auth.uid() = user_id);
