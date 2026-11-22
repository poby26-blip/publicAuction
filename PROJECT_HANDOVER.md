# 📋 [공매이지] 프로젝트 인수인계 및 에이전트 작업 지침서 (PROJECT_HANDOVER.md)

> **문서 버전**: v1.4.6  
> **최종 갱신일**: 2026년 11월 19일  
> **프로젝트 경로**: `c:\dev\workspace\publicAuction`  
> **프론트엔드 경로**: `c:\dev\workspace\publicAuction\frontend`  
> **문서 목적**: 사무실, 자택 등 서로 다른 개발 환경의 **Antigravity 에이전트**가 프로젝트 컨텍스트를 즉시 100% 복원하여 끊김 없이 작업을 이어가도록 안내하며, **사용자**가 프로젝트 진행 상황과 아키텍처를 한눈에 확인할 수 있도록 지원합니다.

---

## 📌 1. 프로젝트 개요 (Project Overview)

- **앱 명칭**: **공매이지 (Public Auction Mobile App)**
- **서비스 성격**: 공공데이터포털(data.go.kr) 및 한국자산관리공사(KAMCO) 차세대 온비드 OpenAPI를 연동한 모바일 웹 하이브리드 공매 정보 탐색 애플리케이션
- **기술 스택**:
  - **Core**: React 19.3, TypeScript 7.0, Vite 8.3
  - **Styling**: Tailwind CSS v4, Material Symbols Outlined Icons
  - **Icons**: Lucide React, Google Material Symbols
  - **디자인 가이드**: Google Stitch 기반 모바일 뷰포트 레이아웃 (`max-w-md` = 448px 중앙 정렬 컨테이너)
- **개발 디렉터리 구조**:
  ```text
  publicAuction/
  ├── frontend/
  │   ├── src/
  │   │   ├── components/
  │   │   │   ├── common/       # Skeleton.tsx, AuctionCard.tsx, Toast.tsx, PhotoGalleryModal.tsx 등 공통 컴포넌트
  │   │   │   └── layout/       # AppHeader.tsx, AppNavigation.tsx 등 레이아웃
  │   │   ├── data/             # AuctionData.ts (표준 17개 시도 메타데이터, 타입 정의 및 유틸리티)
  │   │   ├── pages/
  │   │   │   ├── home/         # HomeScreen.tsx (홈 화면)
  │   │   │   ├── auction/      # AuctionListScreen.tsx (목록), AuctionDetailScreen.tsx (상세)
  │   │   │   ├── watchlist/    # WatchlistScreen.tsx (관심물건 찜 목록)
  │   │   │   └── my/           # MyScreen.tsx (마이페이지)
  │   │   ├── services/         # onbidService.ts (온비드 API), storageService.ts (RN 호환 로컬 스토리지 추상화)
  │   │   ├── store/            # useAuctionStore.ts (Zustand 기반 통합 전역 상태 관리)
  │   │   ├── types/            # TypeScript 인터페이스 정의
  │   │   ├── App.tsx           # 메인 네비게이션 및 상세 오버레이 상태 머신
  │   │   └── main.tsx
  │   ├── package.json
  │   ├── vite.config.ts        # 온비드 API CORS 우회 프록시 설정 (/api/public-data)
  │   └── tsconfig.json
  ├── PROJECT_HANDOVER.md       # [본 문서] 프로젝트 인수인계 지침서
  ├── README.md
  └── .gitignore
  ```

---

## 🎨 1-1. 화면 기획 및 UI 생성 파이프라인 (Google Stitch & MCP Workflow)

본 프로젝트는 기획부터 프론트엔드 코드 구현까지 **Google Stitch**와 **MCP(Model Context Protocol)**를 결합한 차세대 AI 설계 파이프라인을 기반으로 구축되었습니다:

1. **화면 기획 및 프로토타이핑 (Google Stitch)**:
   - 앱의 모든 모바일 UI/UX, 정보 구조(IA), 컴포넌트 레이아웃 및 인터랙션은 **Google Stitch(구글 스티치)**를 사용하여 기획·디자인되었습니다.
   - Google Stitch를 통해 모바일 전용 뷰포트(`max-w-md` = 448px 중앙 정렬 컨테이너)와 최적의 모바일 카드 UI, 스켈레톤 상태, 필터 칩 네비게이션이 설계되었습니다.

2. **MCP (Model Context Protocol) 연동을 통한 화면 생성**:
   - Google Stitch에서 완성된 화면 기획 및 디자인 스펙을 **MCP 서버 연결**을 통해 Antigravity AI 에이전트 개발 환경으로 직접 연동하였습니다.
   - 에이전트는 MCP 컨텍스트를 실시간으로 참조하여 Stitch 디자인 명세를 React 19 + TypeScript + Tailwind CSS v4 컴포넌트 코드로 자동 변환·생성하였습니다.
   - 자동 생성된 UI 골격 위에 한국자산관리공사(KAMCO) 차세대 온비드 OpenAPI(`onbidService.ts`) 실데이터 통신 및 상태 머신(`App.tsx`)을 결합하여 프로덕션 수준의 앱으로 완성되었습니다.

3. **향후 신규 화면 추가 및 디자인 수정 시 표준 워크플로우**:
   - **1단계**: Google Stitch에서 신규 화면(예: 마이페이지, 관심물건 고도화 등)의 UI/UX 기획 및 레이아웃 설계
   - **2단계**: 에이전트 환경에서 MCP를 통해 Google Stitch 프로젝트 컨텍스트 및 화면 명세 로드
   - **3단계**: 디자인 토큰(Material Symbols, Tailwind 컬러 팔레트)을 준수하는 React 컴포넌트 코드 생성
   - **4단계**: 실데이터 OpenAPI 연동 및 `npm run build`를 통한 빌드 무결성 검증

---

## 🚨 2. 에이전트 핵심 행동 수칙 (Agent Core Rules - 절대 규칙)

다른 PC의 Antigravity 에이전트는 작업을 시작할 때 **반드시 다음 5대 규칙을 엄격히 준수**해야 합니다:

1. **사전 계획 제시 및 사용자 승인 필수 (Work Protocol & Planning)**
   - 실제 파일 수정이나 코드 변경 작업에 착수하기 전에, **어떻게 작업을 진행할 것인지에 대한 구체적인 계획을 먼저 한국어로 제시**해야 합니다.
   - 제시한 계획에 대해 **사용자의 확인 및 승인을 받은 후에만** 다음 단계 작업을 진행합니다. 임의로 코드를 바로 수정하지 마십시오.
