/**
 * @file AuctionListScreen.tsx
 * @description '공매이지' 앱의 공매 물건 전체 목록 화면 컴포넌트입니다.
 * 
 * [주요 기능]
 * 1. 상품별 3대 자산군 대분류 탭 (전체, 부동산, 동산, 자동차) 및 세부 카테고리 2단 필터
 * 2. 차세대 온비드 OpenAPI 3종 실시간 동적 분기 페칭 (부동산 getRlstCltrList2 / 동산 getMvastCltrList2 / 자동차 getCarCltrList2)
 * 3. 대용량 데이터 페이징 ('공매 물건 더보기' 누적 로드)
 * 4. 시/도 지역(전남광주통합특별시 포함), 재산구분(신탁공매/압류재산/국유재산), 복합 키워드 다중 필터링
 * 5. 실시간 4대 다중 정렬 (마감임박순, 할인율높은순, 최저입찰가순, 인기순)
 */

import { useEffect, useState } from 'react'
import {
  type AssetGroup,
  GONG_ASSET_GROUPS,
  GONG_CATEGORIES,
  GONG_REGION_METAS,
  type GongItem,
  formatWon,
  getCategoryFallbackImage,
  isRegionMatch,
  resolveAssetGroup,
} from '../../data/mockAuctionData'
import { ListSkeleton } from '../../components/common/Skeleton'
import {
  fetchOnbidAllAssetsList,
  fetchOnbidCarList,
  fetchOnbidMovableList,
  fetchOnbidRealEstateList,
} from '../../services/onbidService'

/**
 * AuctionListScreen 컴포넌트의 속성(Props) 인터페이스
 */
interface AuctionListScreenProps {
  /** 상위 App으로부터 전달받은 기본 온비드 공매 물건 목록 */
  items: GongItem[]

  /** 관심 등록(찜)한 물건 ID 배열 */
  watchlist: string[]

  /** 관심 등록 토글 콜백 */
  onToggleWatchlist: (item: GongItem) => void

  /** 물건 카드 클릭 시 상세 화면으로 이동시키는 콜백 */
  onSelectItem: (item: GongItem) => void

  /** 홈 화면 등에서 전달받은 초기 카테고리 ID (예: 'apt', 'goods', 'car', 'all') */
  initialCategory?: string

  /** 홈 화면 등에서 전달받은 초기 시/도 지역명 (예: '서울', '전남광주', '전체') */
  initialRegion?: string

  /** 홈 화면 상단 검색창 등에서 전달받은 초기 검색어 */
  initialKeyword?: string
}

/**
 * 전달받은 초기 카테고리 값으로부터 1차 상품군(AssetGroup)과 2차 세부 필터를 분리합니다.
 */
function parseInitialCategoryFilter(cat?: string): {
  group: AssetGroup
  sub: string
} {
  if (!cat || cat === 'all') return { group: 'all', sub: 'all' }
  if (cat === 'new' || cat === 'half') return { group: 'all', sub: cat }
  if (cat === 'real_estate') return { group: 'real_estate', sub: 'all' }
  if (cat === 'movable' || cat === 'goods') return { group: 'movable', sub: 'all' }
  if (cat === 'car') return { group: 'car', sub: 'all' }

  const group = resolveAssetGroup(cat)
  return { group, sub: cat }
}

