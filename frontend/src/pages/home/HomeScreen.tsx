/**
 * @file HomeScreen.tsx
 * @description '공매이지' 모바일 앱의 메인 홈 대시보드 화면 컴포넌트입니다.
 * 
 * [주요 구성 요소]
 * 1. 상단 통합 검색바 & 시/도 지역 칩 필터 (실시간 API 동적 페칭 연동)
 * 2. 3대 자산 상품군(전체/부동산/동산/자동차) 대분류 탭 및 세부 카테고리 퀵 내비게이션
 * 3. 온비드 공매 초보 가이드 인사이트 배너
 * 4. '마감 임박! 입찰 D-1 특가' 가로 스크롤 카드 섹션 (D-Day 오름차순 정렬)
 * 5. '이번 주 유찰 추천! 반값 물건' 세로 리스트 섹션 (최고 할인율 내림차순 정렬)
 * 6. 대한민국 공공데이터포털(KAMCO 온비드) 공식 연계 신뢰 배너
 */

import { useState } from 'react'
import {
  type AssetGroup,
  GONG_ASSET_GROUPS,
  GONG_CATEGORIES,
  GONG_REGIONS,
  type GongItem,
  formatWon,
  getCategoryFallbackImage,
  isRegionMatch,
} from '../../data/mockAuctionData'
import { CardSkeleton, ListSkeleton } from '../../components/common/Skeleton'
import { useAuctionStore } from '../../store/useAuctionStore'

/**
 * HomeScreen 컴포넌트의 속성(Props) 인터페이스
 */
interface HomeScreenProps {
  /** 온비드 API로부터 수신한 공매 물건 목록 데이터 */
  items: GongItem[]

  /** 사용자가 관심 등록(찜)한 물건 ID 배열 */
  watchlist?: string[]

  /** 관심 등록 토글 콜백 함수 */
  onToggleWatchlist?: (item: GongItem) => void

  /** 물건 카드 클릭 시 상세 화면으로 이동시키는 선택 콜백 */
  onSelectItem?: (item: GongItem) => void

  /** 카테고리, 지역, 검색어 필터를 적용하여 공매 목록 탭으로 이동하는 콜백 */
  onNavigateToList?: (category?: string, region?: string, keyword?: string) => void

  /** 상단 시/도 지역 칩 또는 3대 상품군 탭 선택 시 온비드 OpenAPI 실데이터를 동적 조회하도록 요청하는 콜백 */
  onRegionChange?: (region: string, assetGroup?: AssetGroup) => void

  /** 온비드 OpenAPI 실데이터 로딩 상태 플래그 (true일 때 Shimmer 스켈레톤 표출) */
  isLoading?: boolean
}

