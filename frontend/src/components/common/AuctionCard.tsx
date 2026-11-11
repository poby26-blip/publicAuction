import { Calendar, Eye, Heart, MapPin } from 'lucide-react'
import { formatPrice } from '../../data/mockAuctionData'
import type { AuctionItem } from '../../types/auction'

interface AuctionCardProps {
  item: AuctionItem
  isBookmarked: boolean
  onToggleBookmark: (id: string) => void
  onClick: (item: AuctionItem) => void
}

export function AuctionCard({ item, isBookmarked, onToggleBookmark, onClick }: AuctionCardProps) {
  return (
    <div
      onClick={() => onClick(item)}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col"
    >
      {/* Thumbnail with overlay badges */}
      <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* D-Day Badge */}
        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
            D-{item.dDay}
          </span>
          {item.failCount > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-900/75 text-white backdrop-blur-xs">
              {item.failCount}회 유찰
            </span>
          )}
        </div>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleBookmark(item.id)
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isBookmarked
              ? 'bg-rose-50 text-rose-600 shadow-sm'
              : 'bg-black/30 text-white hover:bg-black/40'
          }`}
          aria-label="관심물건 등록"
        >
          <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-500 stroke-rose-500' : ''}`} />
        </button>

        {/* Category Label */}
        <div className="absolute bottom-2.5 left-3">
          <span className="text-[11px] font-medium bg-white/90 text-slate-800 px-2 py-0.5 rounded-md backdrop-blur-xs">
            {item.categoryLabel} · {item.area}
          </span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Court & Case Number */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>{item.court}</span>
            <span className="font-mono text-slate-600">{item.caseNumber}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1 leading-snug">
            {item.title}
          </h3>

          {/* Address */}
          <p className="text-xs text-slate-500 flex items-center mb-3 line-clamp-1">
            <MapPin className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
            {item.address}
          </p>
        </div>

        {/* Pricing Info */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm font-extrabold text-rose-600">{item.bidRate}%</span>
              <span className="text-lg font-extrabold text-slate-950">
                {formatPrice(item.minimumPrice)}
              </span>
            </div>
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(item.appraisalPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              매각기일 {item.auctionDate}
            </span>
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {item.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

