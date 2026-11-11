import { useState } from 'react'
import {
  GONG_CATEGORIES,
  GONG_REGIONS,
  type GongItem,
  formatWon,
} from '../../data/mockAuctionData'
import { CardSkeleton, ListSkeleton } from '../../components/common/Skeleton'

interface HomeScreenProps {
  items: GongItem[]
  watchlist: string[]
  onToggleWatchlist: (id: string) => void
  onSelectItem: (item: GongItem) => void
  onNavigateToList: (category?: string, region?: string, keyword?: string) => void
  onRegionChange?: (region: string) => void
  isLoading?: boolean
}

export function HomeScreen({
  items,
  watchlist,
  onToggleWatchlist,
  onSelectItem,
  onNavigateToList,
  onRegionChange,
  isLoading = false,
}: HomeScreenProps) {
  const [selectedRegion, setSelectedRegion] = useState('전체')
  const [searchKeyword, setSearchKeyword] = useState('')

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region)
    onRegionChange?.(region)
  }

  // 선택된 지역 칩에 따른 실시간 필터링 (타 지역 데이터로 임의 대체하지 않음)
  const activeItems = selectedRegion === '전체'
    ? items
    : items.filter((item) => item.address.includes(selectedRegion))

  // 마감 임박 물건 (D-Day 임박 순 정렬 및 추천)
  const urgentFiltered = activeItems.filter((i) => i.isUrgent)
  const urgentItems = urgentFiltered.length > 0
    ? [...urgentFiltered].sort((a, b) => a.dDay - b.dDay)
    : [...activeItems].sort((a, b) => a.dDay - b.dDay).slice(0, 5)

  // 반값/유찰 물건 (할인율 40% 이상 또는 유찰 물건 우선, 할인율 내림차순 정렬)
  const halfPriceFiltered = activeItems.filter((i) => i.isHalfPrice || i.discountRate >= 40 || i.failCount > 0)
  const halfPriceItems = halfPriceFiltered.length > 0
    ? [...halfPriceFiltered].sort((a, b) => b.discountRate - a.discountRate).slice(0, 8)
    : [...activeItems].sort((a, b) => b.discountRate - a.discountRate).slice(0, 6)

  // 섹션 타이틀용 최대 할인율 계산
  const maxDiscountRate = halfPriceItems.length > 0
    ? Math.max(...halfPriceItems.map((i) => i.discountRate))
    : 0

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* 1. Search Bar & Region Quick Filter */}
      <section className="px-4 pt-2">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined text-[20px] text-[#74777f] absolute left-3.5 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onNavigateToList(undefined, selectedRegion === '전체' ? undefined : selectedRegion, searchKeyword.trim())
            }}
            placeholder="지역, 물건번호, 자산명 검색 (예: 잠실, 제네시스)"
            className="w-full h-12 bg-white rounded-2xl pl-10 pr-10 text-sm text-[#0b1c30] placeholder-[#74777f] border border-[#c4c6cf]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => onNavigateToList(undefined, selectedRegion === '전체' ? undefined : selectedRegion, searchKeyword.trim())}
            className="absolute right-3 text-[#44474e] hover:text-[#0051d5] p-1"
            aria-label="검색 실행"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>

        {/* Region Chips Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-1 -mx-4 px-4">
          {GONG_REGIONS.map((region) => {
            const isSelected = selectedRegion === region
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#0051d5] text-white shadow-xs'
                    : 'bg-white border border-[#c4c6cf]/50 text-[#44474e] hover:bg-[#e5eeff]'
                }`}
              >
                {region}
              </button>
            )
          })}
        </div>

        {/* Region Match Status Feedback */}
        {selectedRegion !== '전체' && (
          <div className="mt-2.5 flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-white border border-[#e5eeff] shadow-2xs">
            {isLoading ? (
              <span className="text-[#0051d5] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-ping"></span>
                '{selectedRegion}' 지역 온비드 실시간 매물 조회 중...
              </span>
            ) : activeItems.length > 0 ? (
              <span className="text-[#0051d5] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0051d5]"></span>
                '{selectedRegion}' 지역 온비드 실시간 매물 {activeItems.length}건
              </span>
            ) : (
              <span className="text-[#ba1a1a] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                '{selectedRegion}' 지역 실시간 매물이 없습니다.
              </span>
            )}
            <button
              type="button"
              onClick={() => onNavigateToList(undefined, selectedRegion)}
              className="text-[#002046] font-bold hover:text-[#0051d5] transition-colors flex items-center text-[11px]"
            >
              지역 전체보기 &gt;
            </button>
          </div>
        )}
      </section>

      {/* 2. Category Grid (4x2) */}
      <section className="px-4">
        <div className="grid grid-cols-4 gap-2.5">
          {GONG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigateToList(cat.id, selectedRegion === '전체' ? undefined : selectedRegion)}
              className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center border border-[#e5eeff] shadow-2xs hover:border-[#0051d5] active:scale-95 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#002046] group-hover:bg-[#0051d5] group-hover:text-white transition-colors mb-1.5">
                <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#0b1c30] tracking-tight text-center line-clamp-1">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Main Insight Banner */}
      <section className="px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002046] via-[#1b365d] to-[#0051d5] text-white p-5 shadow-sm">
          <div className="relative z-10">
            <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs mb-2">
              온비드 공매 초보 가이드
            </span>
            <h3 className="text-lg font-headline font-bold leading-tight">
              감정가보다 <span className="text-[#85f8c4]">40% 저렴하게</span><br />
              낙찰받는 3가지 비결
            </h3>
            <p className="text-xs text-white/80 mt-1.5 leading-relaxed">
              압류재산 및 신탁공매 권리분석 핵심 체크리스트
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#316bf3]/30 rounded-full blur-xl"></div>
        </div>
      </section>

      {/* 4. Urgent D-1 Items (Horizontal Card Scroll) */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#ba1a1a] fill-1">
              local_fire_department
            </span>
            <h3 className="text-base font-headline font-bold text-[#002046]">
              마감 임박! 입찰 D-1 특가
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToList(undefined, selectedRegion === '전체' ? undefined : selectedRegion)}
            className="text-xs text-[#0051d5] font-semibold hover:underline"
          >
            더보기 &gt;
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
          {isLoading ? (
            <CardSkeleton count={3} />
          ) : urgentItems.length === 0 ? (
            <div className="w-full py-8 text-center text-[#74777f] text-xs bg-white rounded-2xl border border-[#e5eeff] px-4">
              '{selectedRegion}' 지역에 해당하는 마감 임박 물건이 없습니다.
            </div>
          ) : (
            urgentItems.map((item) => {
              const isSaved = watchlist.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="w-68 flex-shrink-0 bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
                >
                  <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ba1a1a] text-white shadow-xs">
                        {item.dDay <= 0 ? '오늘 마감' : `D-${item.dDay}`}
                      </span>
                      {item.deadlineTime && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                          {item.deadlineTime}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleWatchlist(item.id)
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#44474e] hover:text-[#ba1a1a] transition-colors"
                      aria-label="관심물건 등록 토글"
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isSaved ? 'text-[#ba1a1a] fill-1' : ''
                        }`}
                      >
                        favorite
                      </span>
                    </button>
                  </div>

                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-[#0051d5] bg-[#eff4ff] px-1.5 py-0.5 rounded">
                          {item.auctionType}
                        </span>
                        <span className="text-[10px] font-medium text-[#74777f] truncate">
                          {item.area}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0b1c30] line-clamp-1 mb-2" title={item.title}>
                        {item.title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-[#eff4ff]">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          {item.discountRate > 0 && (
                            <span className="text-sm font-extrabold text-[#ba1a1a]">
                              -{item.discountRate}%
                            </span>
                          )}
                          <span className="text-base font-extrabold text-[#002046]">
                            {formatWon(item.minimumPrice)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#74777f] line-through mt-0.5">
                        감정가 {formatWon(item.appraisalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* 5. Half Price & Failed Auctions (Vertical List) */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">
              insights
            </span>
            <h3 className="text-base font-headline font-bold text-[#002046]">
              이번 주 유찰 추천! 반값 물건
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#ba1a1a]">
            {maxDiscountRate > 0 ? `최대 ${maxDiscountRate}% 할인` : '유찰 특가'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <ListSkeleton count={3} />
          ) : halfPriceItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-8 text-center text-[#74777f] text-xs">
              '{selectedRegion}' 지역에 해당하는 유찰 추천 물건이 없습니다.
            </div>
          ) : (
            halfPriceItems.map((item) => {
              const isSaved = watchlist.includes(item.id)
              return (
                <article
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="bg-white rounded-2xl border border-[#e5eeff] p-4 flex gap-3.5 shadow-2xs hover:shadow-xs hover:border-[#0051d5]/40 active:scale-[0.99] cursor-pointer transition-all group"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80'
                      }}
                    />
                    {item.failCount > 0 ? (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                        {item.failCount}회 유찰
                      </span>
                    ) : item.discountRate >= 40 ? (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#0051d5]/90 text-white text-[9px] font-bold backdrop-blur-xs">
                        특가추천
                      </span>
                    ) : null}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#0051d5] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                            {item.auctionType}
                          </span>
                          <span className="text-[10px] font-medium text-[#74777f] truncate max-w-[120px]">
                            {item.area}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleWatchlist(item.id)
                          }}
                          className="text-[#74777f] hover:text-[#ba1a1a] transition-colors p-1"
                          aria-label="관심물건 등록 토글"
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] ${
                              isSaved ? 'text-[#ba1a1a] fill-1' : ''
                            }`}
                          >
                            favorite
                          </span>
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-[#0b1c30] line-clamp-1 mt-1 group-hover:text-[#0051d5] transition-colors" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#74777f] line-clamp-1 mt-0.5">{item.address}</p>
                    </div>

                    <div className="pt-2 border-t border-[#f8f9ff] flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        {item.discountRate > 0 && (
                          <span className="text-xs font-extrabold text-[#ba1a1a]">
                            -{item.discountRate}%
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-[#002046]">
                          {formatWon(item.minimumPrice)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#74777f]">
                        {item.auctionDate ? `기일 ${item.auctionDate.split(' ')[0]}` : '일정 확인중'}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      {/* 6. Public Data Reliability & Trust Card */}
      <section className="px-4">
        <div className="bg-[#eff4ff] rounded-2xl p-4 flex flex-col gap-2 border border-[#dce9ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#dce9ff] flex items-center justify-center text-[#002046]">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#002046]">
                대한민국 공공데이터 포털 공식 연계
              </h4>
              <p className="text-[11px] text-[#44474e]">
                한국자산관리공사(KAMCO) 온비드 OpenAPI 실시간 동기화
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#c4c6cf]/30 text-[#74777f] text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0051d5]"></span>
              오늘 실시간 정합성 검증 완료
            </span>
            <span className="font-semibold text-[#002046]">공매이지 엔진 v2.4</span>
          </div>
        </div>
      </section>
    </div>
  )
}
