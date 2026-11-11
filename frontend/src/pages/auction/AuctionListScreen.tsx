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
 */

import { useEffect, useState } from 'react'
import {
  GONG_CATEGORIES,
  GONG_REGIONS,
  type GongItem,
  formatWon,
} from '../../data/mockAuctionData'

/**
 * AuctionListScreen 컴포넌트의 속성(Props) 인터페이스
 */
interface AuctionListScreenProps {
  /** 표출할 온비드 공매 물건 목록 */
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

  /** 선택된 카테고리 ID ('all' 또는 'apt', 'land' 등) */
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all')

  /** 선택된 시/도 지역 ('전체', '서울', '경기' 등) */
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion || '전체')

  /** 선택된 공매 재산구분 유형 ('all', '신탁공매', '압류재산', '국유재산') */
  const [selectedType, setSelectedType] = useState<string>('all')

  /** 정렬 기준 ('dDay': 마감임박순, 'discount': 할인율순, 'price': 최저가순, 'views': 인기순) */
  const [sortBy, setSortBy] = useState<'dDay' | 'discount' | 'price' | 'views'>('dDay')

  /** 실시간 검색 키워드 */
  const [keyword, setKeyword] = useState<string>(initialKeyword || '')

  // -------------------------------------------------------------------------
  // [상위 Props 변경 감지 및 동기화 (State Synchronization)]
  // -------------------------------------------------------------------------

  /**
   * 홈 화면 등 외부에서 카테고리 바로가기나 검색창 Enter를 통해
   * 새로운 필터 값을 가지고 목록 화면으로 유입되었을 때, 로컬 상태를 즉각 동기화합니다.
   */
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory)
    if (initialRegion) setSelectedRegion(initialRegion)
    if (initialKeyword !== undefined) setKeyword(initialKeyword)
  }, [initialCategory, initialRegion, initialKeyword])

  /** 지원하는 공매 재산 구분 탭 목록 */
  const auctionTypes = ['all', '신탁공매', '압류재산', '국유재산']

  // -------------------------------------------------------------------------
  // [다중 조건 필터링 로직 (Multi-criteria Filtering)]
  // -------------------------------------------------------------------------

  const filtered = items.filter((item) => {
    // 1. 카테고리 필터
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false

    // 2. 공매 유형 필터 (신탁공매, 압류재산 등)
    if (selectedType !== 'all' && item.auctionType !== selectedType) return false

    // 3. 시/도 지역 필터 (소재지 주소에 지역명 포함 여부)
    if (selectedRegion !== '전체' && !item.address.includes(selectedRegion)) return false

    // 4. 검색어 필터 (물건명 또는 주소 일치 여부 대소문자 무시 검색)
    if (keyword.trim()) {
      const q = keyword.toLowerCase()
      return item.title.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)
    }

    return true
  })

  // -------------------------------------------------------------------------
  // [다중 정렬 로직 (Sorting Pipeline)]
  // -------------------------------------------------------------------------

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dDay') return a.dDay - b.dDay // 마감 임박순 (D-Day 오름차순)
    if (sortBy === 'discount') return b.discountRate - a.discountRate // 할인율 높은순 (내림차순)
    if (sortBy === 'price') return a.minimumPrice - b.minimumPrice // 최저입찰가 낮은순 (오름차순)
    if (sortBy === 'views') return b.viewCount - a.viewCount // 조회수 높은순 (인기순)
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
          placeholder="공매 물건 검색 (예: 잠실, 오피스텔)"
          className="w-full h-11 bg-white rounded-2xl pl-10 pr-9 text-xs text-[#0b1c30] placeholder-[#74777f] border border-[#c4c6cf]/60 focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
        />
        {/* 검색어 초기화 (X) 버튼 */}
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f]"
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
              ? 'bg-[#002046] text-white'
              : 'bg-white border border-[#c4c6cf]/50 text-[#44474e]'
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
                  ? 'bg-[#002046] text-white'
                  : 'bg-white border border-[#c4c6cf]/50 text-[#44474e]'
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
          {/* 시/도 지역 선택 셀렉트박스 */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-[#eff4ff] text-[#0051d5] font-bold text-[11px] px-2 py-1 rounded-md border-none focus:outline-none cursor-pointer"
          >
            {GONG_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r === '전체' ? '전국' : r}
              </option>
            ))}
          </select>

          {/* 공매 유형(신탁공매, 압류재산 등) 필터 칩 */}
          {auctionTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                selectedType === t
                  ? 'bg-[#eff4ff] text-[#0051d5]'
                  : 'text-[#74777f] hover:text-[#0b1c30]'
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

      {/* 4. 조회 결과 건수 및 활성 필터 안내 */}
      <div className="flex items-center justify-between text-xs text-[#74777f] px-1">
        <span>
          총 <strong className="text-[#002046]">{sorted.length}</strong>개의 공매 물건
        </span>
        {selectedRegion !== '전체' && (
          <span className="text-[#0051d5] font-semibold">[{selectedRegion}] 필터 적용중</span>
        )}
      </div>

      {/* 5. 공매 물건 카드 리스트 */}
      {sorted.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {sorted.map((item) => {
            const isSaved = watchlist.includes(item.id)
            return (
              <article
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-2xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer flex flex-col"
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* D-Day 및 공매 유형 뱃지 */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white">
                      D-{item.dDay}
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
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#44474e] hover:text-[#ba1a1a]"
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
                    <h4 className="text-base font-bold text-[#0b1c30] line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-[#74777f] line-clamp-1 mt-0.5">{item.address}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#f8f9ff] flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-[#059669]">
                          {item.discountRate}% 할인
                        </span>
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
                        입찰기일 {item.auctionDate.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        // 검색/필터 결과가 없을 때의 Empty State
        <div className="py-20 text-center text-[#74777f]">
          <span className="material-symbols-outlined text-[40px] text-[#c4c6cf] mb-2 block">
            search_off
          </span>
          <p className="text-sm font-bold text-[#0b1c30]">검색 조건에 맞는 물건이 없습니다.</p>
          <p className="text-xs text-[#74777f] mt-1">카테고리나 필터를 변경해 보세요.</p>
        </div>
      )}
    </div>
  )
}
