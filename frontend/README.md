# 공매이지 (GongMaeEasy) 프론트엔드

대한민국 공공데이터 포털 및 한국자산관리공사(KAMCO) **차세대 온비드 OpenAPI** 기반의 실시간 공매 정보 탐색 모바일 웹 하이브리드 애플리케이션입니다.  
화면 기획 및 디자인 시스템은 **Google Stitch (Google Labs AI UI/UX Tool)**를 바탕으로 설계되었으며, **React 19 + TypeScript + Vite + Tailwind CSS v4**로 구축되었습니다.

---

## 1. 프로젝트 디렉터리 구조 (Directory Tree)

기능(Feature/도메인) 기반으로 책임이 명확히 분리된 클린 아키텍처 구조입니다.

```text
frontend/
├── public/                         # 정적 에셋 (파비콘, 아이콘)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                     # 번들링용 정적 이미지 및 리소스
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/                 # 공통 컴포넌트
│   │   ├── layout/                 # 앱 레이아웃 관련 컴포넌트
│   │   │   ├── AppHeader.tsx       # 상단 글로벌 헤더 (브랜드 로고, 검색, 알림 벨)
│   │   │   └── AppBottomNav.tsx    # 모바일 하단 탭바 (홈, 목록, 관심, 마이페이지)
│   │   └── common/                 # 공통 재사용 컴포넌트
│   │       └── AuctionCard.tsx     # 물건 카드 컴포넌트 (D-Day 배지, 감정가/최저가 등)
│   │
│   ├── pages/                      # 기능(도메인)별 화면 컴포넌트
│   │   ├── home/                   # [홈 / 탐색 도메인]
│   │   │   └── HomeScreen.tsx      # 메인 대시보드 (지역 칩, 8대 카테고리, D-1 특가, 반값 물건)
│   │   ├── auction/                # [공매 물건 도메인]
│   │   │   ├── AuctionListScreen.tsx   # 공매 물건 목록 및 다중 필터/정렬
│   │   │   └── AuctionDetailScreen.tsx # 공매 물건 상세정보 및 온비드 입찰 안내
│   │   ├── watchlist/              # [관심 공매 도메인]
│   │   │   └── WatchlistScreen.tsx # 찜한 물건 목록 및 실시간 D-Day 추적
│   │   └── my/                     # [마이페이지 도메인]
│   │       └── MyScreen.tsx        # 회원 정보, 온비드 인증서 및 API 연동 상태
│   │
│   ├── services/                   # 외부 API 통신 및 비즈니스 로직
│   │   └── onbidService.ts         # 차세대 온비드 OpenAPI(B010003) 통신 모듈 & 데이터 어댑터
│   │
│   ├── data/                       # 목(Mock) 데이터 및 기본 상수
│   │   └── mockAuctionData.ts      # 오프라인/Fallback용 온비드 물건 데이터 및 카테고리 정의
│   │
│   ├── types/                      # TypeScript 공통 타입 정의
│   │   └── auction.ts              # 공매 데이터 모델 인터페이스
│   │
│   ├── App.css                     # 커스텀 보조 스타일
│   ├── App.tsx                     # 루트 애플리케이션 진입점 & 모바일 뷰 프레임
│   ├── index.css                   # Tailwind CSS v4 & Stitch 디자인 시스템 토큰
│   └── main.tsx                    # React DOM 마운트 진입점
│
├── .env.local                      # [보안] 로컬 전용 공공데이터 API Key 보관 (Git 제외)
├── .gitignore                      # Git 버전 관리 제외 설정
├── index.html                      # 모바일 뷰포트 & Safe Area 최적화 HTML 템플릿
├── package.json                    # 의존성 패키지 및 스크립트 정의
├── tsconfig.json                   # TypeScript 환경 설정
└── vite.config.ts                  # Vite 빌드 설정 & CORS 우회 프록시 설정
```

---

## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 용도 및 특징 |
|---|---|---|
| **Core** | React 19, TypeScript | 컴포넌트 기반 UI 개발 및 엄격한 정적 타입 검증 |
| **Build Tool** | Vite 8, Rolldown | 초고속 HMR(Hot Module Replacement) 및 최적화 번들링 |
| **Styling** | Tailwind CSS v4 | Zero-config 최신 Vite 플러그인 기반 유틸리티 퍼스트 스타일링 |
| **Design System** | Google Stitch | 토스/카카오뱅크 스타일의 정돈된 금융 카드 룩앤필 |
| **Typography** | Plus Jakarta Sans, Inter | 헤드라인 및 본문 가독성 최적화 웹폰트 |
| **Icons** | Material Symbols Outlined | 구글 공식 머티리얼 심볼 아이콘 폰트 |
| **Data / API** | 차세대 온비드 OpenAPI (`B010003`) | 한국자산관리공사 부동산/차량 실시간 공매 데이터 |

