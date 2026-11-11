/**
 * @file AuctionListScreen.tsx
 * @description '공매이지' 앱의 공매 물건 전체 목록 화면 컴포넌트입니다.
 * 
 * [주요 기능]
 * 1. 실시간 키워드 검색 (물건명, 도로명/지번 주소)
 * 2. 카테고리 필터 탭 (전체, 아파트, 상가, 토지, 차량 등)
 * 3. 시/도 지역 선택 드롭다운 (전국, 서울, 경기, 부산 등)
 * 4. 공매 유형 필터 칩 (전체, 신탁공매, 압류재산, 국유재산)
 * 5. 4대 다중 정렬 (마감임박순, 할인율높은순, 최저입찰가순, 인기순)
 * 6. 홈 화면 등 외부에서 유입된 초기 필터(initialCategory, initialRegion, initialKeyword) 자동 동기화
 * 7. 차세대 온비드 OpenAPI(부동산 getRlstCltrList2 / 차량 getCarCltrList2) 실시간 동적 페칭 및 스켈레톤 로딩 UI
 */

import { useEffect, useState } from 'react'
import {
  GONG_CATEGORIES,
  GONG_REGION_METAS,
  type GongItem,
  formatWon,
  isRegionMatch,
} from '../../data/mockAuctionData'
import { ListSkeleton } from '../../components/common/Skeleton'
import { fetchOnbidRealEstateList, fetchOnbidCarList } from '../../services/onbidService'

/**
 * AuctionListScreen 컴포넌트의 속성(Props) 인터페이스
 */
interface AuctionListScreenProps {
  /** 상위 App으로부터 전달받은 기본 온비드 공매 물건 목록 */
  items: GongItem[]

  /** 관심 등록(찜)한 물건 ID 배열 */
  watchlist: string[]

  /** 관심 등록 토글 콜백 */
  onToggleWatchlist: (id: string) => void

  /** 물건 카드 클릭 시 상세 화면으로 이동시키는 콜백 */
  onSelectItem: (item: GongItem) => void

  /** 홈 화면 등에서 전달받은 초기 카테고리 ID (예: 'apt', 'land') */
  initialCategory?: string

  /** 홈 화면 등에서 전달받은 초기 시/도 지역명 (예: '서울', '경기', '전체') */
  initialRegion?: string

  /** 홈 화면 상단 검색창 등에서 전달받은 초기 검색어 */
  initialKeyword?: string
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
  // -------------------------------------------------------------------------
  // [필터 및 정렬 로컬 상태 (Local State)]
  // -------------------------------------------------------------------------

  /** 선택된 카테고리 ID ('all' 또는 'apt', 'commercial', 'land', 'car' 등) */
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all')

  /** 선택된 시/도 지역 ('전체', '서울', '경기', '부산' 등) */
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
  // [상위 Props 변경 감지 및 동기화 (State Synchronization)]
  // -------------------------------------------------------------------------

