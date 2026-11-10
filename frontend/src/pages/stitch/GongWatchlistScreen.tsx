import { type GongItem, formatWon } from '../../data/gongchajaData'

interface GongWatchlistScreenProps {
  items: GongItem[]
  watchlist: string[]
  onToggleWatchlist: (id: string) => void
  onSelectItem: (item: GongItem) => void
  onExplore: () => void
}

export function GongWatchlistScreen({
  items,
  watchlist,
  onToggleWatchlist,
  onSelectItem,
  onExplore,
}: GongWatchlistScreenProps) {
  const savedItems = items.filter((item) => watchlist.includes(item.id))

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-2">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#e5eeff]">
        <div>
          <h2 className="text-lg font-headline font-bold text-[#002046]">관심 공매 보관함</h2>
          <p className="text-xs text-[#74777f]">찜해둔 공매 물건의 기일 알림 및 상태 추적</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5]">
          {savedItems.length}건 보관
        </span>
      </div>

      {/* Items List */}
      {savedItems.length > 0 ? (
        <div className="flex flex-col gap-3">
          {savedItems.map((item) => (
            <article
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="bg-white rounded-2xl border border-[#e5eeff] p-3.5 flex gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer transition-all"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-[#ba1a1a] text-white text-[9px] font-bold">
                  D-{item.dDay}
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#0051d5] bg-[#eff4ff] px-1.5 py-0.2 rounded">
                      {item.auctionType}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleWatchlist(item.id)
                      }}
                      className="text-[#ba1a1a] p-1"
                      aria-label="관심 삭제"
                    >
                      <span className="material-symbols-outlined text-[18px] fill-1">favorite</span>
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-[#0b1c30] line-clamp-1 mt-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#74777f] line-clamp-1">{item.address}</p>
                </div>

                <div className="pt-2 border-t border-[#f8f9ff] flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-extrabold text-[#059669]">
                      -{item.discountRate}%
                    </span>
                    <span className="text-sm font-extrabold text-[#002046]">
                      {formatWon(item.minimumPrice)}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#74777f]">기일 {item.auctionDate.split(' ')[0]}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-[#74777f]">
          <span className="material-symbols-outlined text-[48px] text-[#c4c6cf] mb-2 block">
            favorite_border
          </span>
          <p className="text-base font-bold text-[#002046]">보관함이 비어 있습니다.</p>
          <p className="text-xs text-[#74777f] mt-1 mb-4">
            관심 있는 공매 물건의 하트를 눌러 여기에 저장하세요.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="px-5 py-2.5 rounded-xl bg-[#0051d5] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] transition-all"
          >
            공매 물건 둘러보기
          </button>
        </div>
      )}
    </div>
  )
}

