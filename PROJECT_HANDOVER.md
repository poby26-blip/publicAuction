# 📋 [공매이지] 프로젝트 인수인계 및 에이전트 작업 지침서 (PROJECT_HANDOVER.md)

> **문서 버전**: v1.0.0  
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
  │   │   │   ├── common/       # Skeleton.tsx, AuctionCard.tsx 등 공통 컴포넌트
  │   │   │   └── layout/       # AppHeader.tsx, AppBottomNav.tsx 등 레이아웃
  │   │   ├── data/             # mockAuctionData.ts (표준 17개 시도 메타데이터 및 타입 정의)
  │   │   ├── pages/
  │   │   │   ├── home/         # HomeScreen.tsx (홈 화면)
  │   │   │   ├── auction/      # AuctionListScreen.tsx (목록), AuctionDetailScreen.tsx (상세)
  │   │   │   ├── watchlist/    # WatchlistScreen.tsx (관심물건 찜 목록)
  │   │   │   └── my/           # MyScreen.tsx (마이페이지)
  │   │   ├── services/         # onbidService.ts (KAMCO 차세대 온비드 OpenAPI 연동 파이프라인)
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

## 🚨 2. 에이전트 핵심 행동 수칙 (Agent Core Rules - 절대 규칙)

다른 PC의 Antigravity 에이전트는 작업을 시작할 때 **반드시 다음 5대 규칙을 엄격히 준수**해야 합니다:

1. **사전 계획 제시 및 사용자 승인 필수 (Work Protocol & Planning)**
   - 실제 파일 수정이나 코드 변경 작업에 착수하기 전에, **어떻게 작업을 진행할 것인지에 대한 구체적인 계획을 먼저 한국어로 제시**해야 합니다.
   - 제시한 계획에 대해 **사용자의 확인 및 승인을 받은 후에만** 다음 단계 작업을 진행합니다. 임의로 코드를 바로 수정하지 마십시오.
2. **Git 커밋 및 푸시 절대 금지 (No Git Commit/Push)**
   - 에이전트는 절대 `git commit`이나 `git push` 명령어를 직접 실행해서는 안 됩니다.
   - 작업 완료 후 **수정/생성된 파일 목록**과 **사용자가 직접 복사하여 실행할 수 있는 Git 명령어**를 안내하십시오.
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
| **부동산 목록 오퍼레이션** | `/B010003/OnbidRlstListSrvc2/getRlstCltrList2` ⚠️ *가이드 문서의 오탈자와 달리 숫자 `2`가 붙은 엔드포인트를 호출해야 정상 응답* |
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
- `App.tsx`, `HomeScreen.tsx`, `AuctionListScreen.tsx`, `AuctionDetailScreen.tsx`, `onbidService.ts`, `mockAuctionData.ts`, `Skeleton.tsx` 등 핵심 파일 전반에 상세한 한국어 JSDoc 주석 적용 완료.

---

## 🚀 5. 앞으로 남은 작업 로드맵 (Upcoming Roadmap)

사용자와 합의된 다음 우선순위 작업 로드맵입니다. **에이전트는 작업 전 반드시 사전 계획을 사용자에게 제시하고 승인을 득한 후 진행**해야 합니다.

### 🎯 [차기 작업 1순위] '관심물건(찜)' 기능 전용 개발
1. **`localStorage` 연동 영구 보관**:
   - 새로고침이나 브라우저 재시작 시에도 찜한 물건(`watchlist: string[]`)이 유지되도록 `localStorage` 동기화 훅 또는 이펙트 적용.
2. **관심물건 탭 화면 ([WatchlistScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/watchlist/WatchlistScreen.tsx)) 실데이터 연동**:
   - 현재 mock 기반으로 되어 있는 관심물건 탭을 실제 찜한 온비드 물건 실데이터 목록으로 렌더링.
   - 찜한 물건이 0건일 때 '관심 등록한 공매 물건이 없습니다' 및 '공매 물건 보러가기' 버튼을 제공하는 빈 상태(Empty State) UI 완성.
   - 관심물건 목록 내에서 하트 토글 시 즉시 목록에서 제거 및 상위 뱃지 카운트 실시간 갱신.
3. **홈 / 목록 / 상세 화면 간 하트(관심물건) 실시간 상태 동기화 검증**:
   - 어느 화면에서 하트를 누르든 헤더의 알림/찜 카운트와 하단 네비게이션 뱃지가 즉각 동기화되는지 확인.

### 🎯 [2순위] 마이페이지 ([MyScreen.tsx](file:///c:/dev/workspace/publicAuction/frontend/src/pages/my/MyScreen.tsx)) 개발
- 사용자 프로필 영역, 관심 공매 요약, 최근 본 물건 이력(선택적), 온비드 공매 이용 안내 FAQ 등 화면 구성.

### 🎯 [3순위] 기일 알림 및 온비드 전자입찰 부가 기능 고도화
- 상세 화면의 '기일 알림' 로컬 알림 상태 영구 저장.
- '온비드 입찰 참여하기' 클릭 시 실제 캠코 온비드 해당 물건 상세 페이지 웹 링크(`www.onbid.co.kr`) 연결 지원.

---

## 🛠️ 6. 개발 환경 구동 및 검증 가이드

### 1) 환경 변수 설정 (`frontend/.env`)
```properties
# 공공데이터포털(data.go.kr) 한국자산관리공사 차세대 온비드 일반 인증키 (Decoding 키)
VITE_PUBLIC_DATA_API_KEY=cE+3z5vj6RfxuQ/YlUa7y1GvH2s4Qh8lW0xZ9+7jJ3k=
VITE_API_BASE_URL=/api/public-data
```

### 2) 개발 서버 실행
```bash
cd c:\dev\workspace\publicAuction\frontend
npm run dev
# 기본 접속 주소: http://localhost:5173
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

> *"저장소 루트에 있는 `PROJECT_HANDOVER.md` 파일을 먼저 읽고, 프로젝트 전체 맥락과 에이전트 준수 규칙을 파악한 후 다음 우선순위 작업인 '관심물건(찜) 기능 전용 개발'의 작업 계획을 한국어로 제시해줘."*

