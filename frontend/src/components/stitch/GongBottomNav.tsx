export type GongTab = 'home' | 'list' | 'watchlist' | 'my'

interface GongBottomNavProps {
  activeTab: GongTab
  onTabChange: (tab: GongTab) => void
  watchlistCount?: number
}

export function GongBottomNav({ activeTab, onTabChange, watchlistCount = 0 }: GongBottomNavProps) {
  const tabs = [
    { id: 'home' as GongTab, label: '홈', icon: 'home' },
    { id: 'list' as GongTab, label: '공매목록', icon: 'view_list' },
    { id: 'watchlist' as GongTab, label: '관심공매', icon: 'favorite', badge: watchlistCount },
    { id: 'my' as GongTab, label: '마이페이지', icon: 'person' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white/92 backdrop-blur-xl border-t border-[#e2e8f0] shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center h-12 gap-0.5 transition-all active:scale-95 ${
                isActive ? 'text-[#0051d5] font-bold' : 'text-[#74777f] hover:text-[#0b1c30]'
              }`}
            >
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1 text-[#0051d5]' : ''}`}
                >
                  {tab.icon}
                </span>
                {Boolean(tab.badge && tab.badge > 0) && (
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
  )
}

