# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"밥 먹으러 와" — a consumer-facing landing page for a local-restaurant-discovery service targeting Korea University/Hongik University Sejong campus students, exchange students, staff, and residents near Jochiwon-eup, Sejong. The pitch: surface local restaurants (many run by long-time neighborhood owners) that don't show up well on Naver/Kakao Maps. See `PRD (1).md` for product scope and `design.md` for the visual/design-system spec — read both before making product or design decisions, since most UI choices trace back to explicit rules in those two files (e.g. the 60/30/10 color ratio, font pairing, section order).

## Commands

There is no build tooling, package manager, or test framework in this repo — it's a static site (one main page + two standalone legal pages, plus one CSS and one JS file).

- **Run locally**: `node dev-server.js` → `http://localhost:3000`. Use this, not a plain file open.
  - Opening `index.html` directly (`file://`) or serving it with a plain static server **silently breaks the Kakao search and Google reviews**. `script.js` calls `/api/kakao-search` and `/api/google-reviews` by absolute path (`script.js:1291`, `1367`, `1414`), and those handlers are Vercel serverless functions — under `file://` the path resolves to `file:///api/...`, and under a static server it 404s. Nothing in the UI says "no local API"; the features just come back empty, which reads like a dead/invalid API key. It isn't.
  - `dev-server.js` (Node built-ins only, no install) serves the static files *and* runs `api/*.js` with a thin Vercel-handler shim (`req.query`, chainable `res.status().json()`), reading the keys from `.env.local`. It also clears the require cache per request, so edits to `api/*.js` take effect without a restart.
  - Plain file-open is still fine when you're only touching markup/CSS or JS that doesn't hit `/api`.
- **Syntax-check JS**: `node --check script.js` (and `node --check dev-server.js`)
- **No linter/formatter/test suite is configured.** There's no `npm test` — verification for this project means actually loading the page and exercising it.

### Verifying changes (no test framework exists — use a real browser)

Since there's no test suite, the working pattern for this project is to drive a real headless browser and check both DOM state and console output, rather than trust a static read of the code:

1. Launch headless Chrome with a scratch `--user-data-dir` and `--remote-debugging-port` (don't touch the user's real Chrome profile/processes):
   `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-sandbox --remote-debugging-port=<port> --user-data-dir="<temp dir>" file:///.../index.html`
2. Fetch the page's `webSocketDebuggerUrl` from `http://127.0.0.1:<port>/json`.
3. Drive it via Chrome DevTools Protocol (`Runtime.evaluate`, `Page.captureScreenshot`) — Node 22+ has a built-in global `WebSocket`, no dependencies needed.
4. Collect `Runtime.consoleAPICalled`/`Runtime.exceptionThrown` events to catch runtime errors instead of eyeballing a screenshot.
5. When done, kill only the scratch Chrome instance (match by `--remote-debugging-port` value in the command line via `Get-CimInstance Win32_Process`), not a blanket `taskkill /IM chrome.exe` — that also kills the user's real browser windows.

Gotcha: `Runtime.evaluate` calls in the same execution context share one persistent top-level scope. Redeclaring `const`/`let` with the same name across separate `evaluate()` calls throws (silently, unless you check `result.exceptionDetails`). Use `var` for throwaway variables in injected snippets, or check `exceptionDetails` explicitly.

## Architecture

No framework, no build step:

- `index.html` — structure only, static per-section markup plus the templated containers (`#cardGrid`, `#reviewList`, modal bodies) that JS fills in at runtime.
- `style.css` — all styling, custom-property-based design tokens in `:root` (see Design system below).
- `script.js` — all behavior, plain DOM APIs (`innerHTML` templating + `addEventListener`), no imports/modules.
- `privacy.html` / `terms.html` — the legal notices from `extra.md` §5. They are the only pages besides `index.html`: static content, **no `<script src="script.js">`** (nothing on them needs JS), sharing `style.css` via the `.legal-page` / `.legal-art` classes and repeating the footer's operator-info block by hand. `extra.md` §8 calls for `/privacy` and `/terms` routes; with no server in this repo they're plain sibling files, so link them as `privacy.html`, not `/privacy`.

Fonts are loaded from Google Fonts via a `<link>` in `<head>` (Gaegu, Gowun Dodum, Nanum Gothic). **Do not remove that link or rely on the bare font-family names alone** — without it, `'Gaegu', ... , sans-serif` silently falls back to the OS's generic serif/cursive font (on Korean Windows that's 궁서체/Gungsuh), which looks wrong and was previously an actual bug here.

### Data model (`script.js`)