export function AuctionListScreen({
  items,
  watchlist,
  onToggleWatchlist,
  onSelectItem,
  initialCategory,
  initialRegion = '전체',
  initialKeyword = '',
}: AuctionListScreenProps) {
  const initialParsed = parseInitialCategoryFilter(initialCategory)

  // -------------------------------------------------------------------------
  // [필터 및 정렬 로컬 상태 (Local State)]
  // -------------------------------------------------------------------------

  /** 1차 상품군 대분류 ('all' | 'real_estate' | 'movable' | 'car') */
  const [assetGroup, setAssetGroup] = useState<AssetGroup>(initialParsed.group)

  /** 2차 세부 카테고리 ('all', 'apt', 'commercial', 'land', 'factory', 'new', 'half') */
  const [subCategory, setSubCategory] = useState<string>(initialParsed.sub)

  /** 선택된 시/도 지역 ('전체', '서울', '경기', '전남광주' 등) */
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion || '전체')

  /** 선택된 공매 재산구분 유형 ('all', '신탁공매', '압류재산', '국유재산') */
  const [selectedType, setSelectedType] = useState<string>('all')

  /** 정렬 기준 ('dDay': 마감임박순, 'discount': 할인율순, 'price': 최저가순, 'views': 인기순) */
  const [sortBy, setSortBy] = useState<'dDay' | 'discount' | 'price' | 'views'>('dDay')

  /** 실시간 검색 키워드 */
  const [keyword, setKeyword] = useState<string>(initialKeyword || '')

  /** 온비드 API로부터 동적으로 수신된 물건 목록 상태 */
  const [listItems, setListItems] = useState<GongItem[]>(items)

  /** 목록 화면 자체의 비동기 OpenAPI 초기/필터 로딩 상태 */
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /** 온비드 API 현재 페이지 번호 (기본값: 1) */
  const [pageNo, setPageNo] = useState<number>(1)

  /** 추가로 불러올 데이터가 더 남아있는지 여부 */
  const [hasMore, setHasMore] = useState<boolean>(true)

  /** '더보기' 버튼을 통한 다음 페이지 비동기 추가 로딩 상태 */
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  // -------------------------------------------------------------------------
  // [상위 Props 변경 감지 및 동기화 (Render-time Prop Sync)]
  // -------------------------------------------------------------------------

  const [prevInitialProps, setPrevInitialProps] = useState({
    initialCategory,
    initialRegion,
    initialKeyword,
  })

  if (
    prevInitialProps.initialCategory !== initialCategory ||
    prevInitialProps.initialRegion !== initialRegion ||
    prevInitialProps.initialKeyword !== initialKeyword
  ) {
    setPrevInitialProps({ initialCategory, initialRegion, initialKeyword })
    if (initialCategory !== undefined) {
      const parsed = parseInitialCategoryFilter(initialCategory)
      setAssetGroup(parsed.group)
      setSubCategory(parsed.sub)
    }
    if (initialRegion !== undefined) setSelectedRegion(initialRegion)
    if (initialKeyword !== undefined) setKeyword(initialKeyword)
  }

  // -------------------------------------------------------------------------
  // [3대 상품군 OpenAPI 실데이터 동적 페칭 및 페이징 파이프라인]
  // -------------------------------------------------------------------------

  /**
   * 선택된 상품군(assetGroup)에 맞는 차세대 온비드 OpenAPI를 호출하는 공통 헬퍼입니다.
   */
  const fetchByAssetGroup = async (
    group: AssetGroup,
    page: number,
    regionName: string
  ): Promise<GongItem[]> => {
    const targetRegion = regionName === '전체' ? undefined : regionName

    if (group === 'car') {
      return fetchOnbidCarList(page, 20, targetRegion)
    }
    if (group === 'movable') {
      return fetchOnbidMovableList(page, 20, targetRegion)
    }
    if (group === 'real_estate') {
      return fetchOnbidRealEstateList({ region: targetRegion, pageNo: page, numOfRows: 20 })
    }
    // 'all': 부동산 + 동산 + 자동차 3대 상품군 병렬 통합 조회
    return fetchOnbidAllAssetsList(page, 20, targetRegion)
  }

  /**
   * 1차 상품군 대분류(assetGroup) 또는 시/도 지역 필터가 변경될 때마다 OpenAPI를 실시간 호출합니다.
   */
  useEffect(() => {
    let isMounted = true

    async function loadAuctionData() {
      setIsLoading(true)
      setPageNo(1)
      setHasMore(true)

      try {
        const data = await fetchByAssetGroup(assetGroup, 1, selectedRegion)
        const minPageThreshold = assetGroup === 'all' ? 10 : 20

        if (isMounted) {
          if (data && data.length > 0) {
            setListItems(data)
            setHasMore(data.length >= minPageThreshold)
          } else {
            setListItems([])
            setHasMore(false)
          }
        }
      } catch (err) {
        console.error('[AuctionListScreen] 실데이터 로드 실패:', err)
        if (isMounted) {
          setListItems([])
          setHasMore(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAuctionData()

    return () => {
      isMounted = false
    }
  }, [assetGroup, selectedRegion])

  /**
   * 하단 '공매 물건 더보기' 클릭 시 다음 페이지(pageNo + 1) 데이터를 누적 결합합니다.
   */
  const handleLoadMore = async () => {
    if (isLoading || isLoadingMore || !hasMore) return

    const nextPage = pageNo + 1
    setIsLoadingMore(true)

    try {
      const nextData = await fetchByAssetGroup(assetGroup, nextPage, selectedRegion)
      const minPageThreshold = assetGroup === 'all' ? 10 : 20

      if (nextData && nextData.length > 0) {
        setListItems((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const uniqueNext = nextData.filter((n) => !existingIds.has(n.id))
          return [...prev, ...uniqueNext]
        })
        setPageNo(nextPage)
        if (nextData.length < minPageThreshold) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('[AuctionListScreen] 추가 데이터 로드 실패:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

  /**
   * 1차 상품군 대분류 탭 클릭 핸들러
   */
  const handleSelectAssetGroup = (group: AssetGroup) => {
    setAssetGroup(group)
    setSubCategory('all')
  }

  /**
   * 2차 세부 카테고리 알약 클릭 핸들러
   */
  const handleSelectSubCategory = (catId: string) => {
    if (catId === 'goods') {
      setAssetGroup('movable')
      setSubCategory('all')
      return
    }
    if (catId === 'car') {
      setAssetGroup('car')
      setSubCategory('all')
      return
    }
    if (['apt', 'commercial', 'land', 'factory'].includes(catId)) {
      setAssetGroup('real_estate')
      setSubCategory(catId)
      return
    }
    setSubCategory(catId)
  }

  /** 현재 선택된 상품군에 따라 표시할 2차 세부 알약 목록 */
  const visibleSubCategories = GONG_CATEGORIES.filter((cat) => {
    if (assetGroup === 'all') return true
    if (assetGroup === 'real_estate') {
      return cat.assetGroup === 'real_estate' || cat.assetGroup === 'theme'
    }
    // 동산('movable') 또는 자동차('car') 선택 시 특가 테마 알약만 표출
    return cat.assetGroup === 'theme'
  })

  /** 지원하는 공매 재산 구분 탭 목록 */
  const auctionTypes = ['all', '신탁공매', '압류재산', '국유재산']

  // -------------------------------------------------------------------------
  // [다중 조건 필터링 파이프라인 (Multi-criteria Filtering)]
  // -------------------------------------------------------------------------

  const filtered = listItems.filter((item) => {
    // 1. 1차 상품군 및 2차 세부 카테고리 필터
    if (assetGroup === 'movable' && item.category !== 'goods') return false
    if (assetGroup === 'car' && item.category !== 'car') return false
    if (
      assetGroup === 'real_estate' &&
      !['apt', 'commercial', 'land', 'factory'].includes(item.category)
    ) {
      return false
    }

    if (subCategory !== 'all') {
      if (subCategory === 'half' && item.discountRate < 40) return false
      if (subCategory === 'new' && item.failCount > 0) return false
      if (
        ['apt', 'commercial', 'land', 'factory', 'goods', 'car'].includes(subCategory) &&
        item.category !== subCategory
      ) {
        return false
      }
    }

    // 2. 공매 재산구분 유형 필터 (신탁공매, 압류재산, 국유재산 매칭)
    if (selectedType !== 'all') {
      if (selectedType === '신탁공매') {
        if (!item.auctionType.includes('신탁') && !item.auctionType.includes('담보')) return false
      } else if (selectedType === '압류재산') {
        if (!item.auctionType.includes('압류') && !item.auctionType.includes('체납')) return false
      } else if (selectedType === '국유재산') {
        if (!item.auctionType.includes('국유')) return false
      } else if (item.auctionType !== selectedType) {
        return false
      }
    }

    // 3. 시/도 지역 필터 (정식 명칭, 축약어, 전남광주통합특별시 포괄 매칭)
    if (!isRegionMatch(item.address, selectedRegion)) return false

    // 4. 복합 키워드 검색 필터 (물건명, 주소, 공매구분, 면적 다중 토큰 AND 검색)
    if (keyword.trim()) {
      const tokens = keyword.toLowerCase().trim().split(/\s+/).filter(Boolean)
      const searchableText = `${item.title} ${item.address} ${item.auctionType} ${item.area}`.toLowerCase()
      const isMatch = tokens.every((token) => searchableText.includes(token))
      if (!isMatch) return false
    }

    return true
  })

  // -------------------------------------------------------------------------
  // [실시간 4대 다중 정렬 파이프라인 (Sorting Pipeline)]
  // -------------------------------------------------------------------------

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dDay') {
      const aIsPerpetual = a.dDay > 365
      const bIsPerpetual = b.dDay > 365
      if (aIsPerpetual && !bIsPerpetual) return 1
      if (!aIsPerpetual && bIsPerpetual) return -1
      if (a.dDay !== b.dDay) return a.dDay - b.dDay
      return (a.auctionDate || '').localeCompare(b.auctionDate || '')
    }
    if (sortBy === 'discount') {
      if (b.discountRate !== a.discountRate) return b.discountRate - a.discountRate
      return a.dDay - b.dDay
    }
    if (sortBy === 'price') {
      if (a.minimumPrice !== b.minimumPrice) return a.minimumPrice - b.minimumPrice
      return b.discountRate - a.discountRate
    }
    if (sortBy === 'views') {
      if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount
      return a.dDay - b.dDay
    }
    return 0
  })

  // -------------------------------------------------------------------------
  // [뷰 레이아웃 (JSX)]
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-3.5 pb-24 md:pb-8 px-4 md:px-6 pt-2">
      {/* 1 & 2-1. 상단 키워드 검색창 + 1차 상품군 세그먼트 탭 (태블릿 이상 2단 병렬 배치) */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-center">
        <div className="relative md:col-span-6">
          <span className="material-symbols-outlined text-[20px] text-[#74777f] absolute left-3.5 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="공매 물건 검색 (예: 잠실, 제네시스, 기계)"
            className="w-full h-11 bg-white rounded-2xl pl-10 pr-9 text-xs text-[#0b1c30] placeholder-[#74777f] border border-[#c4c6cf]/60 focus:outline-none focus:ring-2 focus:ring-[#0051d5] shadow-xs"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#0b1c30]"
              aria-label="검색어 지우기"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* 1차 상품군 대분류 세그먼트 탭 (전체 | 부동산 | 동산 | 자동차) */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#eff4ff] rounded-2xl border border-[#dce9ff] md:col-span-6">
          {GONG_ASSET_GROUPS.map((group) => {
            const isActive = assetGroup === group.id
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelectAssetGroup(group.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isActive
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
      </div>

      {/* 2-2. 2차 세부 카테고리 알약(Pill) 가로 스크롤 (태블릿 이상 줄바꿈 지원) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap pb-0.5">
        <button
          type="button"
          onClick={() => setSubCategory('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            subCategory === 'all'
              ? 'bg-[#0051d5] text-white shadow-xs'
              : 'bg-white border border-[#c4c6cf]/50 text-[#44474e] hover:bg-[#e5eeff]'
          }`}
        >
          {assetGroup === 'all'
            ? '전체 보기'
            : assetGroup === 'real_estate'
              ? '부동산 전체'
              : assetGroup === 'movable'
                ? '동산 전체'
                : '자동차 전체'}
        </button>
        {visibleSubCategories.map((cat) => {
          const isSelected = subCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectSubCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'bg-white border border-[#c4c6cf]/50 text-[#44474e] hover:bg-[#e5eeff]'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* 3. 지역 드롭다운, 공매 구분 칩 및 정렬 바 */}
      <div className="flex items-center justify-between py-2 border-y border-[#e5eeff] text-xs gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* 시/도 지역 선택 셀렉트박스 (정식 명칭 표출: 전국, 서울특별시, 전남광주통합특별시 등) */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-[#eff4ff] text-[#0051d5] font-bold text-[11px] px-2 py-1 rounded-md border-none focus:outline-none cursor-pointer"
          >
            {GONG_REGION_METAS.map((r) => (
              <option key={r.label} value={r.label}>
                {r.fullName}
              </option>
            ))}
          </select>

          {/* 공매 유형(신탁공매, 압류재산 등) 필터 칩 */}
          {auctionTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === t
                  ? 'bg-[#002046] text-white shadow-2xs'
                  : 'text-[#74777f] hover:text-[#0b1c30] hover:bg-[#e5eeff]/50'
              }`}
            >
              {t === 'all' ? '구분전체' : t}
            </button>
          ))}
        </div>

        {/* 4대 정렬 기준 선택 셀렉트박스 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'dDay' | 'discount' | 'price' | 'views')}
          className="bg-transparent text-[11px] font-semibold text-[#002046] border-none focus:outline-none cursor-pointer shrink-0"
        >
          <option value="dDay">마감임박순</option>
          <option value="discount">할인율높은순</option>
          <option value="price">최저입찰가순</option>
          <option value="views">인기순</option>
        </select>
      </div>

      {/* 4. 조회 결과 건수 및 활성 필터/실시간 API 연동 상태 안내 */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#74777f] px-1 gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>
            총 <strong className="text-[#002046]">{sorted.length}</strong>개의 공매 물건
          </span>
          {listItems.length > 0 && sorted.length !== listItems.length && (
            <span className="text-[10px] text-[#74777f]">
              (전체 {listItems.length}건 중 필터됨)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {assetGroup === 'movable' && (
            <span className="text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
              동산 실시간 연동
            </span>
          )}
          {assetGroup === 'car' && (
            <span className="text-[#ba1a1a] font-semibold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
              자동차 실시간 연동
            </span>
          )}
          {assetGroup === 'real_estate' && (
            <span className="text-[#0051d5] font-semibold bg-[#eff4ff] px-1.5 py-0.5 rounded text-[10px]">
              부동산 실시간 연동
            </span>
          )}
          {assetGroup === 'all' && (
            <span className="text-[#002046] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
              3대 상품 통합 연동
            </span>
          )}
          {selectedRegion !== '전체' && (
            <span className="text-[#0051d5] font-semibold bg-[#eff4ff] px-1.5 py-0.5 rounded text-[10px]">
              {selectedRegion}
            </span>
          )}
          {selectedType !== 'all' && (
            <span className="text-[#059669] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
              {selectedType}
            </span>
          )}
          {keyword.trim() && (
            <span className="text-[#44474e] font-medium bg-[#f1f3f9] px-1.5 py-0.5 rounded text-[10px] flex items-center gap-0.5">
              '{keyword}'
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="hover:text-black ml-0.5"
                aria-label="검색 필터 해제"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      {/* 5. 공매 물건 카드 리스트 (모바일 1열 / 폴더블 sm 2열 / 태블릿 lg 3열) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ListSkeleton count={6} />
        </div>
      ) : sorted.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((item, idx) => {
            const isSaved = watchlist.includes(item.id)
            const fallbackImg = getCategoryFallbackImage(item.category)
            const dDayLabel =
              item.dDay <= 0
                ? '오늘 마감'
                : item.dDay > 365
                  ? '상시 매각'
                  : `D-${item.dDay}`

            return (
              <article
                key={`${item.id}-${idx}`}
                onClick={() => onSelectItem(item)}
                className="bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-2xs hover:shadow-sm hover:border-[#0051d5]/40 transition-all active:scale-[0.99] cursor-pointer flex flex-col group"
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl || fallbackImg}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg
                    }}
                  />
                  {/* D-Day 및 공매 유형 뱃지 */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-xs ${
                        item.dDay <= 3 ? 'bg-[#ba1a1a]' : 'bg-[#002046]/85'
                      }`}
                    >
                      {dDayLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                      {item.auctionType}
                    </span>
                  </div>
                  {/* 관심등록(하트) 버튼 */}
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
                  {/* 면적/제원 정보 태그 */}
                  <div className="absolute bottom-2 left-2.5">
                    <span className="text-[10px] font-semibold bg-white/90 text-[#0b1c30] px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {item.area}
                    </span>
                  </div>
                </div>

                {/* 상세 텍스트 및 가격 영역 */}
                <div className="p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#0b1c30] line-clamp-1 group-hover:text-[#0051d5] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#74777f] line-clamp-1 mt-0.5">{item.address}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#f8f9ff] flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        {item.discountRate > 0 && (
                          <span className="text-sm font-extrabold text-[#059669]">
                            {item.discountRate}% 할인
                          </span>
                        )}
                        <span className="text-lg font-black text-[#002046]">
                          {formatWon(item.minimumPrice)}
                        </span>
                      </div>
                      {item.appraisalPrice > item.minimumPrice ? (
                        <span className="text-[11px] text-[#74777f] line-through">
                          감정가 {formatWon(item.appraisalPrice)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#74777f]">
                          최저입찰가 (감정가 동일/미산정)
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#74777f] block">
                        {item.failCount > 0 ? `${item.failCount}회 유찰` : '신규공매'}
                      </span>
                      <span className="text-xs font-semibold text-[#0051d5]">
                        입찰기일 {item.auctionDate ? item.auctionDate.split(' ')[0] : '일정 확인중'}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
          </div>

          {/* 6. 하단 더보기 버튼 및 로딩 / 전체 로드 완료 피드백 (그리드 전체 폭) */}
          {hasMore ? (
            <div className="pt-2 pb-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full py-3.5 bg-white border border-[#0051d5]/30 text-[#0051d5] rounded-2xl font-bold text-xs hover:bg-[#eff4ff] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-2xs disabled:opacity-60 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>다음 공매 물건 불러오는 중...</span>
                  </>
                ) : (
                  <>
                    <span>공매 물건 더보기</span>
                    <span className="text-[11px] font-normal text-[#74777f]">
                      (현재 {listItems.length}건 로드됨)
                    </span>
                    <span className="material-symbols-outlined text-[18px]">
                      expand_more
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#74777f] flex items-center justify-center gap-1.5 border-t border-[#f1f3f9] mt-2">
              <span className="material-symbols-outlined text-[16px] text-[#059669]">
                check_circle
              </span>
              <span>해당 조건의 모든 공매 물건을 불러왔습니다 (총 {listItems.length}건)</span>
            </div>
          )}
        </>
      ) : (
        // 검색/필터 결과가 없을 때의 Empty State
        <div className="py-16 text-center text-[#74777f] flex flex-col items-center">
          <span className="material-symbols-outlined text-[44px] text-[#c4c6cf] mb-2 block">
            search_off
          </span>
          <p className="text-sm font-bold text-[#0b1c30]">검색 조건에 맞는 공매 물건이 없습니다.</p>
          <p className="text-xs text-[#74777f] mt-1">상품군, 지역 또는 검색어를 변경해 보세요.</p>
          <button
            type="button"
            onClick={() => {
              setAssetGroup('all')
              setSubCategory('all')
              setSelectedRegion('전체')
              setSelectedType('all')
              setKeyword('')
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#eff4ff] text-[#0051d5] text-xs font-bold hover:bg-[#dce9ff] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>검색 필터 초기화</span>
          </button>
        </div>
      )}
    </div>
  )
}
