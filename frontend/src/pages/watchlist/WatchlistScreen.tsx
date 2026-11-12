/**
 * @file WatchlistScreen.tsx
 * @description '공매이지' 앱의 관심 공매 보관함(찜 목록) 화면 컴포넌트입니다.
 * 
 * [주요 기능]
 * 1. storageService를 통해 영구 보관된 공매 실데이터 목록 표출 (목록·차량·타지역 찜 모두 포함)
 * 2. 최신등록순 / 마감임박순 실시간 정렬 토글 및 마감 임박 물건 주의 배너
 * 3. 개별 관심 해제 및 전체 비우기(안전 확인) 관리 기능
 * 4. 이미지 로드 실패 Fallback 및 D-Day('오늘 마감', '상시 매각') 방어 표출
 */

import { useState } from 'react'
import {
  type GongItem,
  formatWon,
  getCategoryFallbackImage,
} from '../../data/mockAuctionData'

/**
 * WatchlistScreen 컴포넌트의 Props 인터페이스
 */
interface WatchlistScreenProps {
  /** 보관함에 저장된 공매 물건 실데이터 배열 */
  items: GongItem[]

  /** 관심 등록(찜)된 물건 ID 배열 */
  watchlist: string[]

  /** 개별 물건 관심 등록 토글(삭제) 콜백 */
  onToggleWatchlist: (item: GongItem) => void

  /** 보관함 전체 비우기 콜백 */
  onClearWatchlist?: () => void

  /** 물건 카드 클릭 시 상세 화면으로 이동시키는 콜백 */
  onSelectItem: (item: GongItem) => void

  /** 빈 보관함 상태에서 공매 탐색(목록 탭)으로 이동시키는 콜백 */
  onExplore: () => void
}

