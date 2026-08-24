# 다음 세션 할 일

## 이번 세션까지 완료된 것 (요약, 2026-08-21 기준)
- 구글 Places API (New) 실시간 리뷰 연동 (`api/google-reviews.js`) — 150m 반경 필터, 5개 필드 제한, not-found 처리, `store.googleReviews`(localStorage) 캐시
- 카카오 로컬 API 실시간 가게 검색 (`api/kakao-search.js`) — "동네 가게 찾아보기" 하나로 통합, 실제 가게 그리드 바로 아래로 배치
- 실제 가게 9곳(카카오+구글로 실존 확인됨) / 예시(목업) 가게 3곳으로 데이터 분리, 카테고리·정렬·가격 필터는 실제 가게 쪽에 적용
- "개강 후 터줏대감 사장님을 찾아갑니다" 로드맵 섹션 신설
- 지도: Leaflet.js + OpenStreetMap 실제 타일로 구현 (구글 지도는 Maps JS/Static API 미활성화로 불가 — 아래 참고), 마커 클릭 시 상세 모달 연결
- **영어 버전(언어 토글) 완료** — 헤더 🌐 버튼 실제 동작, `store.lang`으로 유지됨. Phase 1(핵심 경로: 헤더·히어로·문제·로드맵·지도·맛집 카드/상세·구글 리뷰·실시간 검색) + Phase 2(부가 모달: 취향 설문, 메뉴 추천 게임, 손주 로그인·가입, 마이페이지, 리뷰 작성 폼, 서비스 소개, FAQ, 참여·후원·제휴 문의, 손주 식권) 전부 번역 완료
- Vercel 배포 연동 완료, 환경변수 등록 확인, 배포 사이트에서 전체 기능 직접 브라우저로 검증 완료
- **영어 버전 마지막 남은 부분(약관·개인정보처리방침 페이지) 번역 완료** — `privacy.html`/`terms.html`은 여전히 `script.js` 미포함(공유 스크립트 안 씀, CLAUDE.md 원칙 유지) 구조라, 각 페이지에 독립된 인라인 토글 스크립트를 추가: `localStorage`의 `bmw:v1.lang`을 공유해서 메인 사이트에서 English로 설정해두면 이 페이지들도 자동으로 영어로 열리고, 헤더의 자체 토글 버튼으로 페이지 내에서도 전환 가능. 조항별 `data-i18n` 태깅 + 법률 톤 번역, `(기재 예정)` 등 괄호 placeholder는 실제 값 대신 "(to be announced)"로 동일하게 유지. 헤드리스 크롬 CDP로 전체 흐름(초기 한국어 → 토글 → 새로고침 유지 → 페이지 간 자동 적용 → 재토글) 검증 완료, 배포 사이트에서도 반영 확인.
- **커뮤니티 섹션 신설** (CLAUDE.md 로드맵 항목) — "함께 만들어요" 섹션에 4번째 카드 "커뮤니티에 놀러오세요" 추가, 클릭 시 모달에서 실시간 소통은 외부 SNS 그룹(카카오톡/인스타그램 등)에서 진행된다는 안내 + 참여 버튼 + QR 자리 표시. 참여 링크는 `script.js`의 `COMMUNITY_LINK` 상수 한 곳에만 있어서, 실제 그룹이 만들어지면 그 한 줄만 채우면 됨(지금은 빈 값 → 버튼 클릭 시 "준비중" 토스트). 처음부터 `data-i18n`으로 한/영 이중언어 지원.
- **중국어 번역 완료 (전체 사이트)** — `i18n` 구조를 `currentLang` 기반 범용 사전 조회로 일반화(`t()`/`applyStaticTranslations()`가 더 이상 'en'에 하드코딩되지 않음), `i18n.zh` 사전을 신설해 처음엔 핵심 경로(헤더·히어로·문제·로드맵·지도·맛집 카드/필터/정렬·상세 모달·구글 리뷰·실시간 검색)만 넣었다가, 같은 세션에서 이어서 나머지 전체(리뷰/공유/함께하기/이메일신청/푸터/접근성 + 설문/게임/로그인/마이페이지/리뷰작성/소개/FAQ/문의/식권)까지 확장해 영어와 완전히 동등한 커버리지 확보. 레스토랑 12곳에 `nameZh`/`descZh`, 식권 3곳에 `benefitZh` 추가. 설문 문항(`surveyQuestions`)에도 `titleZh`/`subZh`/`optionsZh` 추가. 손주 식권 흐름 전용 `wonSuffix()`/`passUnit()` 헬퍼를 새로 만들어 통화·수량 단위(원/₩/韩元, 장/张/무단위)의 언어별 어순 차이를 한 곳에서 관리하도록 정리. `currentLang==='en'`에만 하드코딩돼 있던 분기(FAQ, 문의 폼 등)는 `currentLang!=='ko'`로 일반화해 중국어도 자동으로 타도록 수정. 약관/개인정보처리방침 페이지의 언어 토글도 한/영 2단에서 한국어→English→中文 3단 순환으로 확장. 언어 선택 모달에는 원래부터 中文 버튼 UI가 있었지만 `SUPPORTED_LANGS`에 없어 "준비중"으로만 떴었는데, 이번에 `zh` 추가해서 실제로 동작하게 연결.

