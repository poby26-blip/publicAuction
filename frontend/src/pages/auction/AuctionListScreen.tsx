import { useState } from 'react'
import {
  GONG_CATEGORIES,
  GONG_REGIONS,
  type GongItem,
  formatWon,
} from '../../data/mockAuctionData'

interface AuctionListScreenProps {
  items: GongItem[]
  watchlist: string[]
  onToggleWatchlist: (id: string) => void
  onSelectItem: (item: GongItem) => void
  initialCategory?: string
  initialRegion?: string
}

export function AuctionListScreen({
  items,
  watchlist,
  onToggleWatchlist,
  onSelectItem,
  initialCategory,
  initialRegion = '전체',
}: AuctionListScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all')
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'dDay' | 'discount' | 'price' | 'views'>('dDay')
  const [keyword, setKeyword] = useState<string>('')

  const auctionTypes = ['all', '신탁공매', '압류재산', '국유재산']

  const filtered = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
    if (selectedType !== 'all' && item.auctionType !== selectedType) return false
    if (selectedRegion !== '전체' && !item.address.includes(selectedRegion)) return false
    if (keyword.trim()) {
      const q = keyword.toLowerCase()
      return item.title.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dDay') return a.dDay - b.dDay
    if (sortBy === 'discount') return b.discountRate - a.discountRate
    if (sortBy === 'price') return a.minimumPrice - b.minimumPrice
    if (sortBy === 'views') return b.viewCount - a.viewCount
    return 0
  })

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-2">
      {/* Search Input */}
      <div className="relative">
        <span className="material-symbols-outlined text-[20px] text-[#74777f] absolute left-3.5 top-1/2 -translate-y-1/2">
          search
        </span>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="공매 물건 검색 (예: 잠실, 오피스텔)"
          className="w-full h-11 bg-white rounded-2xl pl-10 pr-9 text-xs text-[#0b1c30] placeholder-[#74777f] border border-[#c4c6cf]/60 focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Category Pills Scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#002046] text-white'
              : 'bg-white border border-[#c4c6cf]/50 text-[#44474e]'
          }`}
        >
          전체 보기
        </button>
        {GONG_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-[#002046] text-white'
                  : 'bg-white border border-[#c4c6cf]/50 text-[#44474e]'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Type & Sort Bar */}
      <div className="flex items-center justify-between py-2 border-y border-[#e5eeff] text-xs gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-[#eff4ff] text-[#0051d5] font-bold text-[11px] px-2 py-1 rounded-md border-none focus:outline-none cursor-pointer"
          >
            {GONG_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r === '전체' ? '전국' : r}
              </option>
            ))}
          </select>
          {auctionTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                selectedType === t
                  ? 'bg-[#eff4ff] text-[#0051d5]'
                  : 'text-[#74777f] hover:text-[#0b1c30]'
              }`}
            >
              {t === 'all' ? '구분전체' : t}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-transparent text-[11px] font-semibold text-[#002046] border-none focus:outline-none cursor-pointer shrink-0"
        >
          <option value="dDay">마감임박순</option>
          <option value="discount">할인율높은순</option>
          <option value="price">최저입찰가순</option>
          <option value="views">인기순</option>
        </select>
      </div>

      {/* Result Count */}
      <div className="flex items-center justify-between text-xs text-[#74777f] px-1">
        <span>
          총 <strong className="text-[#002046]">{sorted.length}</strong>개의 공매 물건
        </span>
        {selectedRegion !== '전체' && (
          <span className="text-[#0051d5] font-semibold">[{selectedRegion}] 필터 적용중</span>
        )}
      </div>

      {/* Card List */}
      {sorted.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {sorted.map((item) => {
            const isSaved = watchlist.includes(item.id)
            return (
              <article
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-2xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer flex flex-col"
              >
                <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white">
                      D-{item.dDay}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                      {item.auctionType}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleWatchlist(item.id)
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#44474e] hover:text-[#ba1a1a]"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isSaved ? 'text-[#ba1a1a] fill-1' : ''
                      }`}
                    >
                      favorite
                    </span>
                  </button>
                  <div className="absolute bottom-2 left-2.5">
                    <span className="text-[10px] font-semibold bg-white/90 text-[#0b1c30] px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {item.area}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#0b1c30] line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-[#74777f] line-clamp-1 mt-0.5">{item.address}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#f8f9ff] flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-[#059669]">
                          {item.discountRate}% 할인
                        </span>
                        <span className="text-lg font-black text-[#002046]">
                          {formatWon(item.minimumPrice)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#74777f] line-through">
                        감정가 {formatWon(item.appraisalPrice)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#74777f] block">
                        {item.failCount > 0 ? `${item.failCount}회 유찰` : '신규공매'}
                      </span>
                      <span className="text-xs font-semibold text-[#0051d5]">
                        입찰기일 {item.auctionDate.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-[#74777f]">
          <span className="material-symbols-outlined text-[40px] text-[#c4c6cf] mb-2 block">
            search_off
          </span>
          <p className="text-sm font-bold text-[#0b1c30]">검색 조건에 맞는 물건이 없습니다.</p>
          <p className="text-xs text-[#74777f] mt-1">카테고리나 필터를 변경해 보세요.</p>
        </div>
      )}
    </div>
  )
}