2. **Git 커밋 및 푸시 절대 금지 (No Git Commit/Push)**
   - 에이전트는 절대 `git commit`이나 `git push` 명령어를 직접 실행해서는 안 됩니다.
   - *(사용자 요청)* 작업 완료 보고 시 **Git 커밋/푸시 명령어 안내는 생략**하고 작업 내용 및 검증 결과만 깔끔하게 보고하십시오.
3. **기본 언어는 한국어 유지 (Language & Communication)**
   - 모든 대화, 설명, 코드 주석은 **한국어(Korean)**를 기본으로 유지합니다.
   - 코드 블록이나 기술 고유명사는 영문을 병기하되, 친절하고 명확한 한국어로 소통합니다.
4. **한 번에 하나의 기능 단위로 순차 진행**
   - 홈 화면 ➔ 공매 목록 화면 ➔ 관심물건 ➔ 마이페이지 등 한 번에 하나의 기능 단위로 계획-구현-빌드 검증을 완료하며 진행합니다.
5. **빌드 검증 필수**
   - 각 단계 작업 완료 시 반드시 `cd frontend && npm run build` (`tsc -b && vite build`)를 실행하여 타입 에러와 번들링 에러가 0건임을 검증합니다.

---

## 🌐 3. 차세대 온비드 OpenAPI (`B010003`) 실측 규격 및 연동 노하우

한국자산관리공사(KAMCO) 차세대 온비드 OpenAPI 연동 시 시행착오를 방지하기 위해 다음 실측 규격을 숙지해야 합니다:

| 항목 | 내용 |
| :--- | :--- |
| **기관 코드** | `B010003` (한국자산관리공사 차세대 온비드) |
| **Base URL** | `https://apis.data.go.kr` (로컬 개발 시 Vite 프록시 `/api/public-data` 사용) |
| **부동산 목록 오퍼레이션** | `/B010003/OnbidRlstListSrvc2/getRlstCltrList2` ⚠️ *숫자 `2` 필수. `cltrUsgLclsCtgrNm="부동산"`이 `"동산"` 부분 문자열에 매칭되지 않도록 선행 판별 필수* |
| **동산 목록 오퍼레이션** | `/B010003/OnbidMvastListSrvc2/getMvastCltrList2` (기계기구·임산물·불용품 등 2,400+건, `apslEvlAmt: null` 방어 및 1차 `0007,0002` / 2차 `0004,0010` Fallback 조회) |
| **차량 목록 오퍼레이션** | `/B010003/OnbidCarListSrvc2/getCarCltrList2` (실거래 차량 186+건 확보) |
| **필수 파라미터** | 1) `pvctTrgtYn=N` (수의계약 제외)<br>2) `dspsMthodCd=0001` (처분방식: 매각)<br>3) `prptDivCd=0007,0002` (신탁/담보 및 압류재산 31,000+건)<br>⚠️ *누락 시 코드 11(`NO_MANDATORY_REQUEST_PARAMETERS_ERROR`) 발생* |
| **2026년 행정통합 반영** | **'전남광주통합특별시'** (2026.07.01 공식 출범 반영)<br>- 온비드 DB 과도기 특성상 `전남광주통합특별시` + `광주광역시` + `전라남도` 3개 쿼리를 병렬 호출하여 통합 수집 및 중복 제거 처리 |
| **무기한/상시 매각 방어** | 마감일시가 `299912301600` 등으로 내려오는 물건은 `상시 매각`으로 D-Day 오계산 방어 처리 |

---

## 🏆 4. 현재까지 완료된 작업 상세 내역 (Completed Progress)

### ✅ [1단계] 홈 화면 (`HomeScreen.tsx`) OpenAPI 연동 1~4단계 전체 완료
1. **실데이터 로딩 파이프라인 구축**: `App.tsx`에서 초기 마운트 시 온비드 부동산 실데이터 20건 페칭 및 `<CardSkeleton>`, `<ListSkeleton>` 구현.
2. **마감 임박 D-1 특가 가로 슬라이더**: D-Day 오름차순 정렬, `onError` Fallback 이미지, 카드 클릭 시 상세 화면 연동.
3. **이번 주 유찰 추천! 반값 물건 세로 리스트**: 감정가 대비 할인율 40% 이상 물건 내림차순 정렬, 동적 최고 할인율 뱃지 계산.
4. **상단 17개 시/도 퀵 필터 칩 & 8대 카테고리 바로가기**: 지역 칩 클릭 시 실시간 온비드 API 호출 및 건수 피드백, 8대 카테고리 4x2 그리드 클릭 시 목록 화면으로 필터 자동 전달.
5. **지역 필터 버그 완벽 조치**: 0건일 때 전체 물건을 반환하던 클라이언트 Fallback을 제거하고, 엄격한 지역 필터링(`activeItems`) 및 정직한 Empty State 적용.

### ✅ [2단계] 공매 목록 화면 (`AuctionListScreen.tsx`) OpenAPI 연동 1~4단계 전체 완료
1. **1단계 (실데이터 연동)**:
   - 카테고리 및 시/도 지역 변경 시 실시간 온비드 API 비동기 호출.
   - `selectedCategory === 'car'`일 때 차량 전용 API(`fetchOnbidCarList`)로 자동 분기하여 실제 제네시스, 벤츠, 쏘나타 등 차량 186건 표출.
2. **2단계 (대용량 페이징 및 '더보기')**:
   - `pageNo`, `hasMore`, `isLoadingMore` 상태 관리 구현.
   - 목록 최하단 '공매 물건 더보기 (현재 N건 로드됨)' 버튼 및 회전 스피너(`progress_activity`) 애니메이션.
   - 모든 페이지 로드 완료 시 '해당 조건의 모든 공매 물건을 불러왔습니다' 완료 뱃지 표출.
   - React Key 충돌 방어 `${item.id}-${idx}` 적용.
3. **3단계 (다중 필터링 및 4대 정렬 고도화)**:
   - 온비드 원시 재산구분명(`prptDivNm`)을 `신탁공매`, `압류재산`, `국유재산`으로 정규화하여 칩 필터와 1:1 완벽 매칭.
   - 실시간 4대 정렬 파이프라인 구축 (마감임박순, 할인율높은순, 최저입찰가순, 인기순).
   - 다중 키워드 AND 검색 및 활성 필터 태그 피드백 (지역, 공매유형, 검색어 원클릭 해제).
