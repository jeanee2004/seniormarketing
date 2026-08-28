# 사장님용 페이지 디자인 원본 (Stitch 목업, 참고용)

이 파일은 사용자가 2026-08-28 대화에서 붙여넣은 사장님(owner)용 페이지 목업 6개의 **원본 그대로**
보존한 참고 자료다. `owner.html` 구현 시 이 구조(사이드바/탑바/벤토 그리드/카드)와 카피를 최대한
그대로 가져오되, Tailwind CDN·Material Symbols·Be Vietnam Pro/Hanken Grotesk 폰트·아래 컬러
팔레트는 실제 사이트의 `style.css` 디자인 토큰(Gaegu/Gowun Dodum, `--slate`/`--red`/`--base-bg`
등)으로 치환해서 옮긴다. 실제 매장 데이터가 아닌 곳은 "예시 화면 · 목업 데이터"로 표시한다.

---

## 1. 사장님 시작하기 (인트로 / 로그인 진입)

```html
<!-- Design System -->
<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>시니어 마케팅 - 사장님 시작하기</title>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#ffffff",
                        "surface-container-highest": "#e9e1dc",
                        "on-background": "#1e1b18",
                        "inverse-surface": "#34302c",
                        "surface-container": "#f5ece7",
                        "primary-container": "#c84b31",
                        "surface-variant": "#e9e1dc",
                        "on-surface-variant": "#58413c",
                        "on-primary": "#ffffff",
                        "secondary-fixed-dim": "#b6c9d5",
                        "on-error": "#ffffff",
                        "error": "#ba1a1a",
                        "on-error-container": "#93000a",
                        "surface": "#fff8f5",
                        "secondary-fixed": "#d2e5f1",
                        "chart-warm": "#E07A5F",
                        "on-secondary-container": "#53656f",
                        "outline-variant": "#e0bfb9",
                        "primary-fixed-dim": "#ffb4a4",
                        "surface-tint": "#aa361e",
                        "on-secondary-fixed-variant": "#374953",
                        "surface-bright": "#fff8f5",
                        "on-primary-fixed": "#3e0500",
                        "background": "#fff8f5",
                        "surface-container-low": "#fbf2ed",
                        "error-container": "#ffdad6",
                        "outline": "#8c716b",
                        "inverse-on-surface": "#f8efea",
                        "on-tertiary": "#ffffff",
                        "on-tertiary-container": "#fefbf5",
                        "on-secondary-fixed": "#0b1e26",
                        "on-tertiary-fixed-variant": "#474743",
                        "tertiary-fixed-dim": "#c9c6c1",
                        "on-primary-fixed-variant": "#891e07",
                        "tertiary-container": "#75746f",
                        "inverse-primary": "#ffb4a4",
                        "surface-container-high": "#efe6e2",
                        "on-surface": "#1e1b18",
                        "chart-cool": "#3D405B",
                        "on-tertiary-fixed": "#1c1c18",
                        "primary-fixed": "#ffdad3",
                        "secondary": "#4f616b",
                        "tertiary-fixed": "#e5e2dc",
                        "status-success": "#2E7D32",
                        "surface-dim": "#e1d8d4",
                        "surface-muted": "#F2F0EA",
                        "status-info": "#0288D1",
                        "on-secondary": "#ffffff",
                        "tertiary": "#5c5c57",
                        "on-primary-container": "#fffbff",
                        "primary": "#a6331b",
                        "secondary-container": "#cfe3ee"
                    },
                    "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
                    "spacing": {
                        "base": "8px", "container-margin-desktop": "32px", "stack-sm": "8px",
                        "container-margin-mobile": "16px", "stack-md": "16px", "stack-lg": "24px", "gutter": "16px"
                    },
                    "fontFamily": {
                        "headline-lg": ["Be Vietnam Pro", "sans-serif"], "label-md": ["Hanken Grotesk", "sans-serif"],
                        "body-md": ["Hanken Grotesk", "sans-serif"], "body-lg": ["Hanken Grotesk", "sans-serif"],
                        "display-lg": ["Be Vietnam Pro", "sans-serif"], "headline-lg-mobile": ["Be Vietnam Pro", "sans-serif"],
                        "headline-md": ["Be Vietnam Pro", "sans-serif"], "label-sm": ["Hanken Grotesk", "sans-serif"]
                    },
                    "fontSize": {
                        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "700" }],
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "display-lg": ["40px", { "lineHeight": "52px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "headline-lg-mobile": ["26px", { "lineHeight": "34px", "fontWeight": "700" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }]
                    }
                }
            }
        }
    </script>
<style>
        body { font-family: 'Hanken Grotesk', sans-serif; }
        .hero-pattern {
            background-color: #fff8f5;
            background-image: radial-gradient(#e0bfb9 1px, transparent 1px);
            background-size: 24px 24px;
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col justify-center items-center hero-pattern px-container-margin-mobile md:px-container-margin-desktop relative overflow-hidden">
<div class="absolute top-0 left-0 w-64 h-64 bg-primary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
<div class="absolute bottom-0 right-0 w-80 h-80 bg-secondary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/3 translate-y-1/3"></div>
<main class="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-lg p-8 md:p-12 text-center z-10 border border-outline-variant/30 flex flex-col items-center">
<div class="w-48 h-48 md:w-56 md:h-56 mb-8 relative">
<div class="absolute inset-0 bg-surface-container-high rounded-full shadow-inner"></div>
<img alt="시니어 마케팅 할머니 캐릭터" class="w-full h-full object-contain relative z-10 drop-shadow-md" src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg"/>
</div>
<h1 class="font-display-lg text-display-lg text-primary mb-stack-sm tracking-tight">시니어 마케팅</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg leading-relaxed">데이터로 쉽고 똑똑하게,<br/>우리 매장의 성장을 시작해보세요.</p>
<button class="w-full bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md py-4 px-6 rounded-xl shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 group">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">storefront</span>
            사장님으로 시작하기
            <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
<div class="mt-stack-md">
<a class="font-body-md text-body-md text-secondary hover:text-primary transition-colors underline decoration-secondary/30 underline-offset-4" href="#">이미 계정이 있으신가요? 로그인</a>
</div>
</main>
</body></html>
```

