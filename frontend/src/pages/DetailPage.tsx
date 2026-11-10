import {
  Bell,
  Calendar,
  ChevronLeft,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '../data/mockAuctions'
import type { AuctionItem } from '../types/auction'

interface DetailPageProps {
  item: AuctionItem
  isBookmarked: boolean
  onToggleBookmark: (id: string) => void
  onBack: () => void
}

export function DetailPage({ item, isBookmarked, onToggleBookmark, onBack }: DetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [hasAlert, setHasAlert] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `[공공경매] ${item.caseNumber} ${item.title} - 최저가 ${formatPrice(item.minimumPrice)}`,
          url: window.location.href,
        })
      } catch {}
    } else {
      alert('물건 주소가 클립보드에 복사되었습니다.')
    }
  }

  return (
    <div className="pb-24 -mx-4 -mt-3">
      {/* Top Floating App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <button
          onClick={onBack}
          type="button"
          className="p-1.5 -ml-1.5 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[200px]">
          {item.caseNumber}
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleShare}
            type="button"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"
            aria-label="공유하기"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleBookmark(item.id)}
            type="button"
            className={`p-2 rounded-full transition-colors ${
              isBookmarked ? 'text-rose-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="관심등록"
          >
            <Heart className={`w-5 h-5 ${isBookmarked ? 'fill-rose-500 stroke-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-slate-900 aspect-4/3">
        <img
          src={item.images[selectedImage] || item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
            D-{item.dDay}
          </span>
          {item.failCount > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
              {item.failCount}회 유찰
            </span>
          )}
        </div>
        {item.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-xs">
            {selectedImage + 1} / {item.images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Bar */}
      {item.images.length > 1 && (
        <div className="flex space-x-2 p-3 bg-slate-100 overflow-x-auto">
          {item.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                selectedImage === idx ? 'border-blue-600 scale-95' : 'border-transparent opacity-70'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main Details Body */}
      <div className="p-4 space-y-6">
        {/* Title and Address */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 mb-1">
            <span>{item.court}</span>
            <span>·</span>
            <span>{item.department}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-snug mb-2">{item.title}</h2>
          <p className="text-xs text-slate-500 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
            {item.address}
          </p>
        </div>

        {/* Pricing Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-baseline justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs text-slate-500 font-medium">최저입찰가</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-2xl font-black text-rose-600">{item.bidRate}%</span>
                <span className="text-2xl font-black text-slate-950">
                  {formatPrice(item.minimumPrice)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">감정평가액</span>
              <p className="text-sm font-semibold text-slate-500 line-through">
                {formatPrice(item.appraisalPrice)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-slate-500">입찰보증금 (10%)</span>
              <span className="font-bold text-slate-800">{formatPrice(item.bidDeposit)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-slate-500">유찰 횟수</span>
              <span className="font-bold text-rose-600">{item.failCount}회</span>
            </div>
          </div>
        </div>

        {/* Auction Schedule & Location */}
        <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
            매각기일 안내
          </h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">매각일시</span>
              <span className="font-semibold text-slate-800">{item.auctionDate} (오전 10:00)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">진행장소</span>
              <span className="font-semibold text-slate-800">{item.court} 경매법정</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">물건용도 / 면적</span>
              <span className="font-semibold text-slate-800">{item.area}</span>
            </div>
          </div>
        </div>

        {/* Rights & Safety Notice */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-blue-950 mb-1">권리분석 안전 체크리스트</h4>
              <p className="text-blue-800/90 leading-relaxed">
                해당 물건은 말소기준권리 이후 근저당 및 가압류가 모두 소멸되는 안전 대상입니다. 입찰 전 매각물건명세서를 반드시 재확인하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex items-center space-x-3 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => {
            setHasAlert(!hasAlert)
            alert(hasAlert ? '기일 알림이 해제되었습니다.' : '매각기일 전일 알림이 등록되었습니다!')
          }}
          type="button"
          className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            hasAlert
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bell className={`w-4 h-4 mb-0.5 ${hasAlert ? 'fill-blue-600' : ''}`} />
          <span>기일알림</span>
        </button>

        <button
          onClick={() => alert('공공경매 모바일 입찰 안내서 및 준비물 체크리스트가 다운로드됩니다.')}
          type="button"
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm transition-all"
        >
          입찰 준비 및 가이드 확인
        </button>
      </div>
    </div>
  )
}