4. **4단계 (상세 화면 연동 및 조회 파이프라인 완결)**:
   - **오버레이 렌더링 도입 (`App.tsx`)**: 물건 클릭 시 상세 화면을 `absolute inset-0 z-50 bg-[#f8f9ff] overflow-y-auto` 오버레이로 띄워, **뒤로가기 시 보던 목록의 스크롤 위치, 필터, 페이징 누적 데이터가 100% 보존**되도록 개선.
   - 빈 상태(Empty State)에 '검색 필터 초기화' 버튼 추가.

### ✅ [3단계] 상세 화면 (`AuctionDetailScreen.tsx`) 실데이터 연동 완성
- 온비드 관리번호(`item.id`), 감정가, 최저입찰가, 할인율, 법정 입찰보증금(10% 자동 계산), 유찰횟수, 입찰일정, 면적/제원 완벽 매핑.
- 대표 이미지 슬라이더 및 썸네일에 `onError` 핸들러 탑재로 엑박 방지 (부동산/차량별 Fallback 이미지 분기).
- D-Day 뱃지(오늘 마감, 상시 매각, D-Day) 방어 로직.

### ✅ [4단계] 17개 표준 시/도 및 '전남광주통합특별시' 행정구역 개편 완료
- 2026년 7월 출범한 **'전남광주통합특별시'** 및 누락되었던 **'울산광역시'**를 포함한 17개 표준 시/도 메타데이터 체계(`GONG_REGION_METAS`) 구축 ([mockAuctionData.ts](file:///c:/dev/workspace/publicAuction/frontend/src/data/mockAuctionData.ts)).
- 지능형 주소 매칭 함수 `isRegionMatch` 및 API 질의어 변환기 `getRegionApiQueries` 구현:
  - '충북' 선택 시 ➔ 주소의 '충청북도', '충북' 모두 매칭.
  - '전남광주' 선택 시 ➔ '전남광주통합특별시', '광주광역시', '전라남도'를 병렬 호출하여 통합 수집하고, 주소 매칭 시에도 모두 포괄하여 매칭.

### ✅ [5단계] 소스코드 전면 한국어 JSDoc 주석 보강
- `App.tsx`, `HomeScreen.tsx`, `AuctionListScreen.tsx`, `AuctionDetailScreen.tsx`, `onbidService.ts`, `mockAuctionData.ts`, `Skeleton.tsx`, `WatchlistScreen.tsx`, `AppHeader.tsx`, `storageService.ts` 등 핵심 파일 전반에 상세한 한국어 JSDoc 주석 적용 완료.

### ✅ [6단계] 관심물건(찜) 기능 개발 및 React Native 전환 대비 스토리지 추상화 완료
1. **React Native 대비 스토리지 추상화 레이어 구축 ([storageService.ts](file:///c:/dev/workspace/publicAuction/frontend/src/services/storageService.ts))**:
   - 최종 목표인 순수 React Native 앱 전환 시 UI/상태 코드 수정 없이 `@react-native-async-storage/async-storage` 또는 `react-native-mmkv`로 즉시 교체 가능하도록 비동기(`Promise`) 기반 공통 `AppStorageAdapter` 인터페이스 및 `setStorageAdapter` 주입 구조를 설계했습니다.
2. **객체 기반 영구 보관 및 경쟁 상태 방어 ([App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx))**:
   - 가짜 Mock ID 초기값을 제거하고, 목록 2페이지 이후·차량·타 지역 검색 물건도 보관함에서 누락되지 않도록 `GongItem` 전체 객체를 영구 보관합니다.
   - 비동기 초기 복원 완료 전에 초기 빈 배열(`[]`)이 기존 데이터를 덮어쓰는 Race Condition을 `isWatchlistInitialized` 플래그로 방어했습니다.
3. **관심 공매 보관함 UI/UX 고도화 ([WatchlistScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/watchlist/WatchlistScreen.tsx))**:
   - 최신등록순 / 마감임박순 정렬 토글, 전체 비우기(`window.confirm` 확인 후 일괄 삭제), 3일 이내 마감 임박 물건 주의 배너, 이미지 Fallback 및 D-Day('오늘 마감', '상시 매각') 방어 처리를 구현했습니다.
4. **전 화면 실시간 동기화 및 실데이터 알림 연동 ([AppHeader.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/layout/AppHeader.tsx))**:
   - 홈·목록·상세·보관함 어느 화면에서 하트를 누르든 하단 탭 뱃지(`watchlistCount`)와 상단 헤더의 3일 이내 마감 임박 관심물건 알림(`urgentWatchlistCount`)이 실시간 동기화됩니다.

### ✅ [7단계] 3대 상품군(부동산·동산·자동차) 카테고리 정리 및 동산 OpenAPI 연동 완료
1. **상품군 메타데이터 및 공통 헬퍼 구축 ([mockAuctionData.ts](file:///c:/dev/workspace/publicAuction/frontend/src/data/mockAuctionData.ts))**:
   - `AssetGroup` (`'all' | 'real_estate' | 'movable' | 'car'`) 및 `GONG_ASSET_GROUPS`, 카테고리별 Fallback 이미지 헬퍼 `getCategoryFallbackImage`, 대분류 판별기 `resolveAssetGroup`을 구현했습니다.
2. **동산 OpenAPI 연동 및 공통 쿼리 실행기 리팩토링 ([onbidService.ts](file:///c:/dev/workspace/publicAuction/frontend/src/services/onbidService.ts))**:
   - `executeOnbidListQuery` 공통 엔진 추출을 통해 부동산·동산·자동차 API의 중복 로직을 통합했습니다.
   - **동산 목록조회 API(`fetchOnbidMovableList`)** 및 **3대 상품군 통합 병렬 조회(`fetchOnbidAllAssetsList`)** 를 구축했습니다.
   - `"부동산".includes("동산")` 오분류 버그 해결(`isRealEstate` 선행 가드), 공장/창고(`factory`) 분류 추가, 감정가 미산정(`null`) 방어를 완료했습니다.
3. **2단 상품군·세부 필터 UI 및 전 화면 동기화 ([AuctionListScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx), [App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx), [HomeScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx))**:
   - **홈 화면 및 목록 화면 양쪽 모두** 상단에 `전체 | 부동산 | 동산 | 자동차` 1차 세그먼트 탭과 선택된 상품군별 세부 카테고리 2단 구조를 동일하게 적용했습니다.
   - 홈 화면에서 3대 상품군 또는 지역 선택 시 해당 OpenAPI를 실시간 분기 호출하며, 목록 화면으로 이동 시 선택한 상품군과 지역 필터가 그대로 전달됩니다.
   - 전 화면(홈·목록·상세·보관함)의 Fallback 이미지와 감정가 표기를 통일했습니다.

### ✅ [8단계] 마이페이지 (`MyScreen.tsx`) 1차 실용 설정 기능 구현 완료
1. **알림 설정 영구 저장소 확장 ([storageService.ts](file:///c:/dev/workspace/publicAuction/frontend/src/services/storageService.ts))**:
   - RN 호환 비동기 스토리지 추상화 레이어에 `AlertSettings` 영구 저장·복원·초기화(`loadAlertSettings`, `saveAlertSettings`, `resetAlertSettings`) API를 추가했습니다.
2. **공매 및 입찰 알림 설정 & 앱 기본 설정 구현 ([MyScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/my/MyScreen.tsx), [App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx))**:
   - Google Stitch 마이페이지 디자인 토큰 기반의 상단 플로팅 토스트 피드백 및 4종 알림 토글 스위치(D-1/D-Day 알림, 조건 맞춤 신규 공매, 감정가 하향/유찰 속보, 야간 알림 제한)를 구현했습니다.
   - 차세대 온비드 OpenAPI 연동 상태 및 `새로고침` 실시간 재조회, 임시 설정 캐시 초기화(관심물건 보존), 공매 가이드 FAQ 및 이용약관/처리방침 모바일 모달을 완성했습니다.

---

### ✅ [9단계] 전역 토스트 알림 전환 및 관심 보관함 선택 삭제 구현 완료
1. **공통 토스트 팝업 전역화 ([Toast.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/common/Toast.tsx), [App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx), [AuctionDetailScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx), [MyScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/my/MyScreen.tsx))**:
   - 기존 `alert()` 호출을 제거하고 `z-[60]` 계층의 공통 `<Toast />` 컴포넌트와 중앙 `showToast` 핸들러로 통합했습니다. (헤더 임박 알림 `'보러가기'`, 상세 화면 클립보드 복사/기일알림/온비드 `'사이트 이동'` 액션 포함)
2. **관심 공매 보관함 선택 삭제 ([WatchlistScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/watchlist/WatchlistScreen.tsx), [App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx))**:
   - 보관함 툴바에 `선택 삭제` 모드 전환 버튼을 추가하고, 선택 모드에서 `전체 선택 / 전체 해제`, 카드 체크박스 토글, 하단 플로팅 일괄 삭제 바(`선택한 N건 삭제`)를 구현했습니다.
   - 삭제 실행 시 `window.confirm` 확인창을 거쳐 `removeWatchlistItems`로 일괄 삭제하고 `storageService` 영구 반영 및 토스트 피드백을 제공합니다.
3. **상세 화면 진입 스크롤 위치 버그 수정 ([App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx), [AuctionDetailScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx))**:
   - 상세 화면 오버레이를 `absolute inset-0`에서 뷰포트 기준 `fixed inset-0 max-w-md mx-auto overflow-y-auto overscroll-contain`으로 전환하고, 진입 시 `scrollTop = 0` 초기화 및 배경 `document.body.style.overflow = 'hidden'` 잠금을 적용하여 상세 화면은 항상 최상단에서 시작하고 뒤로가기 시 목록 스크롤은 보존되도록 수정했습니다.

---

### ✅ [10단계] 상세 화면 온비드 3대 상품군 물건상세 OpenAPI 연계 완료
1. **데이터 모델 및 상세조회 API 연동 ([mockAuctionData.ts](file:///c:/dev/workspace/publicAuction/frontend/src/data/mockAuctionData.ts), [onbidService.ts](file:///c:/dev/workspace/publicAuction/frontend/src/services/onbidService.ts))**:
   - `GongItem`에 목록 API의 `cltrMngNo`, `pbctCdtnNo`, `onbidCltrno`, `assetGroup`, 기관명, 입찰/경쟁방식, 회차, 명도책임, 배분요구종기, 진행상태 필드를 확장 매핑했습니다.
   - `GongDetailInfo` 모델 및 `fetchOnbidItemDetail` 함수를 추가하여 `getRlstDtlInf2`(부동산), `getMvastDtlInf2`(동산), `getCarDtlInf2`(자동차) 상세 API를 자동 분기 호출하고 인메모리 캐싱합니다.
2. **상세 화면 실데이터 바인딩 ([AuctionDetailScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx))**:
   - 다중 현장 사진(`potoUrlList`), 지번/도로명 주소, 면적·지분 내역(`sqmsList`), 자동차/동산 전용 제원, 물건 현황·입찰 유의·특이사항, 감정평가 내역 및 평가서 링크(`apslEvlClgList`), 등기부 주요 권리 내역(`rgstPrmrInfList`)을 실데이터로 표출합니다.
3. **식별번호·주소 복사 및 지도/온비드 연계 ([AuctionDetailScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx))**:
   - 안전 클립보드 복사 유틸(`copyTextSafely`)과 `DetailRowList` `copyable` 지원을 통해 물건관리번호·온비드 물건번호·소재지 주소·인도/보관장소 원클릭 복사 및 토스트 안내를 구현했습니다.
   - 주소 하단에 `네이버 지도` / `카카오맵` 위치 검색 연결 버튼을 추가하고, `온비드 입찰 참여하기` 클릭 시 관리번호를 자동 복사한 뒤 `온비드 이동` 토스트 액션을 제공합니다.
4. **기일 알림 상태 영구화 및 보관함 '알림중' 표시 ([storageService.ts](file:///c:/dev/workspace/publicAuction/frontend/src/services/storageService.ts), [App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx), [WatchlistScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/watchlist/WatchlistScreen.tsx))**:
   - `BID_DATE_ALERT_ITEMS` 스토리지 키 및 `loadBidAlertItems`/`saveBidAlertItems`/`clearBidAlertItems` 도메인 API를 추가해 기일 알림 설정을 영구 저장합니다.
   - 상단 헤더 알림 배지(`totalUrgentAlarmCount`) 및 알림 토스트가 관심물건·기일알림 임박 건수를 중복 없이 통합 연동하며, 관심 보관함 카드에도 `'알림중'` 배지를 표출합니다.

### ✅ [11단계] 폴더블 폰 · 태블릿 반응형 인터페이스 전환 완료
1. **반응형 앱 셸 및 내비게이션 레일 ([App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx), [AppNavigation.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/layout/AppNavigation.tsx), [AppHeader.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/layout/AppHeader.tsx), [Toast.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/common/Toast.tsx))**:
   - `max-w-md` 단일 모바일 프레임을 `w-full md:max-w-5xl xl:max-w-6xl`로 확장해 폴더블 펼침(`sm`) 및 태블릿(`md+`)을 지원하고, `overflow-x-clip`으로 `sticky` 고정을 보장했습니다.
   - `768px` 이상에서는 하단 탭 바 대신 좌측 사이드 내비게이션 레일(`md:w-20` / `lg:w-56`)로 자동 전환되며, 상단 헤더에 현재 화면 컨텍스트와 검색 버튼을 표출합니다.
2. **전 화면 다중 컬럼 그리드 · 상세 2컬럼 분할 ([HomeScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx), [AuctionListScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx), [WatchlistScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/watchlist/WatchlistScreen.tsx), [MyScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/my/MyScreen.tsx), [AuctionDetailScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx), [Skeleton.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/common/Skeleton.tsx))**:
   - 홈·공매목록·관심보관함 물건 리스트를 `1열(모바일) / 2열(폴더블 sm) / 3열(태블릿 lg~xl)` 반응형 그리드로 전환하고, 마이페이지는 `lg:grid-cols-12` 2컬럼 대시보드로 구성했습니다.
   - 상세 화면은 태블릿(`md+`)에서 좌측 `sticky` 요약(사진 갤러리·제목·주소·지도 링크) / 우측 상세(가격·일정·제원·유의사항·감정·권리) 2컬럼 분할 및 하단 가격 요약 포함 액션 독으로 개편했습니다.
3. **상세 화면 사진 전체보기 라이트박스 ([PhotoGalleryModal.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/common/PhotoGalleryModal.tsx), [AuctionDetailScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx))**:
   - 이미지 상·하단 그라데이션, 우측 하단 `전체보기` 버튼 및 대표 이미지 클릭 진입을 구현했습니다.
   - `z-[70]` 풀스크린 모달에서 원본 비율(`object-contain`), `1x ↔ 확대 보기` 스크롤 팬, 터치 스와이프, 키보드(`ESC`·좌우 방향키), 하단 썸네일 탐색 및 슬라이더 인덱스 동기화를 지원합니다.

### ✅ [12단계] 검색 기능 OpenAPI 실시간 조회 연동 완료
1. **온비드 OpenAPI 검색 파라미터 및 관리번호 직접 조회 ([onbidService.ts](file:///c:/dev/workspace/publicAuction/frontend/src/services/onbidService.ts))**:
   - `executeOnbidListQuery` 및 부동산·동산·자동차·통합 조회 함수에 `keyword` 지원을 추가하고, 검증된 서버 파라미터 `onbidCltrNm`(대표 토큰 자동 추출 `extractOnbidSearchToken`)로 전체 온비드 DB 검색을 연동했습니다.
   - 물건관리번호(`YYYY-XXXX-XXX`) 입력 시 `fetchOnbidItemsByManagementNo`로 3대 상세 API를 병렬 조회해 해당 물건을 즉시 반환합니다.
2. **입력 중 로컬 필터 / 확정 시 OpenAPI 조회 분리 ([AuctionListScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx), [HomeScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx))**:
   - 타이핑·한글 조합 중에는 데이터 소모 없이 기존 `listItems` 내에서만 로컬 필터링하고, `Enter` 키(`!e.nativeEvent.isComposing` 가드) 또는 `검색` 버튼 클릭 시에만 `committedQuery`를 갱신해 OpenAPI 조회 및 `'더보기'` 페이징을 수행합니다.
3. **공식 앱 아이콘 적용 ([index.html](file:///c:/dev/workspace/publicAuction/frontend/index.html), [manifest.webmanifest](file:///c:/dev/workspace/publicAuction/frontend/public/manifest.webmanifest), [AppHeader.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/layout/AppHeader.tsx), [AppNavigation.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/components/layout/AppNavigation.tsx))**:
   - `/public/gongmaeEasyIcon.png`를 HTML 파비콘, Apple 터치 아이콘, PWA 매니페스트 아이콘 및 상단·사이드 브랜드 로고 이미지로 일괄 적용했습니다.

### ✅ [13단계] 태블릿 가로모드 전폭 확장 및 홈 화면 반값 물건 카드 오버플로우 개선
1. **가로모드 좌우 공백 제거 및 전폭(`w-full`) 뷰포트 확장 ([App.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/App.tsx))**:
   - `md:max-w-5xl xl:max-w-6xl` 중앙 박스 제한을 제거하고 부모 배경과 앱 프레임을 `w-full`로 확장하여 태블릿 가로모드 및 와이드 화면에서 좌우 공백 영역을 없애고 화면 전체를 꽉 차게 활용하도록 개선했습니다.
   - 상세 화면 오버레이 역시 `fixed inset-0 w-full`로 정렬하여 가로모드 2컬럼 레이아웃의 몰입감을 극대화했습니다.
2. **반값 물건 카드 flexbox 오버플로우 방어 및 3열 그리드 최적화 ([HomeScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx))**:
   - 카드 우측 정보 칼럼에 `min-w-0`을 부여하여 flex 자식 요소의 텍스트가 카드 영역 밖으로 밀려나는 현상을 방어했습니다.
   - 가격/기일 영역에 `flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5`를 적용하여 좁은 카드 폭에서도 기일 텍스트가 카드 패딩 밖으로 튀어나가지 않고 유연하게 배치되도록 처리했습니다.
   - 면적/제목/주소 텍스트의 유동적 말줄임(`truncate`)을 보강하고, 그리드 브레이크포인트를 `lg:grid-cols-3`로 최적화하여 4번 섹션(D-1 특가) 및 목록 화면과 3열 통일성을 확보했습니다.

### ✅ [14단계] Zustand 기반 전역 상태관리 도입 및 카테고리 누락 버그 해결
1. **버그 원인 규명 및 전역 스토어 구축 ([useAuctionStore.ts](file:///d:/workspace/publicAuction/frontend/src/store/useAuctionStore.ts))**:
   - 홈 화면에서 '부동산' 등 1차 상품군을 선택한 뒤 2차 테마 카테고리('신규등록', '반값공매')를 클릭했을 때 단일 파라미터(`cat.id`)만 전달되어 1차 상품군이 '전체'로 초기화되던 상태 누락 버그를 분석·해결했습니다.
   - 단일 진실 공급원(Single Source of Truth) 원칙에 따라 경량 상태관리 모듈 `zustand`를 도입하고 통합 스토어(`useAuctionStore.ts`)를 구축하여 1차 상품군(`assetGroup`), 2차 세부카테고리(`subCategory`), 시/도 지역, 검색어, 활성 탭, 상세 오버레이 및 관심물건/기일알림을 중앙에서 일관 관리합니다.
   - Zustand는 DOM 비의존 순수 TypeScript 클로저 기반이므로, 향후 React Native 전환 시 스토어 코드를 100% 그대로 재사용할 수 있습니다.
2. **화면 간 2단 카테고리 상태 보존 및 스토어 연동 ([HomeScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx), [AuctionListScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx), [App.tsx](file:///d:/workspace/publicAuction/frontend/src/App.tsx))**:
   - `HomeScreen.tsx`: 2차 카테고리 칩 및 검색 실행 시 현재 선택된 1차 상품군(`selectedAssetGroup`)과 2차 세부 카테고리(`cat.id`)를 `navigateToListWithFilters` 액션에 함께 전달하도록 개편했습니다.
   - `AuctionListScreen.tsx`: 기존 `parseInitialCategoryFilter`의 하드코딩을 제거하고 스토어의 `assetGroup`과 `subCategory`를 직접 구독하도록 하여 1차 상품군('부동산')과 2차 테마('신규등록' / '반값공매')가 유실 없이 완벽하게 유지되도록 조치했습니다.
   - `App.tsx`: 최상위 컴포넌트의 중복 로컬 상태(`useState`) 및 수동 비동기 스토리지 호출 이펙트를 스토어 액션으로 이관하여 구조를 대폭 단순화했습니다.

### ✅ [15단계] 화면별 독립 상태 분리 및 App.tsx의 순수 화면 Flow 전담화 완료
1. **홈 화면 전용 독립 상태 슬라이스 구축 ([useAuctionStore.ts](file:///d:/workspace/publicAuction/frontend/src/store/useAuctionStore.ts))**:
   - `useAuctionStore.ts`에 홈 화면 전용 상태(`homeItems`, `isHomeLoading`, `homeRegion`, `homeAssetGroup`, `homeSearchKeyword`) 및 비동기 조회 액션(`fetchHomeData`)을 구축하여 공매 목록 화면(`FilterState`)과 상태를 명확히 격리했습니다.
   - 홈 화면에서 지역/상품군을 변경해도 목록 화면의 필터에 영향을 주지 않고, 반대로 목록 화면 필터를 변경해도 홈 화면 상태가 오염되지 않습니다.
2. **홈 화면 UI와 데이터의 100% 일치 및 0ms 즉시 복원 ([HomeScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx))**:
   - `HomeScreen.tsx`가 스토어의 홈 전용 상태를 직접 구독하도록 연동하여, 다른 탭(목록, 관심, 마이페이지)에 다녀와도 이전에 선택한 지역 칩과 상품군 탭 및 데이터가 그대로 유지됩니다.
   - 기존 데이터를 스토어 메모리에서 즉시 렌더링하므로 불필요한 OpenAPI 재호출과 스켈레톤 깜빡임 없이 0ms 즉시 복원됩니다.
3. **App.tsx 화면 Flow 전담화 및 AuctionListScreen 자체 완결화 ([App.tsx](file:///d:/workspace/publicAuction/frontend/src/App.tsx), [AuctionListScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx))**:
   - `App.tsx`에서 거대한 OpenAPI 데이터 페칭 로직(`loadRealTimeOnbidData`, `handleRegionChange` 등)을 완전히 제거하고, 순수 탭 네비게이션과 상세 화면 오버레이 등 화면 흐름(Flow) 제어만 전담하도록 대폭 슬림화했습니다.
   - `AuctionListScreen.tsx`의 `items` prop 의존성을 선택적(optional)으로 전환하여 각 화면이 자체적으로 데이터를 관리할 수 있도록 독립성을 완성했습니다.

### ✅ [16단계] 모바일 환경 가독성 개선을 위한 타이틀 및 메뉴 폰트 확대 및 레이아웃 최적화 완료
1. **상단 헤더 및 하단 네비게이션 가독성 극대화 ([AppHeader.tsx](file:///d:/workspace/publicAuction/frontend/src/components/layout/AppHeader.tsx), [AppNavigation.tsx](file:///d:/workspace/publicAuction/frontend/src/components/layout/AppNavigation.tsx))**:
   - 모바일 상단 로고 컨테이너를 `w-9 h-9`로 확대하고 앱 타이틀을 `text-base`에서 `text-xl`(20px), 서브타이틀 및 온비드 뱃지를 `text-xs`(12px)로 키워 브랜드 시인성을 강화했습니다.
   - 모바일 하단 탭 바 높이를 `h-16`(64px)에서 `h-[68px]`로 확장하고, 아이콘 크기를 `text-[26px]`, 탭 라벨을 `text-xs font-semibold`(활성 시 `font-extrabold text-[#0051d5]`), 카운트 뱃지를 `text-[11px]`로 일괄 확대하여 터치 타겟과 텍스트 시인성을 개선했습니다. 태블릿 사이드 레일의 타이틀 및 메뉴 폰트도 비례하여 확대했습니다.
2. **홈 화면 전 영역 타이틀/메뉴/칩 폰트 스케일업 ([HomeScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx))**:
   - 상단 검색창 인풋을 `text-sm sm:text-base`로 키우고 검색 버튼을 `text-sm font-bold`로 최적화했습니다.
   - 시/도 지역 칩 폰트를 `text-xs`에서 `text-[13px] px-3.5 py-2`로 확대하고, 매물 상태 피드백 바 텍스트를 `text-[13px]`로 조정했습니다.
   - 1차 상품군 세그먼트 탭(`text-sm font-bold/font-extrabold py-2.5`, 아이콘 `text-[18px]`), 2차 테마 카테고리 퀵 그리드(`text-xs font-bold`, 아이콘 `text-[24px]`, 패딩 `p-3`), 부동산 테마 버튼(`text-xs font-bold py-2.5`), 동산/차량 배너 타이틀(`text-sm font-extrabold`)의 폰트를 확대했습니다.
   - 섹션 4(입찰 D-1 특가) 및 섹션 5(유찰 추천 반값 물건) 섹션 제목을 `text-base`에서 `text-lg sm:text-xl font-extrabold`로 키우고 아이콘을 `text-[24px]`로 확장했습니다.
3. **공매 목록, 관심 보관함, 마이페이지 및 상세 화면 폰트/레이아웃 동기화 ([AuctionListScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx), [WatchlistScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/watchlist/WatchlistScreen.tsx), [MyScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/my/MyScreen.tsx), [AuctionDetailScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx))**:
   - `AuctionListScreen.tsx`: 검색바 폰트(`text-sm sm:text-base`), 1차 상품군 탭(`text-sm font-bold`), 2차 카테고리 알약(`text-[13px] font-semibold py-2 px-3.5`), 필터 드롭다운 및 결과 건수 텍스트(`text-sm`)를 스케일업했습니다.
   - `WatchlistScreen.tsx`: 헤더 타이틀을 `text-lg`에서 `text-xl font-extrabold`로, 서브텍스트 및 마감 임박 알림 배너를 `text-sm`으로 확대했습니다.
   - `MyScreen.tsx`: 3대 카드 섹션 헤더 타이틀을 `text-base`에서 `text-lg font-extrabold`로 키우고 아이콘(`text-[22px]`) 및 부가 뱃지 패딩을 조정했습니다.
   - `AuctionDetailScreen.tsx`: 상단 앱바 타이틀(`text-base font-extrabold`)과 물건 본문 제목(`text-xl` ➔ `text-2xl font-extrabold`), 카테고리 태그 및 주소(`text-sm`)를 모바일 화면에서 한눈에 들어오도록 확대했습니다.

### ✅ [17단계] 모바일 폴더블 모드 사이드 내비게이션 너비 확장 및 메뉴명 줄바꿈 방어 완료
1. **사이드 내비게이션 레일 너비 확장 ([AppNavigation.tsx](file:///d:/workspace/publicAuction/frontend/src/components/layout/AppNavigation.tsx))**:
   - 갤럭시 Z 폴드 펼침 모드 등 소형 태블릿/폴더블 뷰포트(`md`: 768px ~ 1023px)에서 사이드 내비게이션 레일(`<aside>`)의 너비를 기존 `md:w-20`(80px)에서 `md:w-28`(112px)로 확장하여 내부 가로 공간을 충분히 확보했습니다.
2. **메뉴 라벨 개행 방어 및 시각적 정렬 보강 ([AppNavigation.tsx](file:///d:/workspace/publicAuction/frontend/src/components/layout/AppNavigation.tsx))**:
   - 아이콘 하단의 메뉴 라벨에 `whitespace-nowrap break-keep text-center` 클래스를 적용하여 '공매목록', '관심공매', '마이페이지' 등 4~5글자의 한글 메뉴명이 줄바꿈(개행)되지 않고 한 줄로 균형 있게 표시되도록 개선했습니다.
   - 모바일 하단 탭 바(< 768px)의 메뉴 라벨에도 `whitespace-nowrap break-keep`를 적용하여 폴더블 접힘 모드 등 좁은 폭 기기에서도 줄바꿈이 발생하지 않도록 방어했습니다.

### ✅ [18단계] OpenAPI 조회 실패 시 Mockup-Data Fallback 제거 및 오류 안내 UI 적용 완료
1. **OpenAPI 서비스 계층 Mock Fallback 제거 ([onbidService.ts](file:///d:/workspace/publicAuction/frontend/src/services/onbidService.ts))**:
   - `MOCK_GONG_ITEMS` 의존성 및 `fallbackItems` 대체 로직을 전면 제거했습니다.
   - HTTP 오류, OpenAPI `resultCode !== '00'` 응답, 인증키 미설정, 네트워크 예외 발생 시 Mock 데이터를 반환하지 않고 구체적인 사유를 담은 `Error`를 throw 하도록 변경했습니다.
   - `fetchOnbidAllAssetsList`, `fetchOnbidItemsByManagementNo`, `fetchOnbidItemDetail` 역시 통신/응답 실패 시 예외를 전파하여 정상 0건 응답과 조회 오류를 명확히 구분합니다.
2. **전역 스토어 Mock 초기값 제거 및 오류 상태 추가 ([useAuctionStore.ts](file:///d:/workspace/publicAuction/frontend/src/store/useAuctionStore.ts))**:
   - `homeItems` 초기값을 `MOCK_GONG_ITEMS`에서 빈 배열 `[]`로 전환하고, `homeError: string | null` 및 `hasHomeFetched: boolean` 상태를 추가했습니다.
   - `fetchHomeData` 실패 시 기존 목록을 비우고 `homeError`에 오류 메시지를 기록하여 무한 재호출 없이 오류 화면이 표시되도록 처리했습니다.
3. **홈·목록·상세 화면 오류 메시지 및 재시도 UI 구현 ([HomeScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx), [AuctionListScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx), [AuctionDetailScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx))**:
   - 각 화면에서 OpenAPI 조회 실패 시 빈 상태("물건이 없습니다") 대신 **"데이터를 조회하는 데 오류가 발생했습니다."** 안내 카드(상세 오류 사유 포함)와 **[다시 시도]** 버튼을 표출하도록 구현했습니다.

### ✅ [19단계] 불필요한 Mockup-Data 삭제 및 데이터 파일명 리팩터링(`AuctionData.ts`) 완료
1. **더미 데이터(`MOCK_GONG_ITEMS`) 완전 삭제 ([AuctionData.ts](file:///d:/workspace/publicAuction/frontend/src/data/AuctionData.ts))**:
   - 더 이상 사용되지 않는 더미 공매 물건 배열(`MOCK_GONG_ITEMS`)을 완전히 삭제하고, 공매 타입 인터페이스·지역/카테고리 메타데이터 및 포맷 유틸리티만 남도록 정리했습니다.
2. **파일명 변경 및 전체 참조 경로 일괄 업데이트**:
   - `frontend/src/data/mockAuctionData.ts` 파일명을 **`frontend/src/data/AuctionData.ts`**로 변경했습니다.
   - `App.tsx`, `AuctionCard.tsx`, `HomeScreen.tsx`, `AuctionListScreen.tsx`, `AuctionDetailScreen.tsx`, `WatchlistScreen.tsx`, `onbidService.ts`, `storageService.ts`, `useAuctionStore.ts` 등 9개 파일의 import 경로를 모두 `AuctionData`로 일괄 수정했습니다.

### ✅ [20단계] 레이아웃 보존형 전역 모바일 폰트 스케일 상향 및 극소 폰트 제거 완료
1. **Tailwind CSS v4 `@theme` 전역 타이포그래피 스케일 상향 ([index.css](file:///d:/workspace/publicAuction/frontend/src/index.css))**:
   - `html` 루트 폰트 크기(16px)를 변경하지 않아 기존의 모든 `rem` 기반 레이아웃·여백·카드 크기를 100% 보존하면서, `@theme` 타이포그래피 변수(`--text-xs` 14px, `--text-sm` 16px, `--text-base` 18px, `--text-lg` 20px, `--text-xl` 22px, `--text-2xl` 26px)와 각 `line-height`를 일괄 +2px 상향했습니다.
2. **하드코딩된 9px ~ 11px 초소형 폰트 전면 제거 (9개 컴포넌트 파일, 총 69곳)**:
   - [HomeScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx), [AuctionListScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx), [AuctionDetailScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionDetailScreen.tsx), [WatchlistScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/watchlist/WatchlistScreen.tsx), [MyScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/my/MyScreen.tsx), [AppNavigation.tsx](file:///d:/workspace/publicAuction/frontend/src/components/layout/AppNavigation.tsx), [AuctionCard.tsx](file:///d:/workspace/publicAuction/frontend/src/components/common/AuctionCard.tsx), [PhotoGalleryModal.tsx](file:///d:/workspace/publicAuction/frontend/src/components/common/PhotoGalleryModal.tsx), [Toast.tsx](file:///d:/workspace/publicAuction/frontend/src/components/common/Toast.tsx)의 `text-[9px]`, `text-[10px]`를 `text-[12px]`로, `text-[11px]`를 `text-[13px]`로 상향하여 앱 전체 최소 폰트 크기를 12px 이상으로 보장했습니다.
3. **좁은 화면 줄바꿈 방어 보강 ([HomeScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/home/HomeScreen.tsx), [AuctionListScreen.tsx](file:///d:/workspace/publicAuction/frontend/src/pages/auction/AuctionListScreen.tsx))**:
   - 1차 상품군 4열 세그먼트 탭 버튼에 `whitespace-nowrap`과 반응형 폰트(`text-xs sm:text-sm`)를 적용해 360px 모바일 화면에서도 줄바꿈 없이 깔끔하게 표시되도록 조정했습니다.

---

## 🚀 5. 앞으로 남은 작업 로드맵 (Upcoming Roadmap)

사용자와 합의된 다음 우선순위 작업 로드맵입니다. **에이전트는 작업 전 반드시 사전 계획을 사용자에게 제시하고 승인을 득한 후 진행**해야 합니다.

### 🎯 [차기 작업 1순위] 상세 화면 UI/UX 고도화 (Stitch 디자인 반영)
- 가격 카드 절감 금액·비율 게이지 바, 공공데이터 출처 카드 등 Google Stitch `'공매이지 - 공매 물건 상세정보'`(`3c5d75841ea4462392f337c1aac35121`) 기반 잔여 UI/UX 고도화.

### 🎯 [2순위] 차기 버전(v2.0) Google Stitch 마이페이지 고도화 기능
- Google Stitch 프로젝트(`15839425802944736750` / 화면 `e2a6bbf276c74d65a2b1820c793d97a6`, 접속 설정 `.agents/mcp_config.json`)에 기획된 회원·인증 중심 확장 기능:
  - 프로필 카드 및 프로필 관리, 온비드(KAMCO) 실명·공동인증서 관리
  - 3열 자산 펄스 대시보드(관심물건·입찰참여·맞춤알림) 및 AI 권리분석 가이드 보관함
  - 나의 모의/실전 입찰 내역 조회, 로그아웃/회원탈퇴

### 🎯 [3순위] React Native 네이티브 앱 전환
- `storageService.ts` 어댑터를 `AsyncStorage` 또는 `MMKV`로 교체하고, UI 컴포넌트를 React Native 네이티브 컴포넌트(`<View>`, `<FlatList>` 등)로 이식.

---

## 🛠️ 6. 환경 변수 및 개발 환경 구동 가이드

### 1) 환경 변수 설정 (개발용 / 운영용 분리 관리)
Vite 모드(Mode)에 따라 실행 환경별 환경설정 파일이 자동으로 분기 로드됩니다:

- **개발 환경 (`frontend/.env.dev`)**:
  - `npm run dev` (`vite --mode dev`) 실행 시 자동 로드됩니다.
  - 온비드 개발용 Decoding 일반 인증키 및 Vite 프록시 경로(`/api/public-data`)가 기본 적용되어 있습니다.
  ```properties
  VITE_PUBLIC_DATA_API_KEY=cE+3z5vj6RfxuQ/YlUa7y1GvH2s4Qh8lW0xZ9+7jJ3k=
  VITE_API_BASE_URL=/api/public-data
  ```

- **운영 환경 (`frontend/.env.prod`)**:
  - `npm run build` (`tsc -b && vite build --mode prod`) 실행 시 자동 로드됩니다.
  - 실제 운영 배포 시 사용할 공공데이터포털 운영 인증키와 운영 Base URL을 기입합니다.
  ```properties
  # 운영용 온비드 일반 인증키 (추후 입력)
  VITE_PUBLIC_DATA_API_KEY=
  # 운영 배포 API Base URL (예: Nginx 리버스 프록시 /api/public-data 등)
  VITE_API_BASE_URL=
  ```

- **환경 변수 템플릿 (`frontend/.env.example`)**:
  - 신규 환경 세팅 및 인수인계를 위한 전체 환경변수 템플릿입니다.

### 2) 개발 서버 실행
```bash
cd frontend
npm run dev
# 기본 접속 주소: http://localhost:5173 (서버 구동 시 기본 브라우저가 자동으로 열립니다)
```

### 3) 프로덕션 빌드 무결성 검증 (필수)
```bash
cd c:\dev\workspace\publicAuction\frontend
npm run build
# tsc -b 및 vite build가 0 에러로 완료되어야 함
```

### 4) Git 작업 흐름 (사용자 수동 수행)
> ⚠️ **주의**: 에이전트는 커밋을 수행하지 않으므로 사용자가 직접 아래 명령어로 커밋/푸시합니다.
```bash
git status
git add .
git commit -m "feat: [작업 요약 내용 기술]"
git push origin main
```

---

## 💡 7. 다른 PC의 안티그래비티 에이전트 작업 시작 프롬프트 예시

새로운 PC에서 작업을 이어갈 때, 사용자가 아래와 같이 에이전트에게 지시하면 즉시 작업을 이어갈 수 있습니다:

> *"저장소 루트에 있는 `PROJECT_HANDOVER.md` 파일을 먼저 읽고, 프로젝트 전체 맥락과 에이전트 준수 규칙을 파악한 후 다음 우선순위 작업인 '상세 화면 기일 알림 영구화 및 온비드 입찰 연결 고도화'의 작업 계획을 한국어로 제시해줘."*