export function HomeScreen({
  items,
  watchlist: propWatchlist,
  onToggleWatchlist: propOnToggleWatchlist,
  onSelectItem: propOnSelectItem,
  onNavigateToList,
  onRegionChange,
  isLoading = false,
}: HomeScreenProps) {
  // -------------------------------------------------------------------------
  // [전역 스토어 연동 (Zustand State & Actions)]
  // -------------------------------------------------------------------------
  const navigateToListWithFilters = useAuctionStore((state) => state.navigateToListWithFilters)
  const storeSelectedItem = useAuctionStore((state) => state.setSelectedItem)
  const storeToggleWatchlist = useAuctionStore((state) => state.toggleWatchlist)
  const storeWatchlistItems = useAuctionStore((state) => state.watchlistItems)

  const watchlist = propWatchlist ?? storeWatchlistItems.map((item) => item.id)
  const onSelectItem = propOnSelectItem ?? storeSelectedItem
  const onToggleWatchlist = propOnToggleWatchlist ?? storeToggleWatchlist

  /**
   * 목록 화면으로의 화면 전환 통합 핸들러
   * - 1차 상품군(AssetGroup)과 2차 세부카테고리(subCategory)를 누락 없이 전역 스토어에 전달합니다.
   */
  const handleNavigateToList = (params: {
    assetGroup?: AssetGroup
    subCategory?: string
    region?: string
    keyword?: string
  }) => {
    navigateToListWithFilters(params)
    onNavigateToList?.(params.subCategory, params.region, params.keyword)
  }
  // -------------------------------------------------------------------------
  // [로컬 상태 (Local State)]
  // -------------------------------------------------------------------------

  /** 현재 선택된 시/도 지역 칩 ('전체', '서울', '경기', '전남광주' 등) */
  const [selectedRegion, setSelectedRegion] = useState('전체')

  /** 현재 선택된 1차 3대 자산 상품군 대분류 ('all' | 'real_estate' | 'movable' | 'car') */
  const [selectedAssetGroup, setSelectedAssetGroup] = useState<AssetGroup>('all')

  /** 홈 화면 상단 검색 인풋에 입력된 키워드 */
  const [searchKeyword, setSearchKeyword] = useState('')

  // -------------------------------------------------------------------------
  // [이벤트 처리 및 데이터 필터링/정렬 로직]
  // -------------------------------------------------------------------------

  /**
   * 상단 시/도 지역 칩 클릭 핸들러
   * 1. 로컬 selectedRegion 상태를 업데이트합니다.
   * 2. 현재 선택된 상품군(selectedAssetGroup)과 함께 OpenAPI 동적 페칭을 요청합니다.
   */
  const handleRegionClick = (region: string) => {
    setSelectedRegion(region)
    onRegionChange?.(region, selectedAssetGroup)
  }

  /**
   * 3대 상품군 대분류 탭('전체' | '부동산' | '동산' | '자동차') 클릭 핸들러
   * 1. 로컬 selectedAssetGroup 상태를 업데이트합니다.
   * 2. 선택된 지역과 상품군에 맞춰 해당 OpenAPI 데이터를 실시간으로 재조회합니다.
   */
  const handleAssetGroupClick = (group: AssetGroup) => {
    setSelectedAssetGroup(group)
    onRegionChange?.(selectedRegion, group)
  }

  /**
   * [엄격한 지역 & 상품군 필터링 원칙]
   * - 선택된 시/도 지역(isRegionMatch)과 1차 상품군(selectedAssetGroup)에 모두 부합하는 물건만 추립니다.
   * - API 응답 수신 전이나 데이터가 0건일 때도 타 상품군/타 지역 데이터를 섞어 노출하지 않습니다.
   */
  const activeItems = items.filter((item) => {
    if (!isRegionMatch(item.address, selectedRegion)) return false
    if (selectedAssetGroup === 'movable' && item.category !== 'goods') return false
    if (selectedAssetGroup === 'car' && item.category !== 'car') return false
    if (
      selectedAssetGroup === 'real_estate' &&
      !['apt', 'commercial', 'land', 'factory'].includes(item.category)
    ) {
      return false
    }
    return true
  })

  /** 현재 선택된 상품군 라벨 ('전체' | '부동산' | '동산' | '자동차') */
  const activeGroupLabel =
    GONG_ASSET_GROUPS.find((g) => g.id === selectedAssetGroup)?.label || '전체'

  /** 현재 활성 필터 안내 라벨 조합 (예: '서울 · 부동산', '동산') */
  const filterSummaryLabel = [
    selectedRegion !== '전체' ? selectedRegion : null,
    selectedAssetGroup !== 'all' ? activeGroupLabel : null,
  ]
    .filter(Boolean)
    .join(' · ')

  /** 부동산 4대 세부 카테고리 목록 */
  const realEstateSubCategories = GONG_CATEGORIES.filter((c) => c.assetGroup === 'real_estate')
  /** 특가 테마 카테고리 목록 (신규등록, 반값공매) */
  const themeSubCategories = GONG_CATEGORIES.filter((c) => c.assetGroup === 'theme')

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
    <div className="flex flex-col gap-6 pb-24 md:pb-8">
      {/* =================================================================== */}
      {/* 1. 상단 통합 검색바 & 시/도 지역 칩 퀵 필터                         */}
      {/* =================================================================== */}
      <section className="px-4 md:px-6 pt-2">
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
              // 엔터 키 입력 시(한글 조합 완료 후) 현재 선택된 상품군, 지역, 검색어를 함께 목록 화면으로 전달
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                handleNavigateToList({
                  assetGroup: selectedAssetGroup,
                  subCategory: 'all',
                  region: selectedRegion === '전체' ? undefined : selectedRegion,
                  keyword: searchKeyword.trim(),
                })
              }
            }}
            placeholder="지역, 물건번호, 자산명 입력 후 Enter (예: 잠실, 제네시스, 기계)"
            className="w-full h-12 bg-white rounded-2xl pl-10 pr-18 text-sm text-[#0b1c30] placeholder-[#74777f] border border-[#c4c6cf]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() =>
              handleNavigateToList({
                assetGroup: selectedAssetGroup,
                subCategory: 'all',
                region: selectedRegion === '전체' ? undefined : selectedRegion,
                keyword: searchKeyword.trim(),
              })
            }
            className="absolute right-2 px-3 py-1.5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-xs font-bold transition-colors cursor-pointer"
            aria-label="온비드 전체 검색 실행"
          >
            검색
          </button>
        </div>

        {/* 시/도 지역 칩 가로 스크롤 (태블릿 이상 줄바꿈 지원) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {GONG_REGIONS.map((region) => {
            const isSelected = selectedRegion === region
            return (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionClick(region)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${isSelected
                    ? 'bg-[#0051d5] text-white shadow-xs'
                    : 'bg-white border border-[#c4c6cf]/50 text-[#44474e] hover:bg-[#e5eeff]'
                  }`}
              >
                {region}
              </button>
            )
          })}
        </div>

        {/* 지역 및 상품군 필터링 매칭 상태 피드백 바 */}
        {(selectedRegion !== '전체' || selectedAssetGroup !== 'all') && (
          <div className="mt-2.5 flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-white border border-[#e5eeff] shadow-2xs">
            {isLoading ? (
              <span className="text-[#0051d5] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-ping"></span>
                '{filterSummaryLabel}' 온비드 실시간 매물 조회 중...
              </span>
            ) : activeItems.length > 0 ? (
              <span className="text-[#0051d5] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0051d5]"></span>
                '{filterSummaryLabel}' 온비드 실시간 매물 {activeItems.length}건
              </span>
            ) : (
              <span className="text-[#ba1a1a] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                '{filterSummaryLabel}' 실시간 매물이 없습니다.
              </span>
            )}
            <button
              type="button"
              onClick={() =>
                handleNavigateToList({
                  assetGroup: selectedAssetGroup,
                  subCategory: 'all',
                  region: selectedRegion === '전체' ? undefined : selectedRegion,
                })
              }
              className="text-[#002046] font-bold hover:text-[#0051d5] transition-colors flex items-center text-[11px] cursor-pointer shrink-0 ml-2"
            >
              전체보기 &gt;
            </button>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 2. 3대 상품군(전체/부동산/동산/자동차) 탭 & 세부 카테고리 퀵 그리드  */}
      {/* =================================================================== */}
      <section className="px-4 md:px-6 flex flex-col gap-3">
        {/* 1차 상품군 대분류 세그먼트 탭 (목록 화면과 통일된 3대 자산군 구조) */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#eff4ff] rounded-2xl border border-[#dce9ff]">
          {GONG_ASSET_GROUPS.map((group) => {
            const isActive = selectedAssetGroup === group.id
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleAssetGroupClick(group.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${isActive
                    ? 'bg-[#002046] text-white shadow-xs'
                    : 'text-[#44474e] hover:text-[#002046] hover:bg-white/60'
                  }`}
              >
                <span className="material-symbols-outlined text-[15px]">{group.icon}</span>
                <span>{group.label}</span>
              </button>
            )
          })}
        </div>

        {/* 2차 선택 상품군별 세부 카테고리 퀵 내비게이션 */}
        {selectedAssetGroup === 'all' && (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5">
            {GONG_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  handleNavigateToList({
                    assetGroup: cat.assetGroup === 'theme' ? 'all' : cat.assetGroup,
                    subCategory: cat.id,
                    region: selectedRegion === '전체' ? undefined : selectedRegion,
                  })
                }
                className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center border border-[#e5eeff] shadow-2xs hover:border-[#0051d5] active:scale-95 transition-all group cursor-pointer"
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
        )}

        {selectedAssetGroup === 'real_estate' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-2.5">
              {realEstateSubCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    handleNavigateToList({
                      assetGroup: 'real_estate',
                      subCategory: cat.id,
                      region: selectedRegion === '전체' ? undefined : selectedRegion,
                    })
                  }
                  className="bg-white rounded-2xl p-2.5 flex flex-col items-center justify-center border border-[#e5eeff] shadow-2xs hover:border-[#0051d5] active:scale-95 transition-all group cursor-pointer"
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
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleNavigateToList({
                    assetGroup: 'real_estate',
                    subCategory: 'all',
                    region: selectedRegion === '전체' ? undefined : selectedRegion,
                  })
                }
                className="bg-white rounded-xl py-2 px-3 border border-[#e5eeff] text-[11px] font-bold text-[#0051d5] hover:bg-[#eff4ff] transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">domain</span>
                <span>부동산 전체</span>
              </button>
              {themeSubCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    handleNavigateToList({
                      assetGroup: 'real_estate',
                      subCategory: cat.id,
                      region: selectedRegion === '전체' ? undefined : selectedRegion,
                    })
                  }
                  className="bg-white rounded-xl py-2 px-3 border border-[#e5eeff] text-[11px] font-semibold text-[#0b1c30] hover:border-[#0051d5] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#0051d5]">
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(selectedAssetGroup === 'movable' || selectedAssetGroup === 'car') && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() =>
                handleNavigateToList({
                  assetGroup: selectedAssetGroup,
                  subCategory: 'all',
                  region: selectedRegion === '전체' ? undefined : selectedRegion,
                })
              }
              className="bg-white rounded-2xl p-3.5 border border-[#e5eeff] shadow-2xs hover:border-[#0051d5] active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0051d5] group-hover:bg-[#0051d5] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[22px]">
                    {selectedAssetGroup === 'movable' ? 'inventory_2' : 'directions_car'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#002046]">
                    {selectedAssetGroup === 'movable'
                      ? '기계·임산물·물품 동산 공매 전체보기'
                      : '승용·화물·특수차량 공매 전체보기'}
                  </p>
                  <p className="text-[11px] text-[#74777f]">
                    {selectedAssetGroup === 'movable'
                      ? '온비드 동산 전용 OpenAPI 실시간 매물 전체 탐색'
                      : '온비드 차량 전용 OpenAPI 실시간 매물 전체 탐색'}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-[#0051d5]">
                chevron_right
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              {themeSubCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    handleNavigateToList({
                      assetGroup: selectedAssetGroup,
                      subCategory: cat.id,
                      region: selectedRegion === '전체' ? undefined : selectedRegion,
                    })
                  }
                  className="bg-white rounded-xl py-2 px-3 border border-[#e5eeff] text-[11px] font-semibold text-[#0b1c30] hover:border-[#0051d5] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#0051d5]">
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 3. 온비드 공매 초보 가이드 인사이트 배너                           */}
      {/* =================================================================== */}
      <section className="px-4 md:px-6">
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
      {/* 4. 마감 임박! 입찰 D-1 특가 (모바일 가로 스크롤 / 태블릿 3열 그리드) */}
      {/* =================================================================== */}
      <section className="px-4 md:px-6">
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
            onClick={() =>
              handleNavigateToList({
                assetGroup: selectedAssetGroup,
                subCategory: 'all',
                region: selectedRegion === '전체' ? undefined : selectedRegion,
              })
            }
            className="text-xs text-[#0051d5] font-semibold hover:underline cursor-pointer"
          >
            더보기 &gt;
          </button>
        </div>

        {/* 가로 카드 스크롤 (태블릿 lg 이상 3열 쇼케이스 그리드) */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
          {isLoading ? (
            // 비동기 통신 로딩 중: 카드 스켈레톤 3개 표출
            <CardSkeleton count={3} />
          ) : urgentItems.length === 0 ? (
            // 해당 조건의 매물이 없는 경우: 빈 상태(Empty State) 안내
            <div className="w-full lg:col-span-full py-8 text-center text-[#74777f] text-xs bg-white rounded-2xl border border-[#e5eeff] px-4">
              {filterSummaryLabel
                ? `'${filterSummaryLabel}' 조건에 해당하는 마감 임박 물건이 없습니다.`
                : '현재 마감 임박 물건이 없습니다.'}
            </div>
          ) : (
            // 정상 데이터 바인딩
            urgentItems.map((item) => {
              const isSaved = watchlist.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="w-68 lg:w-full flex-shrink-0 bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between group"
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
                        className={`material-symbols-outlined text-[18px] ${isSaved ? 'text-[#ba1a1a] fill-1' : ''
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
      {/* 5. 이번 주 유찰 추천! 반값 물건 (반응형 카드 그리드)                */}
      {/* =================================================================== */}
      <section className="px-4 md:px-6">
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

        {/* 모바일 1열 / 폴더블 sm 2열 / 태블릿 lg 3열 그리드 (가로모드 전폭 최적화) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {isLoading ? (
            // 로딩 중: 세로 리스트 스켈레톤 3개 표출
            <ListSkeleton count={3} />
          ) : halfPriceItems.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-[#e5eeff] p-8 text-center text-[#74777f] text-xs">
              {filterSummaryLabel
                ? `'${filterSummaryLabel}' 조건에 해당하는 유찰 추천 물건이 없습니다.`
                : '현재 유찰 추천 물건이 없습니다.'}
            </div>
          ) : (
            halfPriceItems.map((item) => {
              const isSaved = watchlist.includes(item.id)
              return (
                <article
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="bg-white rounded-2xl border border-[#e5eeff] p-3.5 sm:p-4 flex gap-3 shadow-2xs hover:shadow-xs hover:border-[#0051d5]/40 active:scale-[0.99] cursor-pointer transition-all group overflow-hidden"
                >
                  {/* 좌측 정사각형 썸네일 */}
                  <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
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

                  {/* 우측 물건 정보 (min-w-0으로 카드 밖 밀려남 방어) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-[#0051d5] bg-[#eff4ff] px-1.5 py-0.5 rounded-md shrink-0">
                            {item.auctionType}
                          </span>
                          <span className="text-[10px] font-medium text-[#74777f] truncate">
                            {item.area}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleWatchlist(item)
                          }}
                          className="text-[#74777f] hover:text-[#ba1a1a] transition-colors p-1 shrink-0"
                          aria-label="관심물건 등록 토글"
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] ${isSaved ? 'text-[#ba1a1a] fill-1' : ''
                              }`}
                          >
                            favorite
                          </span>
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-[#0b1c30] truncate mt-1 group-hover:text-[#0051d5] transition-colors" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#74777f] truncate mt-0.5">{item.address}</p>
                    </div>

                    {/* 가격 및 기일 (flex-wrap 및 gap으로 텍스트 오버플로우 방어) */}
                    <div className="pt-2 border-t border-[#f8f9ff] flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5">
                      <div className="flex items-baseline gap-1 shrink-0">
                        {item.discountRate > 0 && (
                          <span className="text-xs font-extrabold text-[#ba1a1a]">
                            -{item.discountRate}%
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-[#002046]">
                          {formatWon(item.minimumPrice)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#74777f] shrink-0">
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
      <section className="px-4 md:px-6">
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
            <span className="font-semibold text-[#002046]">공매이지 엔진 v1.0</span>
          </div>
        </div>
      </section>
    </div>
  )
}
