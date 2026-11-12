/**
 * @file App.tsx
 * @description '공매이지' 모바일 웹 하이브리드 앱의 최상위 루트 애플리케이션 컴포넌트입니다.
 * 탭 라우팅, 공공데이터포털 차세대 온비드 OpenAPI 실데이터 연동 파이프라인,
 * 지역별 동적 페칭 및 전역 상태(관심목록, 선택 물건 등)를 중앙에서 총괄 관리합니다.
 */

import { useEffect, useState } from 'react'
import { AppBottomNav, type AppTab } from './components/layout/AppBottomNav'
import { AppHeader } from './components/layout/AppHeader'
import { MOCK_GONG_ITEMS, type GongItem } from './data/mockAuctionData'
import { AuctionDetailScreen } from './pages/auction/AuctionDetailScreen'
import { AuctionListScreen } from './pages/auction/AuctionListScreen'
import { HomeScreen } from './pages/home/HomeScreen'
import { MyScreen } from './pages/my/MyScreen'
import { WatchlistScreen } from './pages/watchlist/WatchlistScreen'
import { fetchOnbidRealEstateList } from './services/onbidService'
import {
  loadWatchlistItems,
  saveWatchlistItems,
  clearWatchlistItems,
} from './services/storageService'

export default function App() {
  // -------------------------------------------------------------------------
  // [전역 상태 관리 (Global State)]
  // -------------------------------------------------------------------------

  /** 현재 활성화된 하단 네비게이션 탭 ('home' | 'list' | 'watchlist' | 'my') */
  const [activeTab, setActiveTab] = useState<AppTab>('home')

  /** 현재 화면에 표출되는 온비드 공매 물건 목록 (초기값: MOCK_GONG_ITEMS -> 실데이터로 교체) */
  const [items, setItems] = useState<GongItem[]>(MOCK_GONG_ITEMS)

  /** 온비드 OpenAPI 비동기 통신 로딩 상태 (true일 때 스켈레톤 UI 표출) */
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * 사용자가 관심 등록(찜)한 공매 물건 객체 배열
   * - storageService 추상화 레이어를 통해 웹(localStorage) 또는 React Native(AsyncStorage/MMKV)에서 비동기 복원됩니다.
   * - 목록 2페이지 이후, 차량 공매, 타 지역 검색에서 찜한 물건도 보존하기 위해 GongItem 전체를 보관합니다.
   */
  const [watchlistItems, setWatchlistItems] = useState<GongItem[]>([])

  /**
   * 스토리지 초기 비동기 복원 완료 여부 플래그
   * - 초기 빈 배열 상태가 기존 영구 데이터를 덮어쓰는 경쟁 상태(Race Condition)를 방어합니다.
   */
  const [isWatchlistInitialized, setIsWatchlistInitialized] = useState<boolean>(false)

  /** 하트 UI 활성화 여부 판정 및 뱃지 카운트용 관심물건 ID 파생 배열 */
  const watchlist = watchlistItems.map((item) => item.id)

  /** 입찰 마감이 3일 이내로 임박한 관심물건 수 (상단 헤더 알림 뱃지용) */
  const urgentWatchlistCount = watchlistItems.filter((item) => item.dDay <= 3).length

  /** 현재 상세 화면에 열려 있는 공매 물건 (null이면 메인 탭 화면 표시) */
  const [selectedItem, setSelectedItem] = useState<GongItem | null>(null)

  /** 공매 목록 화면(`AuctionListScreen`)으로 전달할 초기 카테고리 필터값 */
  const [listCategory, setListCategory] = useState<string | undefined>()

  /** 공매 목록 화면(`AuctionListScreen`)으로 전달할 초기 시/도 지역 필터값 */
  const [listRegion, setListRegion] = useState<string | undefined>()

  /** 공매 목록 화면(`AuctionListScreen`)으로 전달할 초기 검색 키워드 */
  const [listKeyword, setListKeyword] = useState<string | undefined>()

  // -------------------------------------------------------------------------
  // [비동기 데이터 페칭 파이프라인 (Data Fetching Pipeline)]
  // -------------------------------------------------------------------------

  /**
   * 앱 최초 마운트 시 한국자산관리공사(KAMCO) 차세대 온비드 OpenAPI 실데이터를 비동기로 호출합니다.
   * - 정상 수신: items 상태를 최신 실매물 데이터로 갱신
   * - 장애/네트워크 에러: 서비스 중단을 방지하기 위해 로컬 Fallback 샘플 데이터를 안전하게 유지
   */
  useEffect(() => {
    let isMounted = true

    async function loadRealTimeOnbidData() {
      setIsLoading(true)
      try {
        const onbidData = await fetchOnbidRealEstateList({ pageNo: 1, numOfRows: 20 })
        if (isMounted && onbidData && onbidData.length > 0) {
          setItems(onbidData)
        }
      } catch (err) {
        console.error('온비드 실데이터 로드 실패, Fallback 데이터 유지:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRealTimeOnbidData()

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * 앱 최초 마운트 시 스토리지 추상화 레이어(storageService)를 통해 관심물건 데이터를 비동기로 복원합니다.
   */
  useEffect(() => {
    let isMounted = true

    async function initWatchlist() {
      const loaded = await loadWatchlistItems()
      if (isMounted) {
        setWatchlistItems(loaded)
        setIsWatchlistInitialized(true)
      }
    }

    initWatchlist()

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * 관심물건(watchlistItems) 상태 변경 시 storageService에 비동기 영구 저장합니다.
   * - 초기 비동기 복원이 완료된 이후(isWatchlistInitialized === true)에만 저장을 실행합니다.
   */
  useEffect(() => {
    if (!isWatchlistInitialized) return
    saveWatchlistItems(watchlistItems)
  }, [watchlistItems, isWatchlistInitialized])

  // -------------------------------------------------------------------------
  // [이벤트 핸들러 (Event Handlers)]
  // -------------------------------------------------------------------------

  /**
   * 특정 공매 물건의 관심 등록(찜) 여부를 토글합니다.
   * - 이미 보관 중인 물건이면 목록에서 제거하고, 없으면 최신 항목(배열 맨 앞)으로 추가합니다.
   * @param targetItem - 토글할 공매 물건(GongItem) 객체
   */
  const toggleWatchlist = (targetItem: GongItem) => {
    setWatchlistItems((prev) => {
      const exists = prev.some((item) => item.id === targetItem.id)
      return exists
        ? prev.filter((item) => item.id !== targetItem.id)
        : [targetItem, ...prev]
    })
  }

  /**
   * 보관함에 담긴 모든 관심물건을 일괄 삭제하고 스토리지를 초기화합니다.
   */
  const clearWatchlist = async () => {
    setWatchlistItems([])
    await clearWatchlistItems()
  }

  /**
   * 홈 상단 지역 칩('서울', '경기', '부산' 등) 클릭 시 호출됩니다.
   * 온비드 OpenAPI에 해당 지역명(lctnSdnm)을 전달하여 해당 지역의 실데이터 20건을 동적으로 조회합니다.
   * @param region - 선택된 시/도 지역명 (예: '서울', '경기', '전체')
   */
  const handleRegionChange = async (region: string) => {
    setIsLoading(true)
    try {
      const onbidData = await fetchOnbidRealEstateList({
        region: region === '전체' ? undefined : region,
        pageNo: 1,
        numOfRows: 20,
      })
      if (onbidData && onbidData.length > 0) {
        setItems(onbidData)
      } else {
        setItems([])
      }
    } catch (err) {
      console.error('지역별 온비드 실데이터 로드 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 홈 화면에서 카테고리 클릭, 검색창 엔터, '더보기' 클릭 시
   * 필터 파라미터를 설정하고 공매 목록 화면(`AuctionListScreen`)으로 화면을 전환합니다.
   * @param cat - 선택된 카테고리 코드 (생략 시 기본 'all')
   * @param reg - 선택된 시/도 지역명 (생략 시 기본 '전체')
   * @param kw - 입력된 검색 키워드 (생략 시 기본 '')
   */
  const navigateToListWithFilters = (cat?: string, reg?: string, kw?: string) => {
    setListCategory(cat || 'all')
    setListRegion(reg || '전체')
    setListKeyword(kw || '')
    setSelectedItem(null) // 상세 화면이 열려있었다면 닫기
    setActiveTab('list') // 목록 탭 활성화
  }

  /**
   * 상단 헤더 종 모양 알림 버튼 클릭 핸들러
   * - 마감 임박 관심물건이 있는 경우 관심 보관함으로 바로 안내합니다.
   */
  const handleAlarmClick = () => {
    if (urgentWatchlistCount > 0) {
      if (
        window.confirm(
          `입찰 마감이 3일 이내로 임박한 관심 물건이 ${urgentWatchlistCount}건 있습니다.\n관심 공매 보관함으로 이동할까요?`
        )
      ) {
        setSelectedItem(null)
        setActiveTab('watchlist')
      }
      return
    }

    const urgentMarketCount = items.filter((item) => item.dDay <= 3).length
    alert(
      urgentMarketCount > 0
        ? `현재 관심 등록된 마감 임박 물건은 없습니다.\n(실시간 전체 공매 중 3일 이내 마감 예정 ${urgentMarketCount}건 등록 중)`
        : '현재 등록된 긴급 마감 알림이 없습니다.'
    )
  }

  // -------------------------------------------------------------------------
  // [렌더링 (View Layout)]
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f1f4f9] flex justify-center selection:bg-blue-200">
      {/* 모바일 뷰포트 컨테이너 (최대 폭 max-w-md = 448px 모바일 프레임) */}
      <div className="w-full max-w-md bg-[#f8f9ff] min-h-screen flex flex-col shadow-2xl relative border-x border-[#e2e8f0]/80 overflow-x-hidden">
        {/* 앱 상단 고정 헤더 */}
        <AppHeader
          onSearchClick={() => navigateToListWithFilters()}
          onAlarmClick={handleAlarmClick}
          alarmCount={urgentWatchlistCount}
        />

        {/* 메인 탭 화면 본체 (탭 전환 시 마운트/언마운트) */}
        <main className="flex-1">
          {/* 1. 홈 탭 화면 */}
          {activeTab === 'home' && (
            <HomeScreen
              items={items}
              isLoading={isLoading}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
              onSelectItem={(item) => setSelectedItem(item)}
              onNavigateToList={navigateToListWithFilters}
              onRegionChange={handleRegionChange}
            />
          )}

          {/* 2. 공매 전체 목록 탭 화면 */}
          {activeTab === 'list' && (
            <AuctionListScreen
              items={items}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
              onSelectItem={(item) => setSelectedItem(item)}
              initialCategory={listCategory}
              initialRegion={listRegion}
              initialKeyword={listKeyword}
            />
          )}

          {/* 3. 관심 물건(찜) 탭 화면 */}
          {activeTab === 'watchlist' && (
            <WatchlistScreen
              items={watchlistItems}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
              onClearWatchlist={clearWatchlist}
              onSelectItem={(item) => setSelectedItem(item)}
              onExplore={() => setActiveTab('list')}
            />
          )}

          {/* 4. 마이페이지 탭 화면 */}
          {activeTab === 'my' && <MyScreen />}
        </main>

        {/* 하단 고정 탭 네비게이션 바 */}
        <AppBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedItem(null)
            setActiveTab(tab)
          }}
          watchlistCount={watchlist.length}
        />

        {/* 
          [물건 상세 화면 오버레이 레이어]
          특정 물건이 선택된 경우 전체 화면을 덮는 오버레이로 표출하여,
          뒤로가기 시 하위 목록 화면의 스크롤 위치와 누적 페이징 데이터를 손실 없이 온전히 보존합니다.
        */}
        {selectedItem && (
          <div className="absolute inset-0 z-50 bg-[#f8f9ff] overflow-y-auto">
            <div className="p-4">
              <AuctionDetailScreen
                item={selectedItem}
                isSaved={watchlist.includes(selectedItem.id)}
                onToggleWatchlist={toggleWatchlist}
                onBack={() => setSelectedItem(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
