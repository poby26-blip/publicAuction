# 공매이지 (Public Auction 모바일 앱)

공공데이터 포털 및 한국자산관리공사(KAMCO) 온비드 기반의 공매 정보 탐색 모바일 하이브리드 애플리케이션 **'공매이지'** 프로젝트입니다.  
화면 기획 및 디자인은 **Google Stitch(구글 스티치)**를 사용하였으며, **MCP(Model Context Protocol)** 연동을 통해 AI 에이전트가 화면 컴포넌트 코드를 생성하고, **React + TypeScript + Vite + Tailwind CSS** 기반으로 구축되었습니다.

## 🎨 화면 기획 및 UI 생성 파이프라인
1. **Google Stitch**: 모바일 최적화 레이아웃(`max-w-md` = 448px 모바일 뷰포트) 및 UI/UX 인터랙션 기획·프로토타이핑
2. **MCP (Model Context Protocol) 연동**: 구글 스티치의 기획/디자인 스펙을 MCP를 통해 에이전트 환경으로 직접 연동하여 React 컴포넌트 자동 생성
3. **OpenAPI 실데이터 바인딩**: 캠코 차세대 온비드 OpenAPI(`B010003`) 실데이터 통신 및 상태 관리 연동

## 프로젝트 구조
```text
publicAuction/
├── frontend/          # React 기반 웹 프론트엔드 (모바일 하이브리드 UI)
├── PROJECT_HANDOVER.md # [필수] 프로젝트 인수인계 지침서 및 상세 개발 가이드
├── .gitignore         # 프로젝트 공통 Git 제외 설정
└── README.md          # 프로젝트 안내 문서
```

## 기술 스택 (Frontend)
- **프레임워크**: React 19 (with Vite 8)
- **언어**: TypeScript 7
- **스타일링**: Tailwind CSS v4, Material Symbols Outlined Icons
- **화면 설계 & UI 생성**: Google Stitch + MCP (Model Context Protocol)
- **버전 관리**: Git & GitHub

## 개발 환경 설정 및 구동 안내
- 환경설정 파일은 개발용([`frontend/.env.dev`](file:///d:/workspace/publicAuction/frontend/.env.dev))과 운영용([`frontend/.env.prod`](file:///d:/workspace/publicAuction/frontend/.env.prod))으로 분리 관리됩니다.
- 개발 서버 실행:
  ```bash
  cd frontend
  npm run dev
  # 서버 구동 시 브라우저가 자동으로 열립니다 (http://localhost:5173)
  ```
- 프로덕션 빌드 검증:
  ```bash
  npm run build
  ```
- 상세 인수인계 가이드 및 온비드 OpenAPI 연동 규격은 [`PROJECT_HANDOVER.md`](file:///d:/workspace/publicAuction/PROJECT_HANDOVER.md) 문서를 참고하십시오.