`restaurants` is a hardcoded array of dummy listings (per PRD: real data comes later from on-site survey work, JSON-fed for now). Each entry has `name/cat/emoji/desc/rating/reviewCount/price/priceValue/saved/visited`. Only **one** entry ("조치원 할매국밥") carries a full `detail` object (address/hours/phone/reservation/capacity/parking/mobilePay/vouchers/menu-with-composition-and-origin) — this is intentional, a single fleshed-out example rather than fake-filling all twelve. `openDetail(idx)` branches on whether `r.detail` exists (`renderFullDetail` vs `renderStubDetail`); when adding real data to more restaurants, that branch is what promotes a listing from stub to full detail automatically.

Four entries also carry an optional `pass` object (`unit`/`bundles`/`benefit`/`validDays`) — the same "only some entries are fleshed out" idea as `detail`. `getPassRestaurants()` (`restaurants.filter(r => r.pass)`) is what the 손주 식권 grid and the search source both read, so adding `pass` to another listing is all it takes to put that shop on sale.

`getFilteredList()` is the single source of truth for what the restaurant grid shows — category, text search, price min/max, and sort all compose there. If you add a new filter/sort axis, it goes in this function, not in `renderCards()`.

### Header search (`searchSources`)

The header search is a grouped universal search, not a restaurant filter. `searchSources` is an array of `{type, items()}`; each item is `{icon, label, sub, keywords, run}` and `run()` only calls existing functions (`openDetail`, `openPass`, `openContact`, `openSurvey`, section scrolls…). **To make something searchable, add a source or an item — don't touch `runSearch`/`searchAll`.** Caps live in `SEARCH_PER_SOURCE` (4) and `SEARCH_MAX` (10).

Keyboard: ↓/↑ walk `searchFlat` and Enter runs the highlighted item. With nothing highlighted (the default after each keystroke), Enter instead falls back to `applyHeaderQuery()`, which pushes the text into `currentQuery`, syncs `cardSearch.value`, re-renders the grid, and scrolls to the list — so the header box still behaves like a restaurant search when you just type and hit Enter. The same fallback is exposed as the clickable hint row at the bottom of the dropdown.

`.nav-search-wrap` is hidden below 860px; mobile gets the `🔍` `.icon-btn-search` which opens `#searchOverlay`. Both inputs feed the same `runSearch()` with different containers — keep them in sync rather than forking the renderer.

### Modal pattern

