-- ============================================================
-- 밥 먹으러 와 — AI 리뷰 요약 공용 캐시 테이블
-- ============================================================
-- Supabase 대시보드 → SQL Editor에 통째로 붙여넣고 Run 하면 된다.
-- 여러 번 실행해도 오류가 나지 않는다(if not exists / drop policy if exists).
--
-- 왜 필요한가:
--   요약은 모든 사용자에게 똑같은 결과인데, 캐시가 브라우저 로컬에만 있으면
--   호출이 "방문자 수 × 가게 수 × 언어 수"로 늘어난다. Gemini 무료 티어는
--   모델별 일일 한도가 있어서(실측: gemini-3.6-flash = 20건/일) 금방 429가 난다.
--   서버에 한 번만 저장해두면 호출이 "가게 수 × 언어 수"로 고정된다.
--
-- 행(row) 하나 = 가게 하나의 한 언어 요약. 리뷰가 바뀌면 그 줄을 덮어쓴다(줄이 늘지 않는다).
-- ============================================================

-- 1) 표 만들기
create table if not exists public.review_summaries (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id text not null,                       -- restaurants[].id 슬러그 (이름이 아니라 이것으로 잡는다)
  lang          text not null check (lang in ('ko','en','zh')),
  source_hash   text not null,                       -- 리뷰 원문들의 해시 — 구글 리뷰가 바뀌면 값이 달라진다
  summary       text not null,
  keywords      jsonb not null default '[]'::jsonb,
  model         text,                                -- 어떤 모델로 만들었는지 (모델을 갈아야 할 때 필요)
  updated_at    timestamptz not null default now(),

  -- 가게·언어당 한 줄. 리뷰가 바뀌면 이 줄을 갱신한다.
  constraint review_summaries_place_lang_unique unique (restaurant_id, lang)
);

-- 2) 조회는 항상 (가게, 언어)로 들어온다 — 위 unique 제약이 인덱스 역할을 그대로 한다.

-- 3) 보안 규칙(RLS)
--    켜두고 정책은 하나도 만들지 않는다 = 공개 키로는 읽기도 쓰기도 안 된다.
--    이 표는 개인 데이터가 아니지만, 공개 키로 insert를 열면 누구나 아무 가게의 요약을 심을 수 있다.
--    (리뷰가 공개라 source_hash도 계산 가능해서 실제로 오염된다.)
--    쓰기·읽기는 서버 전용 secret 키를 쓰는 api/review-analysis.js 만 통과한다.
--    saved_restaurants의 "auth.uid() = user_id" 패턴을 쓰지 않는 이유가 이것이다 —
--    거기는 사람마다 자기 줄이 있지만, 여기는 주인이 없는 공용 캐시다.
alter table public.review_summaries enable row level security;

drop policy if exists "no public read"  on public.review_summaries;
drop policy if exists "no public write" on public.review_summaries;
