import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  title?: string
  showSearch?: boolean
  onSearchClick?: () => void
}

export function Header({ title = '공공경매', showSearch = true, onSearchClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          경
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">{title}</h1>
          <p className="text-[10px] text-slate-400 font-medium">대법원 경매 & 온비드 공매</p>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        {showSearch && (
          <button
            onClick={onSearchClick}
            type="button"
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="검색"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full relative transition-colors"
          aria-label="알림"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  )
}

