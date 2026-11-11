interface AppHeaderProps {
  onSearchClick?: () => void
  onAlarmClick?: () => void
  alarmCount?: number
}

export function AppHeader({ onSearchClick, onAlarmClick, alarmCount = 2 }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#f8f9ff]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[#e5eeff]">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-[#002046] flex items-center justify-center text-white font-headline font-extrabold text-sm shadow-xs">
          공
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

      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={onSearchClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#44474e] hover:bg-[#e5eeff] active:scale-95 transition-all"
          aria-label="검색"
        >
          <span className="material-symbols-outlined text-[22px]">search</span>
        </button>
        <button
          type="button"
          onClick={onAlarmClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#44474e] hover:bg-[#e5eeff] active:scale-95 transition-all relative"
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