---

## 3. 핵심 화면 및 기능 (Core Features)

1. **홈 / 탐색 (`HomeScreen.tsx`)**
   - **실시간 검색 바**: 아파트명, 지역, 자산명 검색
   - **지역 칩 가로 스크롤**: 전국, 서울, 경기, 인천, 부산 등 원클릭 빠른 지역 필터
   - **8대 카테고리 그리드**: 아파트/주택, 상가/오피스, 토지/임야, 자동차, 동산, 공장, 신규등록, 반값공매
   - **🔥 마감 임박 입찰 D-1 특가**: 입찰 마감이 임박한 알짜배기 물건 가로 슬라이더
   - **💡 이번 주 유찰 추천! 반값 물건**: 감정가 대비 최대 59% 저렴한 유찰 물건 세로 리스트
   - **공공데이터 공식 연계 배너**: 온비드 OpenAPI 실시간 동기화 상태 표시

2. **공매 목록 (`AuctionListScreen.tsx`)**
   - 시도별 지역 필터 및 공매 구분(전체 / 신탁공매 / 압류재산 / 국유재산) 필터링
   - 4가지 정렬 옵션 지원: 마감임박순, 할인율높은순, 최저입찰가순, 인기순

3. **공매 물건 상세 (`AuctionDetailScreen.tsx`)**
   - 고화질 현장 사진 갤러리 슬라이더
   - 최저입찰가 vs 감정가 대비 할인율 대형 인디케이터
   - 입찰보증금(10%) 자동 계산
   - 권리분석 안전 체크리스트
   - 온비드 전자입찰 사이트 원클릭 연동 및 기일 알림 토글

4. **관심 공매 보관함 (`WatchlistScreen.tsx`)**
   - 찜한 물건의 실시간 D-Day 카운트다운 및 관리

5. **마이페이지 (`MyScreen.tsx`)**
   - 회원 프로필, 온비드 전자입찰 공동인증서 관리 안내, 공공데이터 포털 API 연동 상태 모니터링

---

## 4. 온비드 OpenAPI 통신 구조 (`onbidService.ts`)

- **CORS 우회 개발 프록시**:
  - 브라우저의 CORS 제약을 우회하기 위해 `vite.config.ts`의 `server.proxy`(`/api/public-data`)를 통해 `apis.data.go.kr`과 안전하게 통신합니다.
- **데이터 어댑터 (Adapter Pattern)**:
  - 공공데이터포털 차세대 온비드 원시 필드(`onbidCltrNm`, `apslEvlAmt`, `lowstBidPrcIndctCont`, `thnlImgUrlAdr` 등)를 화면 규격인 `GongItem`으로 자동 정규화합니다.
- **무중단 Fallback 보장**:
  - API 트래픽 한도 초과나 공공데이터 서버 점검 시에도 앱이 중단되지 않고 로컬 캐시/샘플 데이터로 자동 대체되는 방어 로직이 적용되어 있습니다.

---

## 5. 개발 환경 설정 및 실행 가이드

### 1) 환경 변수 설정
프로젝트 루트 또는 `frontend/` 디렉터리에 `.env.local` 파일을 생성하고 공공데이터 포털에서 발급받은 인증키를 입력합니다:

```bash
# frontend/.env.local
VITE_PUBLIC_DATA_API_KEY=발급받은_공공데이터포털_일반인증키(Decoding)
VITE_API_BASE_URL=/api/public-data
```

### 2) 패키지 설치
```bash
cd frontend
npm install
```

### 3) 로컬 개발 서버 구동
```bash
npm run dev
```
- 브라우저에서 `http://localhost:5173`으로 접속하여 모바일 하이브리드 화면을 확인합니다.

### 4) 프로덕션 빌드 및 타입 검증
```bash
npm run build
```
- TypeScript 컴파일 및 Vite 번들링을 거쳐 `frontend/dist/` 디렉터리에 최적화된 정적 파일이 생성됩니다.
