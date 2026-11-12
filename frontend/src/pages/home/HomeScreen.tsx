/**
 * @file HomeScreen.tsx
 * @description '공매이지' 모바일 앱의 메인 홈 대시보드 화면 컴포넌트입니다.
 * 
 * [주요 구성 요소]
 * 1. 상단 통합 검색바 & 시/도 지역 칩 필터 (실시간 API 동적 페칭 연동)
 * 2. 8대 자산 카테고리 퀵 내비게이션 그리드 (4x2)
 * 3. 온비드 공매 초보 가이드 인사이트 배너
 * 4. '마감 임박! 입찰 D-1 특가' 가로 스크롤 카드 섹션 (D-Day 오름차순 정렬)
 * 5. '이번 주 유찰 추천! 반값 물건' 세로 리스트 섹션 (최고 할인율 내림차순 정렬)
 * 6. 대한민국 공공데이터포털(KAMCO 온비드) 공식 연계 신뢰 배너
 */

import { useState } from 'react'
import {
  GONG_CATEGORIES,
  GONG_REGIONS,
  type GongItem,
  formatWon,
  getCategoryFallbackImage,
  isRegionMatch,
} from '../../data/mockAuctionData'
import { CardSkeleton, ListSkeleton } from '../../components/common/Skeleton'

/**
 * HomeScreen 컴포넌트의 속성(Props) 인터페이스
 */
interface HomeScreenProps {
  /** 온비드 API로부터 수신한 공매 물건 목록 데이터 */
  items: GongItem[]

  /** 사용자가 관심 등록(찜)한 물건 ID 배열 */
  watchlist: string[]

  /** 관심 등록 토글 콜백 함수 */
  onToggleWatchlist: (item: GongItem) => void

  /** 물건 카드 클릭 시 상세 화면으로 이동시키는 선택 콜백 */
  onSelectItem: (item: GongItem) => void

  /** 카테고리, 지역, 검색어 필터를 적용하여 공매 목록 탭으로 이동하는 콜백 */
  onNavigateToList: (category?: string, region?: string, keyword?: string) => void

  /** 상단 시/도 지역 칩 선택 시 온비드 OpenAPI 실데이터를 동적 조회하도록 요청하는 콜백 */
  onRegionChange?: (region: string) => void

  /** 온비드 OpenAPI 실데이터 로딩 상태 플래그 (true일 때 Shimmer 스켈레톤 표출) */
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
  // -------------------------------------------------------------------------
  // [로컬 상태 (Local State)]
  // -------------------------------------------------------------------------

  /** 현재 선택된 시/도 지역 칩 ('전체', '서울', '경기', '부산' 등) */
  const [selectedRegion, setSelectedRegion] = useState('전체')

  /** 홈 화면 상단 검색 인풋에 입력된 키워드 */
  const [searchKeyword, setSearchKeyword] = useState('')

  // -------------------------------------------------------------------------
  // [이벤트 처리 및 데이터 필터링/정렬 로직]
  // -------------------------------------------------------------------------

  /**
   * 상단 시/도 지역 칩 클릭 핸들러
   * 1. 로컬 selectedRegion 상태를 업데이트합니다.
   * 2. 상위 App 컴포넌트의 onRegionChange를 호출하여 해당 지역의 실매물을 OpenAPI로 동적 페칭합니다.
   */
  const handleRegionClick = (region: string) => {
    setSelectedRegion(region)
    onRegionChange?.(region)
  }

  /**
   * [엄격한 지역 필터링 원칙 및 표준 행정구역 매칭]
   * - '전체'일 때는 전달받은 전체 매물 목록을 유지합니다.
   * - 특정 지역('서울', '경기', '전남광주' 등)이 선택된 경우, 정식 행정구역명과 통합특별시를 모두 포괄하는 isRegionMatch로 엄격히 필터링합니다.
   * - 데이터가 0건이어도 타 지역 데이터를 섞어서 노출하지 않고 정직한 빈 상태(Empty State)를 표출합니다.
   */
  const activeItems = selectedRegion === '전체'
    ? items
    : items.filter((item) => isRegionMatch(item.address, selectedRegion))

  /**
   * [섹션 4: 마감 임박 특가 물건 필터링 및 정렬]
   * 1. 입찰 마감일이 임박한 물건(dDay <= 3)을 우선 추출합니다.
   * 2. 마감일이 적게 남은 순(D-Day 오름차순: sort((a, b) => a.dDay - b.dDay))으로 정렬하여 사용자에게 긴급성을 제공합니다.
   * 3. 조건에 맞는 물건이 적더라도 활성 매물 중 마감이 가장 빠른 상위 5건을 선별 추천합니다.
   */
  const urgentFiltered = activeItems.filter((i) => i.isUrgent)
  const urgentItems = urgentFiltered.length > 0
    ? [...urgentFiltered].sort((a, b) => a.dDay - b.dDay)
    : [...activeItems].sort((a, b) => a.dDay - b.dDay).slice(0, 5)

