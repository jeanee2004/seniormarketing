-- ============================================================
-- 밥 먹으러 와 — 손주 리뷰 테이블
-- ============================================================
-- Supabase 대시보드 → SQL Editor에 통째로 붙여넣고 Run 하면 된다.
-- 여러 번 실행해도 오류가 나지 않는다(if not exists / drop policy if exists).
--
-- saved_restaurants와 달리 이 표는 "내 것만" 보이는 개인 목록이 아니라
-- 모든 방문자가 볼 수 있는 공개 리뷰 피드다(구글 리뷰와 같은 성격).
-- 그래서 select 정책이 auth.uid() 제한 없이 누구나 읽을 수 있게 열려 있고,
-- insert/delete만 "내 것만" 규칙을 따른다.
-- ============================================================

-- 1) 표 만들기
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  restaurant_id   text,                              -- 가게 슬러그(예시 가게는 없을 수 있어 nullable)
  restaurant_name text not null,                      -- 작성 시점 표시명 그대로 저장(기존 로컬 동작과 동일)
  stars           smallint not null check (stars between 1 and 5),
  body            text not null,
  photo           text,                               -- 첨부 사진 (축소된 data URL, 선택)
  reviewer_name   text not null,                       -- 실명 또는 "익명의 손주" — 작성 시점에 고정
  reviewer_emoji  text not null,
  created_at      timestamptz not null default now()
);

-- 2) 최신순으로 전체 피드를 빨리 읽기 위한 인덱스 + 내 리뷰 삭제용 인덱스
create index if not exists reviews_created_idx on public.reviews (created_at desc);
create index if not exists reviews_user_idx on public.reviews (user_id, created_at desc);

-- 3) 보안 규칙(RLS) — 읽기는 전체 공개, 쓰기/삭제는 내 것만
alter table public.reviews enable row level security;

drop policy if exists "select all reviews" on public.reviews;
create policy "select all reviews" on public.reviews
  for select using (true);

drop policy if exists "insert own reviews" on public.reviews;
create policy "insert own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "delete own reviews" on public.reviews;
create policy "delete own reviews" on public.reviews
  for delete using (auth.uid() = user_id);
