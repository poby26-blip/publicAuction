import { Filter, Search, X } from 'lucide-react'
import { useState } from 'react'
import { AuctionCard } from '../components/common/AuctionCard'
import { CATEGORIES } from '../data/mockAuctions'
import type { AuctionCategory, AuctionItem } from '../types/auction'

interface ListPageProps {
  auctions: AuctionItem[]
  bookmarks: string[]
  onToggleBookmark: (id: string) => void
  onSelectAuction: (item: AuctionItem) => void
  selectedCategory: AuctionCategory | 'all'
  onSelectCategory: (category: AuctionCategory | 'all') => void
}

export function ListPage({
  auctions,
  bookmarks,
  onToggleBookmark,
  onSelectAuction,
  selectedCategory,
  onSelectCategory,
}: ListPageProps) {
  const [keyword, setKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState<'dDay' | 'priceAsc' | 'views'>('dDay')
  const [minFails, setMinFails] = useState<number>(0)

  // Filtering
  const filtered = auctions.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false
    }
    if (item.failCount < minFails) {
      return false
    }
    if (keyword.trim()) {
      const q = keyword.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.caseNumber.toLowerCase().includes(q) ||
        item.court.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'dDay') return a.dDay - b.dDay
    if (sortOrder === 'priceAsc') return a.minimumPrice - b.minimumPrice
    if (sortOrder === 'views') return b.viewCount - a.viewCount
    return 0
  })

  return (
    <div className="space-y-4 pb-6">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="사건번호, 아파트명, 지역 검색..."
          className="w-full bg-slate-100 rounded-2xl pl-10 pr-9 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
        />
        {keyword && (
          <button
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Category Scroll */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as AuctionCategory | 'all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">{sorted.length}건</span>
          <span>검색됨</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Failed count filter */}
          <select
            value={minFails}
            onChange={(e) => setMinFails(Number(e.target.value))}
            className="bg-transparent text-xs font-medium text-slate-700 py-1 pr-1 border-none focus:outline-none cursor-pointer"
          >
            <option value={0}>유찰 전체</option>
            <option value={1}>1회 이상 유찰</option>
            <option value={2}>2회 이상 유찰</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-transparent text-xs font-medium text-slate-700 py-1 pr-1 border-none focus:outline-none cursor-pointer"
          >
            <option value="dDay">마감임박순</option>
            <option value="priceAsc">최저가순</option>
            <option value="views">인기순</option>
          </select>
        </div>
      </div>

      {/* Auction Card List */}
      {sorted.length > 0 ? (
        <div className="space-y-4">
          {sorted.map((item) => (
            <AuctionCard
              key={item.id}
              item={item}
              isBookmarked={bookmarks.includes(item.id)}
              onToggleBookmark={onToggleBookmark}
              onClick={onSelectAuction}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400">
          <p className="text-sm font-semibold text-slate-600 mb-1">조건에 맞는 물건이 없습니다.</p>
          <p className="text-xs">다른 검색어나 카테고리 필터를 적용해 보세요.</p>
        </div>
      )}
    </div>
  )
}

