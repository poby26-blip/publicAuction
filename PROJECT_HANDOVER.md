# 📋 [공매이지] 프로젝트 인수인계 및 에이전트 작업 지침서 (PROJECT_HANDOVER.md)

> **문서 버전**: v1.3.0  
> **최종 갱신일**: 2026년 11월 12일  
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
  │   │   │   ├── common/       # Skeleton.tsx, AuctionCard.tsx, Toast.tsx 등 공통 컴포넌트
  │   │   │   └── layout/       # AppHeader.tsx, AppBottomNav.tsx 등 레이아웃
  │   │   ├── data/             # mockAuctionData.ts (표준 17개 시도 메타데이터 및 타입 정의)
  │   │   ├── pages/
  │   │   │   ├── home/         # HomeScreen.tsx (홈 화면)
  │   │   │   ├── auction/      # AuctionListScreen.tsx (목록), AuctionDetailScreen.tsx (상세)
  │   │   │   ├── watchlist/    # WatchlistScreen.tsx (관심물건 찜 목록)
  │   │   │   └── my/           # MyScreen.tsx (마이페이지)
  │   │   ├── services/         # onbidService.ts (온비드 API), storageService.ts (RN 호환 로컬 스토리지 추상화)
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

## 🚀 5. 앞으로 남은 작업 로드맵 (Upcoming Roadmap)

사용자와 합의된 다음 우선순위 작업 로드맵입니다. **에이전트는 작업 전 반드시 사전 계획을 사용자에게 제시하고 승인을 득한 후 진행**해야 합니다.

### 🎯 [차기 작업 1순위] 기일 알림 영구화 및 온비드 전자입찰 부가 기능 고도화
- 상세 화면의 '기일 알림' 상태를 `storageService`와 연동하여 영구 저장.
- '온비드 입찰 참여하기' 클릭 시 실제 캠코 온비드 해당 물건 상세 페이지 웹 링크(`www.onbid.co.kr`) 연결 지원.

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