  /**
   * [섹션 5: 이번 주 유찰 추천! 반값 물건 필터링 및 정렬]
   * 1. 할인율 40% 이상(감정가 대비)이거나 유찰 이력(failCount > 0)이 있는 알짜 물건을 추출합니다.
   * 2. 할인율이 가장 높은 순(내림차순: sort((a, b) => b.discountRate - a.discountRate))으로 정렬합니다.
   */
  const halfPriceFiltered = activeItems.filter((i) => i.isHalfPrice || i.discountRate >= 40 || i.failCount > 0)
  const halfPriceItems = halfPriceFiltered.length > 0
    ? [...halfPriceFiltered].sort((a, b) => b.discountRate - a.discountRate).slice(0, 8)
    : [...activeItems].sort((a, b) => b.discountRate - a.discountRate).slice(0, 6)

  /** 섹션 타이틀 우측 뱃지용 최고 할인율 동적 계산 (예: '최대 90% 할인') */
  const maxDiscountRate = halfPriceItems.length > 0
    ? Math.max(...halfPriceItems.map((i) => i.discountRate))
    : 0

  // -------------------------------------------------------------------------
  // [뷰 레이아웃 (JSX)]
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* =================================================================== */}
      {/* 1. 상단 통합 검색바 & 시/도 지역 칩 퀵 필터                         */}
      {/* =================================================================== */}
      <section className="px-4 pt-2">
        {/* 통합 검색 입력창 */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined text-[20px] text-[#74777f] absolute left-3.5 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              // 엔터 키 입력 시 현재 선택된 지역과 검색어를 함께 목록 화면으로 전달
              if (e.key === 'Enter') {
                onNavigateToList(undefined, selectedRegion === '전체' ? undefined : selectedRegion, searchKeyword.trim())
              }
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

        {/* 시/도 지역 칩 가로 스크롤 (전체, 서울, 경기, 인천, 부산, 대전, 대구, 광주) */}
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

        {/* 지역 필터링 매칭 상태 피드백 바 */}
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

      {/* =================================================================== */}
      {/* 2. 8대 자산 카테고리 퀵 내비게이션 그리드 (4x2)                    */}
      {/* =================================================================== */}
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

      {/* =================================================================== */}
      {/* 3. 온비드 공매 초보 가이드 인사이트 배너                           */}
      {/* =================================================================== */}
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

      {/* =================================================================== */}
      {/* 4. 마감 임박! 입찰 D-1 특가 (가로 스크롤 카드)                      */}
      {/* =================================================================== */}
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

        {/* 가로 카드 스크롤 영역 */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
          {isLoading ? (
            // 비동기 통신 로딩 중: 카드 스켈레톤 3개 표출
            <CardSkeleton count={3} />
          ) : urgentItems.length === 0 ? (
            // 해당 조건의 매물이 없는 경우: 빈 상태(Empty State) 안내
            <div className="w-full py-8 text-center text-[#74777f] text-xs bg-white rounded-2xl border border-[#e5eeff] px-4">
              '{selectedRegion}' 지역에 해당하는 마감 임박 물건이 없습니다.
            </div>
          ) : (
            // 정상 데이터 바인딩
            urgentItems.map((item) => {
              const isSaved = watchlist.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="w-68 flex-shrink-0 bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
                >
                  {/* 상단 썸네일 이미지 및 마감 뱃지 영역 */}
                  <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl || getCategoryFallbackImage(item.category)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        // 온비드 원본 이미지 실패 시 카테고리 전용 대체 이미지 적용
                        e.currentTarget.src = getCategoryFallbackImage(item.category)
                      }}
                    />
                    {/* D-Day 및 마감 시각 뱃지 */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ba1a1a] text-white shadow-xs">
                        {item.dDay <= 0
                          ? '오늘 마감'
                          : item.dDay > 365
                            ? '상시 매각'
                            : `D-${item.dDay}`}
                      </span>
                      {item.deadlineTime && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                          {item.deadlineTime}
                        </span>
                      )}
                    </div>
                    {/* 관심 물건(하트) 토글 버튼 (카드 클릭과 독립 동작하도록 이벤트 전파 차단) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleWatchlist(item)
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

                  {/* 하단 물건 상세 정보 영역 */}
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

                    {/* 가격 정보 (최저입찰가 및 감정가) */}
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
                      {item.appraisalPrice > item.minimumPrice ? (
                        <p className="text-[11px] text-[#74777f] line-through mt-0.5">
                          감정가 {formatWon(item.appraisalPrice)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#74777f] mt-0.5">
                          최저입찰가 (감정가 동일/미산정)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. 이번 주 유찰 추천! 반값 물건 (세로 리스트)                       */}
      {/* =================================================================== */}
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

        {/* 세로 리스트 영역 */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            // 로딩 중: 세로 리스트 스켈레톤 3개 표출
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
                  {/* 좌측 정사각형 썸네일 */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                    <img
                      src={item.imageUrl || getCategoryFallbackImage(item.category)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = getCategoryFallbackImage(item.category)
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

                  {/* 우측 물건 정보 */}
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
                            onToggleWatchlist(item)
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

                    {/* 가격 및 기일 */}
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

      {/* =================================================================== */}
      {/* 6. 대한민국 공공데이터포털(KAMCO) 공식 연계 신뢰 배너             */}
      {/* =================================================================== */}
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
