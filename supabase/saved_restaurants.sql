-- ============================================================
-- 밥 먹으러 와 — 저장목록("가보고 싶은 곳에 담기") 테이블
-- ============================================================
-- Supabase 대시보드 → SQL Editor에 통째로 붙여넣고 Run 하면 된다.
-- 여러 번 실행해도 오류가 나지 않는다(if not exists / drop policy if exists).
--
-- 행(row) 하나 = 한 사람이 담은 가게 하나.
--   담기        → insert 한 줄
--   담기 해제   → 그 줄 delete
--   가본 곳     → 같은 줄의 visited_at에 시각 기록 (줄이 새로 생기지 않는다)
-- ============================================================

-- 1) 표 만들기
create table if not exists public.saved_restaurants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade, -- 누가 담았는지
  restaurant_id   text not null,                     -- 가게 고유번호 (슬러그)
  restaurant_name text not null,                     -- 가게 이름
  category        text,                              -- 카테고리 (한식/양식/중식/일식/분식)
  address         text,                              -- 주소
  lat             double precision,                  -- 위도
  lng             double precision,                  -- 경도
  visited_at      timestamptz,                       -- 가본 곳으로 표시한 시각 (안 갔으면 null)
  created_at      timestamptz not null default now(),-- 담은 시간 (자동으로 적힘)

  -- 같은 사람이 같은 가게를 두 번 담을 수 없다
  constraint saved_restaurants_user_place_unique unique (user_id, restaurant_id)
);

-- 2) 내 저장목록을 최신순으로 빨리 읽기 위한 인덱스
create index if not exists saved_restaurants_user_idx
  on public.saved_restaurants (user_id, created_at desc);

-- 3) 보안 규칙(RLS) — 내 줄만 읽고 쓸 수 있다
alter table public.saved_restaurants enable row level security;

drop policy if exists "select own saves" on public.saved_restaurants;
create policy "select own saves" on public.saved_restaurants
  for select using (auth.uid() = user_id);

drop policy if exists "insert own saves" on public.saved_restaurants;
create policy "insert own saves" on public.saved_restaurants
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own saves" on public.saved_restaurants;
create policy "update own saves" on public.saved_restaurants
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own saves" on public.saved_restaurants;
create policy "delete own saves" on public.saved_restaurants
  for delete using (auth.uid() = user_id);
