# PRD: PWA 앱 설치 지원 (밥 먹으러 와)

**작성일**: 2026-08-27
**작성자**: 이윤진
**상태**: 초안 (v0.1)

---

## 1. 한 줄 정의
기존 정적 사이트(`index.html`)에 매니페스트·서비스 워커를 추가해, 스마트폰 홈 화면에 앱처럼 설치할 수 있게 한다.

## 2. 목표
- 안드로이드(크롬)에서 자동 설치 배너 노출
- iOS(사파리)에서 "홈 화면에 추가"로 설치 가능
- 설치 후 주소창 없는 standalone 화면으로 실행

## 3. 범위
**포함**: manifest.json, 최소 서비스 워커(정적 자산 캐싱), 아이콘 2종(192/512), 관련 페이지에 링크 태그 추가
**제외**: 푸시 알림, 오프라인 전체 기능, 백그라운드 동기화 — 전부 로드맵으로 이연

## 4. 구현 항목

### 4.1 manifest.json (신규 파일, 루트)
```json
{
  "name": "밥 먹으러 와",
  "short_name": "밥먹으러와",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F7F4EE",
  "theme_color": "#F7F4EE",
  "icons": [
    { "src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 4.2 sw.js (신규 파일, 루트) — 정적 자산만 최소 캐싱
```javascript
const CACHE = "bab-v1";
const ASSETS = ["/", "/style.css", "/script.js", "/assets/grandma-hero-square.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return; // 카카오·구글 리뷰 API는 캐싱 제외
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
```

### 4.3 index.html / privacy.html / terms.html / owner.html — `<head>`에 추가
```html
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/assets/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
```

### 4.4 script.js — 서비스 워커 등록 (파일 하단에 추가)
```javascript
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
```

## 5. 아이콘
기존 `grandma-hero-square.png`를 192×192 / 512×512(마스커블)로 리사이즈해 `/assets/icon-192.png`, `/assets/icon-512.png`로 저장.

## 6. 작업 규모
반나절(4~6시간). 매니페스트 20분 · 아이콘 리사이즈 30분~1시간 · 서비스 워커 1~2시간 · head 태그 삽입 20분 · iOS 메타 태그 15분 · 실기기·Lighthouse 검증 1~2시간.

## 7. 완료 기준
- [ ] Lighthouse PWA 체크 통과
- [ ] 안드로이드 크롬에서 설치 배너 노출 확인
- [ ] iOS 사파리에서 "홈 화면에 추가" 후 standalone 실행 확인
- [ ] `/api/` 요청이 캐싱되지 않고 항상 최신 데이터로 응답하는지 확인

## 8. 제약 및 오픈 이슈
- iOS는 설치 배너 자동 노출이 없어 별도 안내 UI가 필요(로드맵)
- `HeroPage.mp4`는 용량이 커 캐싱 대상에서 제외
- 서비스 워커는 루트 경로에 있어야 전체 사이트 범위를 캐싱 가능