## 2026-08-24 세션에서 한 것

- **Supabase MCP OAuth 인증 완료** — `claude mcp list`에서 `✔ Connected`. 처음에 authorize URL이 터미널 줄바꿈으로 잘려 열려서 `redirect_uri: Invalid input: expected string, received undefined`가 났었다. **긴 OAuth URL은 채팅에 출력해서 사람이 클릭하게 하지 말고 `Start-Process '<url>'`로 브라우저에 직접 넘길 것**(PowerShell에서는 `&`가 연산자라 반드시 작은따옴표로 감싼다).
- **`public.memos` 테이블 생성** (MCP 마이그레이션 `create_memos_table`) — `id/content/created_at/updated_at`, RLS 활성, 정책 4개(select·insert·update·delete 전부 `true` = 누구나 읽고 쓰기), `created_at desc` 인덱스.
- **`supabase-demo.html`** — Supabase 연동 연습용 메모장 단일 파일. supabase-js CDN 없이 순수 `fetch`로 PostgREST 직접 호출(`/rest/v1/memos`). 추가/최신순 조회/인라인 수정/삭제. 노션 스타일, 한국어 UI. 디자인 규칙은 `디자인.md`.
  - 헤드리스 크롬 CDP로 실제 UI를 조작해 검증 완료: 메모 3개 추가 → 새로고침 후 최신순 유지 → 수정 → 삭제까지 전부 정상, 콘솔 에러 0. MCP `execute_sql`로 DB 실제 행과 화면 내용이 일치하는 것까지 대조함. `file://`에서도 Supabase CORS는 문제없었다.
  - **`.gitignore`에 `supabase-demo.html`과 `디자인.md`를 넣었다.** 이 저장소가 GitHub public인데 파일 안에 publishable 키가 박혀 있고 RLS가 "누구나 읽고 쓰기"로 열려 있어서, 그 조합을 공개하지 않기 위한 조치. RLS를 읽기 전용으로 좁히는 선택지도 있었지만 그러면 CRUD 연습이라는 파일의 목적 자체가 사라져서 택하지 않았다. 실제 백엔드로 갈 때 Auth + `user_id`로 정책을 제대로 세우면 된다.
- **카카오/구글 "연동 안 됨" 해결 — 키 문제가 아니었다.** `.env.local`의 키로 직접 호출해보니 둘 다 HTTP 200에 실제 데이터가 왔다(카카오 실제 가게 목록, 구글 평점·리뷰). 진짜 원인은 **로컬에 `/api/*`를 서빙할 주체가 없던 것**: `script.js`는 `/api/kakao-search`·`/api/google-reviews`를 절대경로로 부르는데 이건 Vercel 서버리스 함수라, `index.html`을 직접 열면(`file://`) 실행될 수가 없다. CLAUDE.md가 로컬 실행법을 "index.html 직접 열기"로 안내하고 있던 게 혼란의 직접 원인이라 그 항목을 고쳤다.
  - **`dev-server.js` 추가** — Node 내장 모듈만으로 정적 파일 + `api/*.js`를 함께 서빙(Vercel 핸들러 shim, `.env.local` 자동 로드, 요청마다 require 캐시 비움). `node dev-server.js` → `http://localhost:3000`. 기존 코드는 한 줄도 안 바꿨고 배포 동작에도 영향 없다.
  - 브라우저 검증: 카카오 실시간 검색 5건 렌더, 구글 리뷰 실제 평점·리뷰 5개 렌더, 콘솔 에러 0.
  - **디버깅 교훈**: Git Bash에서 `curl`에 한글을 인자로 넘기면 인코딩이 깨져(`����`) 빈 결과가 온다. 이것 때문에 처음에 API가 죽은 것처럼 보였다. **한글이 들어가는 API 테스트는 `node -e`로 `fetch`를 쓸 것.**