## 2. 매장 등록 및 브랜딩 (PWA 커버)

```html
<!-- 사장님 전용 앱 커버 (PWA) -->
<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<title>매장 등록 및 브랜딩 | 시니어 마케팅</title>
<!-- (Tailwind config 동일 팔레트 — 위 1번 참고) -->
</head>
<body class="bg-surface text-on-surface min-h-screen flex flex-col md:flex-row">
<!-- SideNavBar: 대시보드 / 매장 관리(active) / SNS 연동 / 방문자 분석 / 설정, 하단 "광고 게시하기" 버튼, 도움말/로그아웃 -->
<!-- TopAppBar: 매장 현황 / 리포트 / 알림 탭 + 검색/알림/도움말 아이콘 + 프로필 -->
<main>
  <h2>매장 등록 및 브랜딩</h2>
  <p>사장님의 소중한 가게 정보를 입력하고, AI가 만들어주는 특별한 슬로건을 만나보세요.</p>
  <!-- 왼쪽: 기본 정보 입력 폼 (매장 이름*, 카테고리, 연락처, 매장 소개) -->
  <!-- 인스타그램 연동 (선택) 카드 -->
  <!-- 오른쪽: AI 브랜딩 도우미 카드 — "손님을 끌어당기는 한 줄 슬로건 만들기", 결과 placeholder, "AI 슬로건 생성하기" 버튼 -->
  <!-- 하단: 임시저장 / 매장 등록 완료 -->
</main>
<!-- BottomNavBar(모바일): 홈 / 분석 / SNS / 내 매장(active) -->
</body></html>
```

*(전체 마크업은 3번 항목과 거의 동일한 SideNavBar/TopAppBar 셸 + 2단 폼/카드 레이아웃이라, 구조
반복을 피하기 위해 여기서는 핵심 카피와 필드만 요약했다. 원본 전체 HTML은 이 대화의 사용자 메시지
히스토리에 그대로 남아있다.)*

## 3. 방문자 분석 대시보드

```html
<!-- 가게 등록 및 브랜딩 설정 -->
<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<title>시니어 마케팅 - 방문자 분석</title>
<!-- (동일 팔레트) -->
</head>
<body class="bg-background text-on-background font-body-md min-h-screen flex flex-col md:flex-row">
<!-- SideNavBar: 대시보드 / 매장 관리 / SNS 연동 / 방문자 분석(active) / 설정 -->
<!-- TopAppBar: 매장 현황 / 리포트(active) / 알림 -->
<main>
  <h2>방문자 분석</h2>
  <p>사장님 매장의 이번 주 데이터를 확인해보세요.</p>
  <!-- 요약 카드 4개: 오늘 방문자 142명(+12%) / 예상 매출액 1.2백만원(목표 85%) / SNS 반응 85건 / 인기 메뉴 "할머니 된장찌개"(34%) -->
  <!-- 메인: 시간대별 방문자 흐름 버블차트(점심 직장인 / 저녁 가족 / 오후) -->
  <!-- 사이드: 주간 식권 판매 추이 바 차트(월~금) -->
  <!-- AI 인사이트 카드: "사장님, 수요일 저녁 방문자가 급증하고 있어요. 목요일 점심에 '된장찌개 할인 이벤트'를 진행해 보는 건 어떨까요?" + "이벤트 바로 만들기" 버튼 -->
</main>
<!-- BottomNavBar(모바일): 홈 / 분석(active) / SNS / 내 매장 -->
</body></html>
```

