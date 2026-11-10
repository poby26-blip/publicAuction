import { Heart, Home, Search, User } from 'lucide-react'

export type TabType = 'home' | 'list' | 'bookmark' | 'my'

interface BottomNavProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  bookmarkCount?: number
}

export function BottomNav({ currentTab, onTabChange, bookmarkCount = 0 }: BottomNavProps) {
  const tabs = [
    { id: 'home' as TabType, label: '홈', icon: Home },
    { id: 'list' as TabType, label: '물건검색', icon: Search },
    { id: 'bookmark' as TabType, label: '관심물건', icon: Heart, badge: bookmarkCount },
    { id: 'my' as TabType, label: 'MY경매', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center z-30 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = currentTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1 flex flex-col items-center justify-center relative transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