## 손주 로그인 Supabase 연동 (2026-08-24, 1단계 완료 · 검증 완료)

- 가짜 인증(`store.accounts`에 **평문 비밀번호** 저장 후 문자열 비교)을 **Supabase Auth 이메일 로그인으로 교체**했다. 비밀번호는 이제 코드 어디에도 남지 않는다.
- 요구사항 대부분은 **이미 구현돼 있었다** — 헤더 버튼, 로그인/가입 탭 폼, 한국어 오류 문구, 새로고침 유지, 그리고 "누가 로그인했는지 다른 기능이 쓰기 좋게"에 해당하는 `requireLogin(intent)`까지. 실제로 바꾼 건 **인증의 공급원 하나**였고 저장·리뷰·마이페이지·식권은 손대지 않아도 그대로 따라왔다.
- `syncAuthFromSession()`을 만들어 `isLoggedIn`/`currentUserName`/`currentUserId`를 쓰는 곳을 **한 군데로 통일**했다. `getSession()`(최초) + `onAuthStateChange()`(이후)가 이 함수를 부른다. 로그인/가입/로그아웃 핸들러는 상태를 직접 건드리지 않는다.
- **`store.marks`를 사용자 id로 감쌌다** (`{userId: {가게이름: {...}}}`). 전역으로 두면 한 브라우저에서 A가 로그아웃하고 B가 로그인했을 때 B가 A의 저장목록을 본다 — 인증이 진짜가 된 순간 생기는 버그라 지금 같이 처리했다. 이 모양이 곧 2단계 테이블 모양이다.
- 헤더: 로그인 시 `"○○ 손주님"`(누르면 마이페이지) + 로그아웃 버튼(`#authLogoutBtn`). 요구사항의 "이름님 로그아웃"만 쓰면 이미 만들어둔 마이페이지 진입구가 사라져서 절충했다.
- 전화번호 로그인은 뺐다(유료 SMS 연동 필요). 입력칸을 이메일 전용으로 바꾸고 한·영·중 문구를 모두 수정. `isEmailOrPhone()`은 **문의 폼 전용으로 남겨뒀다** — 지우면 문의 폼이 깨진다.
- 폼에 `novalidate`를 넣었다. 브라우저 기본 검증 문구는 사이트 언어가 아니라 브라우저 언어를 따르기 때문에, 3개 국어를 직접 관리하는 이 사이트에서는 검증도 우리가 해야 한다.
- supabase-js는 **버전 고정 + SRI**로 CDN 로드(`@2.112.3`). `@2` 같은 범위 지정을 쓰면 새 배포 때 해시가 어긋나 스크립트가 통째로 차단된다. CDN이 막히면 `sb`가 null이 되고, 사이트의 나머지 기능은 그대로 동작한다.
- **로그인 시 저장목록이 지워지던 버그를 잡아서 고쳤다** (`f0da6ef`). 사용자별 마크 분리를 검증하는 테스트를 붙이다가 발견했다. `currentMarks()`는 `store.auth.userId`를 읽는데(초기 `applyState()`가 `currentUserId` 선언보다 먼저 실행돼 TDZ를 피하려고 그렇게 돼 있다), `syncAuthFromSession()`이 `currentUserId`만 갱신하고 `store.auth`는 그대로 둔 채 `applyState()`를 불렀다. 그래서 **사용자가 바뀔 때마다**(= 로그인할 때마다) 이전 사용자 기준으로 조회 → 빈 결과 → 마크 전체 해제 → 뒤이은 `saveState()`가 그 빈 상태를 덮어써 저장목록이 사라졌다. 새로고침 경로에서는 `wasUserId === currentUserId`라 `applyState()`가 호출되지 않아 드러나지 않는다. 수정: `currentUserId`를 정한 직후 `store.auth`를 먼저 맞춘다.
  - 마크 분리 검증 **16/16 통과** — 옛/새 형식 판별, A 저장 → B 전환 시 미유출, B 저장 시 A 보존, A 복귀 시 복원, 로그아웃 시 전체 해제, 옛 전역 marks 1회 승계, 헤더 이름 표시.
