import { useState } from 'react'
import { type GongItem, formatWon } from '../../data/mockAuctionData'

interface AuctionDetailScreenProps {
  item: GongItem
  isSaved: boolean
  onToggleWatchlist: (id: string) => void
  onBack: () => void
}

export function AuctionDetailScreen({
  item,
  isSaved,
  onToggleWatchlist,
  onBack,
}: AuctionDetailScreenProps) {
  const [selectedImg, setSelectedImg] = useState(0)
  const [hasAlert, setHasAlert] = useState(false)

  const deposit = Math.floor(item.minimumPrice * 0.1)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[공매이지] ${item.title}`,
          text: `온비드 공매 최저가 ${formatWon(item.minimumPrice)} (${item.discountRate}% 할인)`,
          url: window.location.href,
        })
      } catch {}
    } else {
      alert('물건 정보가 클립보드에 복사되었습니다.')
    }
  }

  return (
    <div className="pb-28 -mx-4 -mt-3">
      {/* Top Floating App Bar */}
      <div className="sticky top-0 z-40 bg-[#f8f9ff]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[#e5eeff]">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#002046] hover:bg-[#e5eeff] transition-colors"
          aria-label="뒤로가기"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <span className="text-sm font-bold text-[#002046] line-clamp-1 max-w-[200px]">
          {item.title}
        </span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#44474e] hover:bg-[#e5eeff]"
            aria-label="공유"
          >
            <span className="material-symbols-outlined text-[22px]">share</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleWatchlist(item.id)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#44474e] hover:bg-[#e5eeff]"
            aria-label="관심등록"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                isSaved ? 'text-[#ba1a1a] fill-1' : ''
              }`}
            >
              favorite
            </span>
          </button>
        </div>
      </div>

      {/* Main Image Slider */}
      <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
        <img
          src={item.images[selectedImg] || item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ba1a1a] text-white">
            D-{item.dDay}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-xs">
            {item.auctionType}
          </span>
        </div>
        {item.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-xs">
            {selectedImg + 1} / {item.images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {item.images.length > 1 && (
        <div className="flex gap-2 p-3 bg-white border-b border-[#e5eeff] overflow-x-auto no-scrollbar">
          {item.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImg(idx)}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                selectedImg === idx ? 'border-[#0051d5] scale-95' : 'border-transparent opacity-60'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Content Details */}
      <div className="p-4 flex flex-col gap-5">
        {/* Title and Address */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0051d5] mb-1">
            <span>한국자산관리공사 온비드</span>
            <span>·</span>
            <span>{item.auctionType}</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-[#002046] leading-snug">
            {item.title}
          </h2>
          <p className="text-xs text-[#74777f] flex items-center mt-1.5">
            <span className="material-symbols-outlined text-[16px] mr-1 text-[#74777f]">
              location_on
            </span>
            {item.address}
          </p>
        </div>

        {/* Pricing Box */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#eff4ff]">
            <div>
              <span className="text-xs text-[#74777f] font-medium">최저입찰가</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-[#059669]">
                  {item.discountRate}%
                </span>
                <span className="text-2xl font-black text-[#002046]">
                  {formatWon(item.minimumPrice)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#74777f]">감정평가액</span>
              <p className="text-sm font-semibold text-[#74777f] line-through">
                {formatWon(item.appraisalPrice)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-[#eff4ff] rounded-xl">
              <span className="text-[#44474e] block text-[11px]">입찰보증금 (10%)</span>
              <strong className="text-sm font-bold text-[#002046] mt-0.5 block">
                {formatWon(deposit)}
              </strong>
            </div>
            <div className="p-3 bg-[#eff4ff] rounded-xl">
              <span className="text-[#44474e] block text-[11px]">유찰 이력</span>
              <strong className="text-sm font-bold text-[#ba1a1a] mt-0.5 block">
                {item.failCount > 0 ? `${item.failCount}회 유찰` : '신규공매'}
              </strong>
            </div>
          </div>
        </div>

        {/* Auction Schedule */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-2.5">
          <h3 className="text-sm font-headline font-bold text-[#002046] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#0051d5]">event</span>
            온비드 입찰일정 및 정보
          </h3>
          <div className="space-y-2 text-xs text-[#44474e]">
            <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
              <span className="text-[#74777f]">입찰기간</span>
              <strong className="text-[#0b1c30]">{item.auctionDate}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f8f9ff]">
              <span className="text-[#74777f]">물건면적/제원</span>
              <strong className="text-[#0b1c30]">{item.area}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#74777f]">입찰방식</span>
              <strong className="text-[#0051d5]">온비드 전자입찰 (인터넷)</strong>
            </div>
          </div>
        </div>

        {/* Rights Check Banner */}
        <div className="bg-[#eff4ff] border border-[#dce9ff] rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-[#0051d5] shrink-0 mt-0.5">
              security
            </span>
            <div className="text-xs">
              <h4 className="font-bold text-[#002046] mb-0.5">공매이지 권리분석 체크</h4>
              <p className="text-[#44474e] leading-relaxed">
                해당 공매 자산은 캠코 온비드 검증을 거친 물건입니다. 입찰 참여 전 등기부등본 및 감정평가서를 반드시 최종 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-[#e2e8f0] p-3 flex items-center gap-3 z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
        <button
          type="button"
          onClick={() => {
            setHasAlert(!hasAlert)
            alert(hasAlert ? '알림이 해제되었습니다.' : '입찰 마감일 알림이 설정되었습니다!')
          }}
          className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
            hasAlert
              ? 'border-[#0051d5] bg-[#eff4ff] text-[#0051d5]'
              : 'border-[#c4c6cf]/60 text-[#44474e] hover:bg-slate-50'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              hasAlert ? 'text-[#0051d5] fill-1' : ''
            }`}
          >
            notifications
          </span>
          <span className="text-[10px] mt-0.5">기일알림</span>
        </button>

        <button
          type="button"
          onClick={() =>
            alert(
              `[온비드 바로가기]\n${item.title}\n최저입찰가: ${formatWon(
                item.minimumPrice
              )}\n캠코 온비드 전자입찰 사이트로 이동합니다.`
            )
          }
          className="flex-1 bg-[#0051d5] hover:bg-[#003ea8] active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-1.5"
        >
          <span>온비드 입찰 참여하기</span>
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </button>
      </div>
    </div>
  )
}