export function WatchlistScreen({
  items,
  watchlist,
  onToggleWatchlist,
  onClearWatchlist,
  onSelectItem,
  onExplore,
}: WatchlistScreenProps) {
  /** 보관함 내 정렬 기준 ('recent': 최신등록순, 'dDay': 마감임박순) */
  const [sortBy, setSortBy] = useState<'recent' | 'dDay'>('recent')

  /** 전달받은 items 중 현재 watchlist에 포함된 항목 필터링 */
  const savedItems = items.filter((item) => watchlist.includes(item.id))

  /** 입찰 마감이 3일 이내로 임박한 물건 수 (상시 매각 제외) */
  const urgentCount = savedItems.filter((item) => item.dDay <= 3).length

  /** 정렬 기준에 따른 표시 목록 계산 */
  const sortedItems =
    sortBy === 'recent'
      ? savedItems
      : [...savedItems].sort((a, b) => {
          const aIsPerpetual = a.dDay > 365
          const bIsPerpetual = b.dDay > 365
          if (aIsPerpetual && !bIsPerpetual) return 1
          if (!aIsPerpetual && bIsPerpetual) return -1
          if (a.dDay !== b.dDay) return a.dDay - b.dDay
          return (a.auctionDate || '').localeCompare(b.auctionDate || '')
        })

  /**
   * '전체 비우기' 버튼 클릭 시 확인 창을 띄워 실수로 인한 일괄 삭제를 방지합니다.
   */
  const handleClearAll = () => {
    if (!onClearWatchlist || savedItems.length === 0) return
    if (window.confirm(`보관함에 담긴 모든 관심 물건(${savedItems.length}건)을 삭제하시겠습니까?`)) {
      onClearWatchlist()
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-2">
      {/* 1. 상단 타이틀 및 보관 건수 헤더 */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e5eeff]">
        <div>
          <h2 className="text-lg font-headline font-bold text-[#002046]">관심 공매 보관함</h2>
          <p className="text-xs text-[#74777f]">찜해둔 공매 물건의 기일 추적 및 상태 관리</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0051d5]">
          {savedItems.length}건 보관
        </span>
      </div>

      {/* 2. 보관 물건이 있는 경우: 마감 임박 안내, 정렬/비우기 바, 물건 카드 리스트 */}
      {sortedItems.length > 0 ? (
        <>
          {/* 마감 임박(3일 이내) 물건 존재 시 주의 안내 배너 */}
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200/70 text-xs text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[18px] shrink-0">
                notifications_active
              </span>
              <span className="font-semibold">
                입찰 마감이 3일 이내로 임박한 관심 물건이 <strong>{urgentCount}건</strong> 있습니다!
              </span>
            </div>
          )}

          {/* 정렬 토글 및 전체 비우기 툴바 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-[#002046] text-white shadow-2xs'
                    : 'bg-white border border-[#e5eeff] text-[#74777f] hover:text-[#0b1c30]'
                }`}
              >
                최신등록순
              </button>
              <button
                type="button"
                onClick={() => setSortBy('dDay')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  sortBy === 'dDay'
                    ? 'bg-[#002046] text-white shadow-2xs'
                    : 'bg-white border border-[#e5eeff] text-[#74777f] hover:text-[#0b1c30]'
                }`}
              >
                마감임박순
              </button>
            </div>

            {onClearWatchlist && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-[#74777f] hover:text-[#ba1a1a] flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                <span>전체 비우기</span>
              </button>
            )}
          </div>

          {/* 관심 물건 카드 리스트 */}
          <div className="flex flex-col gap-3">
            {sortedItems.map((item) => {
              const fallbackImg = getCategoryFallbackImage(item.category)

              // D-Day 뱃지 텍스트 및 긴급 색상 판정
              const dDayLabel =
                item.dDay <= 0
                  ? '오늘 마감'
                  : item.dDay > 365
                    ? '상시 매각'
                    : `D-${item.dDay}`
              const isUrgent = item.dDay <= 3

              return (
                <article
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="bg-white rounded-2xl border border-[#e5eeff] p-3.5 flex gap-3 shadow-2xs hover:shadow-xs hover:border-[#0051d5]/40 active:scale-[0.99] cursor-pointer transition-all group"
                >
                  {/* 썸네일 이미지 및 D-Day 뱃지 */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                    <img
                      src={item.imageUrl || fallbackImg}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = fallbackImg
                      }}
                    />
                    <span
                      className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-white text-[9px] font-bold shadow-2xs ${
                        isUrgent ? 'bg-[#ba1a1a]' : 'bg-[#002046]/85'
                      }`}
                    >
                      {dDayLabel}
                    </span>
                  </div>

                  {/* 물건 상세 요약 및 하트 토글 */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className="text-[10px] font-bold text-[#0051d5] bg-[#eff4ff] px-1.5 py-0.5 rounded shrink-0">
                            {item.auctionType}
                          </span>
                          {item.failCount > 0 && (
                            <span className="text-[10px] font-medium text-[#74777f] shrink-0">
                              {item.failCount}회 유찰
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleWatchlist(item)
                          }}
                          className="text-[#ba1a1a] hover:bg-rose-50 rounded-full p-1 transition-colors cursor-pointer shrink-0"
                          aria-label="관심 물건 삭제"
                        >
                          <span className="material-symbols-outlined text-[18px] fill-1">
                            favorite
                          </span>
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-[#0b1c30] line-clamp-1 mt-0.5 group-hover:text-[#0051d5] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#74777f] line-clamp-1">{item.address}</p>
                    </div>

                    <div className="pt-2 border-t border-[#f8f9ff] flex items-baseline justify-between gap-1">
                      <div className="flex items-baseline gap-1 min-w-0">
                        {item.discountRate > 0 && (
                          <span className="text-xs font-extrabold text-[#059669] shrink-0">
                            -{item.discountRate}%
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-[#002046] truncate">
                          {formatWon(item.minimumPrice)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#74777f] shrink-0">
                        기일 {item.auctionDate ? item.auctionDate.split(' ')[0] : '확인중'}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        /* 3. 보관함이 비어 있는 경우 Empty State */
        <div className="py-24 text-center text-[#74777f] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#eff4ff] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[36px] text-[#0051d5]">
              favorite_border
            </span>
          </div>
          <p className="text-base font-bold text-[#002046]">관심 공매 보관함이 비어 있습니다.</p>
          <p className="text-xs text-[#74777f] mt-1 mb-5 leading-relaxed">
            마음에 드는 공매 물건의 하트(♡)를 눌러<br />
            입찰 기일과 할인율을 한곳에서 추적해 보세요.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="px-5 py-2.5 rounded-xl bg-[#0051d5] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span>공매 물건 둘러보기</span>
          </button>
        </div>
      )}
    </div>
  )
}