  /**
   * 홈 화면 등 외부에서 카테고리 바로가기나 검색창 Enter를 통해
   * 새로운 필터 값을 가지고 목록 화면으로 유입되었을 때, 로컬 상태를 즉각 동기화합니다.
   */
  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory)
    if (initialRegion !== undefined) setSelectedRegion(initialRegion)
    if (initialKeyword !== undefined) setKeyword(initialKeyword)
  }, [initialCategory, initialRegion, initialKeyword])

  // -------------------------------------------------------------------------
  // [OpenAPI 실데이터 동적 페칭 파이프라인 (1단계 & 2단계 페이징)]
  // -------------------------------------------------------------------------

  /**
   * 카테고리 또는 시/도 지역 필터가 변경될 때마다 차세대 온비드 OpenAPI를 실시간 호출합니다.
   * - 페이지 번호를 1페이지로 리셋하고 기존 목록을 새 데이터로 갱신합니다.
   * - 카테고리가 'car'(자동차/운송)인 경우: 차량 전용 API(fetchOnbidCarList) 호출
   * - 그 외 카테고리인 경우: 부동산 물건 목록 API(fetchOnbidRealEstateList) 호출
   * - 받아온 데이터가 요청 규격(20건) 미만이면 추가 페이지가 없는 것으로 판정(hasMore = false)합니다.
   */
  useEffect(() => {
    let isMounted = true

    async function loadAuctionData() {
      setIsLoading(true)
      setPageNo(1)
      setHasMore(true)

      try {
        let data: GongItem[] = []

        if (selectedCategory === 'car') {
          // 온비드 차량 전용 API 호출 (getCarCltrList2)
          data = await fetchOnbidCarList(
            1,
            20,
            selectedRegion === '전체' ? undefined : selectedRegion
          )
        } else {
          // 온비드 부동산 물건 목록 API 호출 (getRlstCltrList2)
          data = await fetchOnbidRealEstateList({
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            region: selectedRegion === '전체' ? undefined : selectedRegion,
            pageNo: 1,
            numOfRows: 20,
          })
        }

        if (isMounted) {
          if (data && data.length > 0) {
            setListItems(data)
            // 첫 페이지가 20건 미만이면 더 이상 추가 데이터 없음
            setHasMore(data.length >= 20)
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
  }, [selectedCategory, selectedRegion])

  /**
   * [2단계] 목록 하단 '더보기' 버튼 클릭 시 다음 페이지(pageNo + 1)의 온비드 OpenAPI 데이터를 호출하여
   * 기존 물건 목록(listItems) 뒤에 누적 결합합니다.
   */
  const handleLoadMore = async () => {
    if (isLoading || isLoadingMore || !hasMore) return

    const nextPage = pageNo + 1
    setIsLoadingMore(true)

    try {
      let nextData: GongItem[] = []

      if (selectedCategory === 'car') {
        // 온비드 차량 전용 API 다음 페이지 호출
        nextData = await fetchOnbidCarList(
          nextPage,
          20,
          selectedRegion === '전체' ? undefined : selectedRegion
        )
      } else {
        // 온비드 부동산 물건 목록 API 다음 페이지 호출
        nextData = await fetchOnbidRealEstateList({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          region: selectedRegion === '전체' ? undefined : selectedRegion,
          pageNo: nextPage,
          numOfRows: 20,
        })
      }

      if (nextData && nextData.length > 0) {
        setListItems((prev) => [...prev, ...nextData])
        setPageNo(nextPage)
        // 새로 받아온 건수가 20건 미만이면 마지막 페이지로 간주
        if (nextData.length < 20) {
          setHasMore(false)
        }
      } else {
        // 추가 데이터가 없으면 페이징 종료
        setHasMore(false)
      }
    } catch (err) {
      console.error('[AuctionListScreen] 추가 데이터 로드 실패:', err)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

  /** 지원하는 공매 재산 구분 탭 목록 */
  const auctionTypes = ['all', '신탁공매', '압류재산', '국유재산']

  // -------------------------------------------------------------------------
  // [3단계: 다중 조건 필터링 파이프라인 (Multi-criteria Filtering)]
  // -------------------------------------------------------------------------

  const filtered = listItems.filter((item) => {
    // 1. 카테고리 필터 (차량, 반값, 신규, 아파트, 상가, 토지 등)
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'car') {
        if (item.category !== 'car') return false
      } else if (selectedCategory === 'half') {
        // 반값 특가: 할인율 40% 이상 물건
        if (item.discountRate < 40) return false
      } else if (selectedCategory === 'new') {
        // 신규 공매: 유찰 횟수 0회 물건
        if (item.failCount > 0) return false
      } else if (['apt', 'commercial', 'land'].includes(selectedCategory)) {
        if (item.category !== selectedCategory) return false
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
      // 입력된 모든 단어가 포함되어야 매칭
      const isMatch = tokens.every((token) => searchableText.includes(token))
      if (!isMatch) return false
    }

    return true
  })

  // -------------------------------------------------------------------------
  // [3단계: 실시간 4대 다중 정렬 파이프라인 (Sorting Pipeline)]
  // -------------------------------------------------------------------------

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dDay') {
      // 1) 상시 매각(dDay > 365) 물건은 마감임박순에서는 맨 뒤로 배치
      const aIsPerpetual = a.dDay > 365
      const bIsPerpetual = b.dDay > 365
      if (aIsPerpetual && !bIsPerpetual) return 1
      if (!aIsPerpetual && bIsPerpetual) return -1

      // 2) 마감 임박순 (D-Day 오름차순)
      if (a.dDay !== b.dDay) return a.dDay - b.dDay

      // 3) D-Day 동일 시 마감일시(auctionDate) 문자열 기준 2차 정밀 정렬
      return (a.auctionDate || '').localeCompare(b.auctionDate || '')
    }

    if (sortBy === 'discount') {
      // 1) 할인율 높은순 (내림차순)
      if (b.discountRate !== a.discountRate) {
        return b.discountRate - a.discountRate
      }
      // 2) 할인율 동일 시 D-Day 임박순 2차 정렬
      return a.dDay - b.dDay
    }

    if (sortBy === 'price') {
      // 1) 최저입찰가 낮은순 (오름차순)
      if (a.minimumPrice !== b.minimumPrice) {
        return a.minimumPrice - b.minimumPrice
      }
      // 2) 최저가 동일 시 할인율 높은순 2차 정렬
      return b.discountRate - a.discountRate
    }

    if (sortBy === 'views') {
      // 1) 조회수 높은순 (인기순 내림차순)
      if (b.viewCount !== a.viewCount) {
        return b.viewCount - a.viewCount
      }
      // 2) 조회수 동일 시 D-Day 임박순 2차 정렬
      return a.dDay - b.dDay
    }

    return 0
  })

  // -------------------------------------------------------------------------
  // [뷰 레이아웃 (JSX)]
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-2">
      {/* 1. 상단 키워드 검색창 */}
      <div className="relative">
        <span className="material-symbols-outlined text-[20px] text-[#74777f] absolute left-3.5 top-1/2 -translate-y-1/2">
          search
        </span>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="공매 물건 검색 (예: 잠실, 제네시스, 상가)"
          className="w-full h-11 bg-white rounded-2xl pl-10 pr-9 text-xs text-[#0b1c30] placeholder-[#74777f] border border-[#c4c6cf]/60 focus:outline-none focus:ring-2 focus:ring-[#0051d5] shadow-xs"
        />
        {/* 검색어 초기화 (X) 버튼 */}
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

      {/* 2. 카테고리 필터 알약(Pill) 가로 스크롤 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#002046] text-white shadow-xs'
              : 'bg-white border border-[#c4c6cf]/50 text-[#44474e] hover:bg-[#e5eeff]'
          }`}
        >
          전체 보기
        </button>
        {GONG_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-[#002046] text-white shadow-xs'
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
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-transparent text-[11px] font-semibold text-[#002046] border-none focus:outline-none cursor-pointer shrink-0"
        >
          <option value="dDay">마감임박순</option>
          <option value="discount">할인율높은순</option>
          <option value="price">최저입찰가순</option>
          <option value="views">인기순</option>
        </select>
      </div>

      {/* 4. 조회 결과 건수 및 활성 필터 태그 안내 */}
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
          {selectedCategory === 'car' && (
            <span className="text-[#ba1a1a] font-semibold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
              자동차 실시간 연동
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

      {/* 5. 공매 물건 카드 리스트 */}
      {isLoading ? (
        // 실데이터 비동기 통신 중: 세로 리스트 스켈레톤 4개 표출
        <div className="flex flex-col gap-3.5">
          <ListSkeleton count={4} />
        </div>
      ) : sorted.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {sorted.map((item, idx) => {
            const isSaved = watchlist.includes(item.id)
            return (
              <article
                key={`${item.id}-${idx}`}
                onClick={() => onSelectItem(item)}
                className="bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-2xs hover:shadow-sm hover:border-[#0051d5]/40 transition-all active:scale-[0.99] cursor-pointer flex flex-col group"
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.src = selectedCategory === 'car'
                        ? 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'
                    }}
                  />
                  {/* D-Day 및 공매 유형 뱃지 */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white shadow-xs">
                      {item.dDay <= 0 ? '오늘 마감' : `D-${item.dDay}`}
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
                  {/* 면적 정보 태그 */}
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
                      <span className="text-[11px] text-[#74777f] line-through">
                        감정가 {formatWon(item.appraisalPrice)}
                      </span>
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

          {/* 6. [2단계 페이징] 하단 더보기 버튼 및 로딩 / 전체 로드 완료 피드백 */}
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
        </div>
      ) : (
        // 검색/필터 결과가 없을 때의 Empty State
        <div className="py-16 text-center text-[#74777f] flex flex-col items-center">
          <span className="material-symbols-outlined text-[44px] text-[#c4c6cf] mb-2 block">
            search_off
          </span>
          <p className="text-sm font-bold text-[#0b1c30]">검색 조건에 맞는 공매 물건이 없습니다.</p>
          <p className="text-xs text-[#74777f] mt-1">지역, 카테고리 또는 검색어를 변경해 보세요.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all')
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