Every overlay (survey, restaurant detail, mini-game, auth, mypage) reuses the same base CSS (`.survey-overlay` / `.survey-box`) and the same JS shape:
- `openX()` / `closeX()` / `closeXOnOverlay(e)` (the latter closes only when the click target is the backdrop itself, via `event.stopPropagation()` on the inner box).
- Content is rendered by a `renderX()` function that rewrites an empty `<div id="xBody">` via `innerHTML`, then re-binds event listeners on the fresh nodes (there's no diffing — every re-render is a full replace-and-rebind).

State is plain top-level `let` variables in `script.js` (`currentCat`, `currentQuery`, `currentSort`, `isLoggedIn`, `currentUserName`, `rouletteItems`, `surveyAnswers`, etc.) — no store/framework. The subset that survives a reload is mirrored into `store` and written by `saveState()` (see Persistence below). `updateHeaderAuthUI()` is the one place that reconciles header button state with `isLoggedIn`; call it after any auth state change instead of hand-editing header DOM elsewhere.

Login/mypage is UI-only (no backend) and intentionally uses "손주" (grandchild) framing instead of generic "회원" — see the "손주 로그인/가입" comment block in `script.js`. Signing up just flips `isLoggedIn` client-side; there's no credential check of any kind.

### Persistence (`localStorage`, backend swap point)

Auth state, save/visit marks, user-written reviews, and 식권 예약 내역 (`store.passOrders`) persist across reloads via `localStorage` under the key `bmw:v1`. Three functions at the top of `script.js` own this, and **they are the only place that touches storage** — when a real backend (Supabase per `extra.md`) arrives, replace these and nothing else:

- `loadState()` — reads the blob into the top-level `store` object. Wrapped in `try/catch`: if storage is blocked (private mode, some `file://` contexts) the page silently degrades to memory-only instead of throwing.
- `saveState()` — serializes `store` back out; **returns `false` on failure** (e.g. `QuotaExceededError` from an attached review photo) so callers can tell the user their data didn't stick. Call it after any state mutation.
- `applyState()` — projects saved marks onto `restaurants[]`. Must run before the initial `renderCards()`.

`store.marks` is keyed by **restaurant name, not array index**, so reordering or inserting entries in `restaurants` can't attach saved data to the wrong listing.

### Gated actions and the shared confirm modal

Save/visit/review actions go through two helpers rather than mutating state inline (per `extra.md` §1–2):

- `requireLogin(intent)` — returns `true` if logged in; otherwise opens the login-prompt popup and returns `false`. Guard clause at the top of any gated handler — put it *before* any branch on `r.saved`/`r.visited`, since those marks are hidden while logged out.
- Saved/visited marks are per-user, so `renderCards()` masks them with `const saved = isLoggedIn && r.saved` (same for `visited`). Logged out, every card renders identically: empty heart, no "가본 곳" badge, and one uniform "가보고 싶은 곳에 담기" button — even for the seeded dummy entries that carry `saved:true`/`visited:true`. The data itself is untouched; logging in re-reveals it. `isLoggedIn`/`currentUserName` are therefore declared at the top of `script.js` next to the store, not in the auth section — the initial `renderCards()` runs long before that section and would hit a TDZ error.
- `openConfirm({emoji, title, text, okLabel, cancelLabel, onOk})` — one generic two-button modal (`#confirmOverlay`) serving both the login prompt and the "담으시겠습니까?/해제하시겠습니까?" action confirmations. `confirmMark()` wraps it for the save/visit flow. Don't add per-action modals; extend this one.

User-supplied strings (review text, names) are rendered through `escapeHtml()` before hitting `innerHTML`.

### Design system (from `design.md`)

- **Color ratio is a hard rule, not a suggestion**: 60% off-white/base (`--base-bg`), 30% slate blue (`--slate*`), 10% vivid red (`--red*`) reserved for CTAs/logo/emphasis only. Don't introduce new hues (no warm terracotta/mustard tones — explicitly rejected in the design doc).
- **Typography split**: headlines/titles use the handwriting-style font (Gaegu), body text uses the rounded gothic font (Gowun Dodum) — this contrast is the intended "정겨움 without 올드함" effect, don't collapse them to one font.
- Character illustrations (grandma) should stay in one consistent style; when adding an illustrated asset, check `assets/` first — `grandma-hero.png` and `grandma-calm.png` are the current canonical set.

### Image handling gotcha

The Gemini-generated character PNGs in `assets/` have a *baked-in* checkerboard pattern (not real alpha transparency) around a circular sticker. Don't display them as plain `<img>` — the working fix is a wrapper `div` with `aspect-ratio:1/1; border-radius:50%; overflow:hidden` around an `img` with `object-fit:cover` plus a `transform:scale(1.4) translateY(-3%)` to zoom past the checkerboard margin before the circular clip. See `.grandma-photo` / `.survey-photo` in `style.css` for the reference implementation — reuse that pattern rather than re-deriving crop math for new circular character images.

### Known gaps (intentional, per PRD roadmap)

- The map section is a static placeholder (no Naver Maps Client ID configured yet); swap in real Naver Maps API once a key exists. The planned strategy once that key exists is building-level lat/lng navigation, not just embedding a generic map — Naver Maps currently resolves every campus building to the same road address, so per-building coordinates (a data-collection task, not a code change) are the actual differentiator to build toward.
- 커뮤니티(community) is intentionally not an in-site chat/board — real-time discussion is meant to live in an existing external SNS group (WhatsApp/Instagram 등). The site's job is only a join link + QR code once a group exists. Keep that link in one place (a single constant, not scattered inline) since invite links expire or get replaced.
- Login/save/mypage, language switching, and AI review summarization are UI-only stubs — see the PRD's "로드맵으로 분리" section for what's explicitly out of scope for this landing page.
- The 손주 힘 보태기 / 지역 확장 문의 forms (`extra.md` §7) validate input and then show a confirmation screen without sending anything anywhere. `submitContact()` is the single swap point when a real inbox or Supabase table exists.
- The legal pages carry deliberate `(기재 예정)` / `(담당자명 기재)` placeholders for operator and privacy-officer details — `extra.md` §5 requires them to be filled with real values before actual operation, so don't invent names or emails there.
- **손주 식권 takes reservations, not payments — this is a legal constraint, not an unfinished feature.** Selling prepaid meal vouchers for real would make the service a 선불전자지급수단/상품권 issuer under 전자금융거래법, on top of 사업자등록·통신판매업 신고·PG 계약. So `submitPassOrder()` records the order in `store.passOrders` and stops; the section, the modal, and the confirmation copy all say 사전 예약 explicitly, and the 10+1 benefit is framed as the *shop owner's* offer rather than the service's. Don't add a payment step, a fee cut, or "구매 완료" wording without a real business entity behind it.