## 4. SNS 연동 및 식권 관리

```html
<!-- 사장님 방문자 분석 대시보드 -->
<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<title>시니어 마케팅 - SNS 연동 및 식권 관리</title>
<!-- (동일 팔레트) -->
</head>
<body class="flex flex-col md:flex-row min-h-screen">
<!-- SideNavBar: 대시보드 / 매장 관리 / SNS 연동(active) / 방문자 분석 / 설정 -->
<main>
  <h2>SNS &amp; 식권 관리</h2>
  <p>인스타그램 게시물과 디지털 식권을 한 곳에서 관리하세요.</p>
  <!-- 인스타그램 피드 위젯: @grandmas_kitchen, 연동됨 배지, 게시물 썸네일 5~6개(좋아요/댓글 수), "새 게시물 작성" -->
  <!-- 디지털 식권 발급 현황: 이번 달 사용된 식권 342장(+12%), 대학생 할인권(잔여 150장), 단골 쿠폰(10+1, 발급 대기중 토글), "새 식권 만들기" -->
  <!-- 최근 고객 반응 리스트: 좋아요/식권 사용/댓글 알림 3건 -->
</main>
<!-- BottomNavBar(모바일): 홈 / 분석 / SNS(active) / 내 매장 -->
</body></html>
```

## 5. 매장 정보 관리 (SNS 및 식권 관리 센터)

```html
<!-- SNS 및 식권 관리 센터 -->
<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<title>매장 관리 - 시니어 마케팅</title>
<!-- (동일 팔레트) -->
</head>
<body class="bg-background text-on-background min-h-screen flex">
<!-- SideNavBar: 대시보드 / 매장 관리(active) / SNS 연동 / 방문자 분석 / 설정 -->
<main>
  <h2>매장 정보 관리</h2>
  <p>고객에게 보여질 매장의 기본 정보와 메뉴를 설정합니다.</p>
  <!-- 기본 정보 카드: 카테고리, 매장명("할매순대국 세종점"), 전화번호, 주소+주소검색, 영업시간, 휴무일 -->
  <!-- 시설 및 서비스 카드: 수용 인원(테이블/좌석 수), 주차 정보(무료/유료/불가 + 상세), 결제·제휴 수단(모바일페이/상품권·식권/예약가능 체크) -->
  <!-- 메뉴 관리 카드: 할매국밥 9,000원 / 순대국밥 9,000원 / 수육(소) 18,000원 — 각 메뉴 설명 + 원산지 표기, "새 메뉴 추가"/수정/삭제 -->
  <!-- 상단 취소/저장하기 버튼 -->
</main>
<!-- BottomNavBar(모바일): 홈 / 분석 / SNS / 내 매장(active) -->
</body></html>
```

## 6. SNS 프로모션 관리 (English UI 버전)

```html
<!-- 이미지 2026. 8. 28. 오후 5.55 (1).jpeg -->
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>SNS Promotion &amp; Marketing - Senior Marketing</title>
<!-- (동일 팔레트, 배경 #F7F4EE) -->
</head>
<body class="text-on-surface font-body-md min-h-screen flex antialiased">
<!-- SideNavBar: 대시보드 / 매장 관리 / SNS 연동(active) / 방문자 분석 / 설정 -->
<main>
  <h2>SNS Promotion Management</h2>
  <p>Manage your connected accounts and paid promotional campaigns.</p>
  <!-- Instagram Connection Status: @grandma_kitchen_seoul, Connected 배지, 2.4k Followers·156 Posts, Manage 버튼 -->
  <!-- Professional Services 카드 2개: Instagram Promotion Request(Paid, ₩50,000~, Get Quote) / Influencer Matching(Browse Influencers) -->
  <!-- Recent Performance: "No Active Campaigns" 플레이스홀더 -->
  <!-- Primary CTA: "Boost Your Reach" — "Request New Promotion" 버튼(다이아몬드 아이콘) -->
</main>
<!-- BottomNavBar(모바일): 홈 / 분석 / SNS(active) / 내 매장 -->
</body></html>
```
