/**
 * @file AppHeader.tsx
 * @description '공매이지' 앱의 상단 고정 네비게이션 헤더 컴포넌트입니다.
 */

import { type AppTab } from './AppBottomNav'

interface AppHeaderProps {
  /** 현재 활성화된 탭 (태블릿 사이드 레일 노출 시 현재 화면 제목 표출용) */
  activeTab?: AppTab

  /** 우측 돋보기 검색 아이콘 클릭 콜백 */
  onSearchClick?: () => void

  /** 우측 종 모양 알림 아이콘 클릭 콜백 */
  onAlarmClick?: () => void

  /** 마감 임박 관심 물건 등의 미확인 알림 건수 (0이면 뱃지 숨김) */
  alarmCount?: number
}

const TAB_HEADER_TITLES: Record<AppTab, { title: string; subtitle: string }> = {
  home: { title: '실시간 공매 탐색', subtitle: '한국자산관리공사 온비드 공공데이터 연동' },
  list: { title: '공매 물건 전체 목록', subtitle: '부동산 · 동산 · 자동차 조건별 통합 검색' },
  watchlist: { title: '관심 공매 보관함', subtitle: '찜한 물건 입찰 기일 및 알림 관리' },
  my: { title: '마이페이지 · 앱 설정', subtitle: '입찰 푸시 알림 및 OpenAPI 동기화 관리' },
}

export function AppHeader({
  activeTab = 'home',
  onSearchClick,
  onAlarmClick,
  alarmCount = 0,
}: AppHeaderProps) {
  const tabMeta = TAB_HEADER_TITLES[activeTab]

  return (
    <header className="sticky top-0 z-40 bg-[#f8f9ff]/90 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between border-b border-[#e5eeff]">
      {/* 모바일/폴더블(< 768px): 브랜드 로고 헤더 */}
      <div className="flex md:hidden items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-white border border-[#dce9ff] p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
          <img
            src="/gongmaeEasyIcon.png"
            alt="공매이지 앱 아이콘"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="text-base font-headline font-extrabold text-[#002046] tracking-tight">
              공매이지
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5]">
              온비드
            </span>
          </div>
          <p className="text-[10px] text-[#74777f]">공공데이터 기반 실시간 공매</p>
        </div>
      </div>

      {/* 태블릿(>= 768px): 좌측 사이드 레일이 브랜드를 담당하므로 상단에는 현재 화면 컨텍스트 표출 */}
      <div className="hidden md:block">
        <h1 className="text-base font-headline font-extrabold text-[#002046] tracking-tight">
          {tabMeta.title}
        </h1>
        <p className="text-[11px] text-[#74777f]">{tabMeta.subtitle}</p>
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={onSearchClick}
          className="h-9 w-9 md:w-auto md:px-3 rounded-full md:rounded-xl flex items-center justify-center gap-1.5 text-[#44474e] md:bg-white md:border md:border-[#dce9ff] hover:bg-[#e5eeff] active:scale-95 transition-all cursor-pointer"
          aria-label="검색"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          <span className="hidden md:inline text-xs font-semibold text-[#44474e]">
            전체 목록 검색
          </span>
        </button>
        <button
          type="button"
          onClick={onAlarmClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#44474e] hover:bg-[#e5eeff] active:scale-95 transition-all relative cursor-pointer"
          aria-label="알림"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {alarmCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
          )}
        </button>
      </div>
    </header>
  )
}

