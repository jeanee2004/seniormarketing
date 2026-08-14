# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"밥 먹으러 와" — a consumer-facing landing page for a local-restaurant-discovery service targeting Korea University/Hongik University Sejong campus students, exchange students, staff, and residents near Jochiwon-eup, Sejong. The pitch: surface local restaurants (many run by long-time neighborhood owners) that don't show up well on Naver/Kakao Maps. See `PRD (1).md` for product scope and `design.md` for the visual/design-system spec — read both before making product or design decisions, since most UI choices trace back to explicit rules in those two files (e.g. the 60/30/10 color ratio, font pairing, section order).

## Commands

There is no build tooling, package manager, or test framework in this repo — it's a static 3-file site.

- **Run locally**: open `index.html` directly in a browser (e.g. `Start-Process index.html` on Windows), or serve the directory with any static file server.
- **Syntax-check JS**: `node --check script.js`
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

Three files, no framework, no build step:

- `index.html` — structure only, static per-section markup plus the templated containers (`#cardGrid`, `#reviewList`, modal bodies) that JS fills in at runtime.
- `style.css` — all styling, custom-property-based design tokens in `:root` (see Design system below).
- `script.js` — all behavior, plain DOM APIs (`innerHTML` templating + `addEventListener`), no imports/modules.

Fonts are loaded from Google Fonts via a `<link>` in `<head>` (Gaegu, Gowun Dodum, Nanum Gothic). **Do not remove that link or rely on the bare font-family names alone** — without it, `'Gaegu', ... , sans-serif` silently falls back to the OS's generic serif/cursive font (on Korean Windows that's 궁서체/Gungsuh), which looks wrong and was previously an actual bug here.

### Data model (`script.js`)

`restaurants` is a hardcoded array of dummy listings (per PRD: real data comes later from on-site survey work, JSON-fed for now). Each entry has `name/cat/emoji/desc/rating/reviewCount/price/priceValue/saved/visited`. Only **one** entry ("조치원 할매국밥") carries a full `detail` object (address/hours/phone/reservation/capacity/parking/mobilePay/vouchers/menu-with-composition-and-origin) — this is intentional, a single fleshed-out example rather than fake-filling all twelve. `openDetail(idx)` branches on whether `r.detail` exists (`renderFullDetail` vs `renderStubDetail`); when adding real data to more restaurants, that branch is what promotes a listing from stub to full detail automatically.

`getFilteredList()` is the single source of truth for what the restaurant grid shows — category, text search, price min/max, and sort all compose there. If you add a new filter/sort axis, it goes in this function, not in `renderCards()`.

### Modal pattern

Every overlay (survey, restaurant detail, mini-game, auth, mypage) reuses the same base CSS (`.survey-overlay` / `.survey-box`) and the same JS shape:
- `openX()` / `closeX()` / `closeXOnOverlay(e)` (the latter closes only when the click target is the backdrop itself, via `event.stopPropagation()` on the inner box).
- Content is rendered by a `renderX()` function that rewrites an empty `<div id="xBody">` via `innerHTML`, then re-binds event listeners on the fresh nodes (there's no diffing — every re-render is a full replace-and-rebind).

State is plain top-level `let` variables in `script.js` (`currentCat`, `currentQuery`, `currentSort`, `isLoggedIn`, `currentUserName`, `rouletteItems`, `surveyAnswers`, etc.) — no store/framework. `updateHeaderAuthUI()` is the one place that reconciles header button state with `isLoggedIn`; call it after any auth state change instead of hand-editing header DOM elsewhere.

Login/mypage is UI-only (no backend) and intentionally uses "손주" (grandchild) framing instead of generic "회원" — see the "손주 로그인/가입" comment block in `script.js`. Signing up just flips `isLoggedIn` client-side; there's no persistence across reloads.

### Design system (from `design.md`)

- **Color ratio is a hard rule, not a suggestion**: 60% off-white/base (`--base-bg`), 30% slate blue (`--slate*`), 10% vivid red (`--red*`) reserved for CTAs/logo/emphasis only. Don't introduce new hues (no warm terracotta/mustard tones — explicitly rejected in the design doc).
- **Typography split**: headlines/titles use the handwriting-style font (Gaegu), body text uses the rounded gothic font (Gowun Dodum) — this contrast is the intended "정겨움 without 올드함" effect, don't collapse them to one font.
- Character illustrations (grandma) should stay in one consistent style; when adding an illustrated asset, check `assets/` first — `grandma-hero.png` and `grandma-calm.png` are the current canonical set.

### Image handling gotcha

The Gemini-generated character PNGs in `assets/` have a *baked-in* checkerboard pattern (not real alpha transparency) around a circular sticker. Don't display them as plain `<img>` — the working fix is a wrapper `div` with `aspect-ratio:1/1; border-radius:50%; overflow:hidden` around an `img` with `object-fit:cover` plus a `transform:scale(1.4) translateY(-3%)` to zoom past the checkerboard margin before the circular clip. See `.grandma-photo` / `.survey-photo` in `style.css` for the reference implementation — reuse that pattern rather than re-deriving crop math for new circular character images.

### Known gaps (intentional, per PRD roadmap)

- The map section is a static placeholder (no Naver Maps Client ID configured yet); swap in real Naver Maps API once a key exists.
- Login/save/mypage, language switching, and AI review summarization are UI-only stubs — see the PRD's "로드맵으로 분리" section for what's explicitly out of scope for this landing page.