- 검증: 헤드리스 크롬으로 **12/12 통과** — 로그인 게이트(담기 → 로그인 안내), 비로그인 상태의 기존 기능, 이메일 전용 입력, 형식 오류 한국어 안내, 한/영/중 문구, 콘솔 에러 0. 틀린 비밀번호 경로에서 실제 Supabase 응답이 `"이메일 또는 비밀번호가 올바르지 않아요."`로 번역돼 나오는 것까지 확인했다.

### ✅ 가입 경로 검증 완료 (2026-08-24)

대시보드에서 **Authentication → Providers → Email → Confirm email**을 끄고 Save한 뒤
(`mailer_autoconfirm: true` 확인) 전 경로를 검증했다.

- **가입 14/14 통과** — 가입 즉시 로그인(확인 메일 대기 없음), 헤더에 `"○○ 손주님"` + 로그아웃 버튼,
  새로고침 후 유지, 중복 가입 시 `"이미 가입된 이메일이에요…"` 한국어 안내,
  틀린 비밀번호 시 `"이메일 또는 비밀번호가 올바르지 않아요."`, 로그아웃 후 헤더 복귀, 콘솔 에러 0.
- **저장목록 보존 8/8 통과** — `f0da6ef`로 고친 버그의 진짜 회귀 테스트다.
  실제 계정으로 맛집 2곳 담기 → 새로고침 유지 → **로그아웃 → 재로그인** 후에도
  같은 2곳이 그대로 복원됨(버그가 터지던 바로 그 경로). 로그아웃 상태에서는 마크가 숨겨진다.
- **서버 대조** — `auth.users`에 계정이 실제로 생성되고 `raw_user_meta_data.name`이
  화면 표시 이름과 일치하는 것까지 확인. 검증용 계정(@mailinator.com)은 삭제했다.

**설정 확인은 추측하지 말 것.** 가입 API를 찔러 429/200으로 판정하려다 실패했다
(무료 플랜 메일 한도만 소진되고, 유효하지 않은 도메인은 400이 섞여 나온다 —
`bmw-qa.io`·`example.com`은 Supabase가 invalid로 거부한다). 아래 한 줄이면 즉시 확정된다:

```bash
curl -s -H "apikey: <publishable키>" https://oqsydupzmgfgrkuibbqm.supabase.co/auth/v1/settings
```
`mailer_autoconfirm: true` = Confirm email 꺼짐(가입 즉시 로그인 가능), `false` = 켜짐.

**Confirm email을 끈 상태의 의미**: 누구나 아무 이메일로 즉시 계정을 만들 수 있다.
지금 단계(랜딩페이지, 저장목록만 개인화)에서는 감수할 만하지만, 실제 운영으로 갈 때는
커스텀 SMTP(Resend/SendGrid 등)를 붙이고 메일 인증을 되살리는 것을 검토한다.
무료 플랜 내장 메일은 시간당 몇 통이 한계라 인증을 켜둔 채로는 실사용이 어렵다.

### 2단계 (다음 세션): 저장목록 서버 이전

