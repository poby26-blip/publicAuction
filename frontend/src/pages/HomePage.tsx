import { ArrowRight, ChevronRight, Flame, Sparkles, TrendingUp } from 'lucide-react'
import { AuctionCard } from '../components/common/AuctionCard'
import { CATEGORIES } from '../data/mockAuctions'
import type { AuctionCategory, AuctionItem } from '../types/auction'

interface HomePageProps {
  auctions: AuctionItem[]
  bookmarks: string[]
  onToggleBookmark: (id: string) => void
  onSelectAuction: (item: AuctionItem) => void
  onSelectCategory: (category: AuctionCategory | 'all') => void
  onGoToList: () => void
}

export function HomePage({
  auctions,
  bookmarks,
  onToggleBookmark,
  onSelectAuction,
  onSelectCategory,
  onGoToList,
}: HomePageProps) {
  const urgentAuctions = auctions.filter((a) => a.dDay <= 5)
  const popularAuctions = [...auctions].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4)

  return (
    <div className="space-y-6 pb-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-5 shadow-sm">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-semibold text-blue-100 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>2026 대한민국 공공경매 모바일</span>
          </div>
          <h2 className="text-xl font-bold leading-tight">
            내 손안에서 확인하는<br />
            <span className="text-blue-200">법원 경매 & 온비드 공매</span>
          </h2>
          <p className="text-xs text-blue-100/90 mt-1.5 leading-relaxed">
            유찰된 알짜배기 부동산부터 동산까지 실시간 입찰 정보
          </p>
          <button
            onClick={onGoToList}
            type="button"
            className="mt-4 inline-flex items-center space-x-1.5 bg-white text-blue-700 font-bold text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-blue-50 active:scale-95 transition-all"
          >
            <span>전체 물건 둘러보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Decorative background element */}
        <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Categories Grid */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-bold text-slate-900">물건 카테고리</h3>
          <span className="text-xs text-slate-400">총 {auctions.length}건 진행중</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id as AuctionCategory)
                onGoToList()
              }}
              type="button"
              className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center hover:border-blue-500 hover:shadow-xs active:bg-blue-50/50 transition-all text-center"
            >
              <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {auctions.filter((a) => a.category === cat.id).length}건
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Urgent Auctions Section */}
      {urgentAuctions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-1.5">
              <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h3 className="text-base font-bold text-slate-900">마감 임박 경매</h3>
            </div>
            <button
              onClick={onGoToList}
              type="button"
              className="text-xs text-blue-600 font-semibold flex items-center hover:underline"
            >
              더보기 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4">
            {urgentAuctions.map((item) => (
              <AuctionCard
                key={item.id}
                item={item}
                isBookmarked={bookmarks.includes(item.id)}
                onToggleBookmark={onToggleBookmark}
                onClick={onSelectAuction}
              />
            ))}
          </div>
        </section>
      )}

      {/* Popular Ranking Section */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">실시간 인기 물건</h3>
          </div>
          <span className="text-xs text-slate-400">조회수 기준</span>
        </div>
        <div className="space-y-4">
          {popularAuctions.map((item) => (
            <AuctionCard
              key={item.id}
              item={item}
              isBookmarked={bookmarks.includes(item.id)}
              onToggleBookmark={onToggleBookmark}
              onClick={onSelectAuction}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

