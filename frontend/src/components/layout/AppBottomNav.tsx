export type AppTab = 'home' | 'list' | 'watchlist' | 'my'

interface AppBottomNavProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  watchlistCount?: number
}

/**
 * 반응형 앱 내비게이션 컴포넌트
 * - 모바일/폴더블 세로(< 768px): 하단 고정 탭 네비게이션 바 (전체 폭 유동 대응)
 * - 태블릿/대화면(>= 768px): 좌측 고정 사이드 내비게이션 레일(md: 아이콘 레일 / lg: 아이콘+라벨)
 */
export function AppBottomNav({ activeTab, onTabChange, watchlistCount = 0 }: AppBottomNavProps) {
  const tabs = [
    { id: 'home' as AppTab, label: '홈', icon: 'home' },
    { id: 'list' as AppTab, label: '공매목록', icon: 'view_list' },
    { id: 'watchlist' as AppTab, label: '관심공매', icon: 'favorite', badge: watchlistCount },
    { id: 'my' as AppTab, label: '마이페이지', icon: 'person' },
  ]

  return (
    <>
      {/* 1. 모바일 · 폴더블 펼침(< 768px) 하단 고정 탭 바 */}
      <nav
        aria-label="모바일 하단 내비게이션"
        className="md:hidden fixed bottom-0 left-0 right-0 w-full z-50 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white/92 backdrop-blur-xl border-t border-[#e2e8f0] shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
      >
        <div className="flex justify-around items-center h-16 px-2 sm:px-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const hasBadge = Boolean(tab.badge && tab.badge > 0)
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center h-12 gap-0.5 transition-all active:scale-95 cursor-pointer ${
                  isActive ? 'text-[#0051d5] font-bold' : 'text-[#74777f] hover:text-[#0b1c30]'
                }`}
              >
                <div className="relative">
                  <span
                    className={`material-symbols-outlined text-[24px] ${
                      isActive ? 'fill-1 text-[#0051d5]' : ''
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {hasBadge && (
                    <span className="absolute -top-1 -right-2 bg-[#ba1a1a] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-tight">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 2. 태블릿(>= 768px) 좌측 사이드 내비게이션 레일 */}
      <aside
        aria-label="태블릿 사이드 내비게이션"
        className="hidden md:flex md:w-20 lg:w-56 shrink-0 sticky top-0 h-screen bg-white/95 backdrop-blur-xl border-r border-[#e2e8f0] flex-col justify-between py-5 px-2.5 lg:px-4 z-30"
      >
        <div className="flex flex-col gap-6">
          {/* 브랜드 헤더 (md: 아이콘만 / lg: 로고+서비스명) */}
          <div className="flex items-center justify-center lg:justify-start gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#dce9ff] p-0.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              <img
                src="/gongmaeEasyIcon.png"
                alt="공매이지 앱 아이콘"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden lg:block min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-headline font-extrabold text-[#002046] tracking-tight">
                  공매이지
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5]">
                  온비드
                </span>
              </div>
              <p className="text-[10px] text-[#74777f] truncate">실시간 공공 공매</p>
            </div>
          </div>

          {/* 세로 내비게이션 메뉴 */}
          <nav className="flex flex-col gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const hasBadge = Boolean(tab.badge && tab.badge > 0)
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  title={tab.label}
                  className={`w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-1 lg:gap-2.5 px-2 lg:px-3.5 py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer ${
                    isActive
                      ? 'bg-[#eff4ff] text-[#0051d5] font-bold shadow-2xs'
                      : 'text-[#44474e] hover:bg-[#f8f9ff] hover:text-[#002046] font-medium'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-center gap-0.5 lg:gap-2.5">
                    <div className="relative">
                      <span
                        className={`material-symbols-outlined text-[22px] ${
                          isActive ? 'fill-1 text-[#0051d5]' : ''
                        }`}
                      >
                        {tab.icon}
                      </span>
                      {hasBadge && (
                        <span className="lg:hidden absolute -top-1 -right-2 bg-[#ba1a1a] text-white text-[9px] font-bold px-1 rounded-full ring-2 ring-white">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] lg:text-sm leading-tight">{tab.label}</span>
                  </div>
                  {hasBadge && (
                    <span className="hidden lg:inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#ba1a1a] text-white text-[11px] font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 하단 공공데이터 연동 배지 (lg 이상 표출) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] text-[11px] text-[#44474e]">
          <span className="material-symbols-outlined text-[16px] text-[#059669] shrink-0">
            verified
          </span>
          <span className="truncate font-medium">KAMCO 온비드 API 연동</span>
        </div>
      </aside>
    </>
  )
}