```sql
create table public.saved_restaurants (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_name text not null,
  saved boolean not null default false,
  visited boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, restaurant_name)
);
alter table public.saved_restaurants enable row level security;
create policy "own rows" on public.saved_restaurants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

`loadState()`/`saveState()`/`applyState()`의 marks 부분만 서버 읽기·쓰기로 교체하고, localStorage는 오프라인 캐시로 남긴다. 첫 로그인 때 로컬 marks를 1회 업로드. 리뷰·식권은 그 다음 순서.

**주의**: `applyState()`가 이제 마크가 없으면 `saved/visited`를 `false`로 되돌린다. 그래서 더미 데이터에 박혀 있던 `saved:true`/`visited:true` 시드는 로그인해도 더 이상 보이지 않는다 — 진짜 계정마다 빈 상태로 시작하는 게 맞는 동작이라 의도한 변경이다.

## 미해결/참고 사항
- **지도**: Places API 키로는 구글 Maps JS/Static API가 둘 다 "API not activated" — Cloud Console에서 별도 활성화 없이는 코드로 우회 불가(확인 완료). 지금은 OpenStreetMap(Leaflet) 실제 지도로 대체, 잘 작동하지만 한국어 라벨이 다소 부자연스러움. 구글 지도로 바꾸려면 Cloud Console에서 "Maps JavaScript API" 활성화 필요. 그 다음 과제는 건물별 위경도 데이터 수집(코드 작업 아님) — 지금 Naver/Kakao 지도는 캠퍼스 건물들이 전부 같은 도로명 주소로 잡혀서 건물 단위 길찾기가 안 됨.
- **커뮤니티**: `COMMUNITY_LINK`가 아직 빈 값 — 실제 SNS 그룹(카카오톡 오픈채팅/인스타그램 등)이 만들어지면 `script.js` 상단 근처의 이 상수만 채우면 카드/모달/QR 안내 문구가 자동으로 "준비중"에서 "참여하기"로 전환됨. QR 이미지 자체는 아직 생성 안 함(링크 없이 만드는 건 의미 없는 이미지라 의도적으로 보류) — 링크 확정 후 QR 생성 필요.
- 영어 버전은 이제 사이트 전체(메인 페이지 전 모달 + 약관/개인정보처리방침 페이지)에서 완료. 남은 미번역 영역은 사용자가 직접 쓴 리뷰 본문(의도적으로 원문 유지)뿐.
- **중국어도 이제 영어와 동일하게 사이트 전체(메인 페이지 전 모달 + 약관/개인정보처리방침 페이지)에서 지원됨** — 처음엔 1구간(핵심 경로)만 넣었다가, 같은 세션에서 바로 이어서 2구간(설문/게임/로그인/마이페이지/리뷰작성/소개/FAQ/문의/식권)과 약관 페이지까지 확장 완료. 손주 식권 흐름의 통화·수량 단위(원/₩/韩元, 장/张/무단위)는 `wonSuffix()`/`passUnit()` 공용 헬퍼로 정리해서 언어별 어순 차이를 한 곳에서 관리. 약관 페이지 언어 토글은 한/영 2단에서 한국어→English→中文 3단 순환으로 확장.

## 다음에 진행할 것 (우선순위 미정 — 다음 세션에서 정하기)
1. **AI 리뷰 분석 기능 구체화** — 아직 요구사항 미정
2. ~~**Supabase MCP 연결 → 메모장 연결**~~ — **2026-08-24 완료** (위 세션 기록 참고). 아래는 당시 배경 메모: Supabase 프로젝트는 **이미 생성됨**(프로젝트 URL·publishable 키는 `.env.local`에 보관 — 커밋 안 됨). MCP 서버는 `.mcp.json`에 프로젝트 스코프로 등록해둠(`https://mcp.supabase.com/mcp?project_ref=...`, URL만 들어있고 비밀값 없음 / 인증은 OAuth라 각 PC에서 `/mcp`로 한 번씩 승인 필요). **테이블도 RLS 정책도 아직 없는 빈 프로젝트.** publishable 키의 실제 보안 경계는 키를 숨기는 게 아니라 RLS라서, 키를 클라이언트 코드로 옮기는 건 정책을 세운 뒤에 판단한다 — 이 저장소가 GitHub public이고 빌드 스텝이 없어 `script.js`에서 `process.env`를 못 읽는다는 점이 그 판단의 전제.
3. **로그인 기능 구체화** — 현재 "손주 로그인"은 UI 목업(실제 인증 없음). Supabase auth 연계 가능성 있음, 1·2번과 함께 검토. 참고: 현재 Supabase Auth는 **이메일 방식만 활성화**돼 있고 외부 OAuth(카카오·구글 등)는 전부 꺼져 있음
4. **지도 고도화** — 건물별 위경도 데이터 수집(코드 작업 아님, 답사/수작업 필요) 후 Naver Maps API 키 발급 시 building-level 길찾기로 전환
5. **커뮤니티 SNS 그룹 개설** — 그룹 만들고 `COMMUNITY_LINK` 채우기 + QR코드 생성 (코드 작업 아님)
