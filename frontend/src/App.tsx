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

  /** 사용자가 관심 등록(찜)한 물건의 ID 배열 */
  const [watchlist, setWatchlist] = useState<string[]>(['gong-01', 'gong-04'])

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

  // -------------------------------------------------------------------------
  // [이벤트 핸들러 (Event Handlers)]
  // -------------------------------------------------------------------------

  /**
   * 특정 물건의 관심 등록(찜) 여부를 토글합니다.
   * @param id - 토글할 물건의 고유 식별자 ID
   */
  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
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
   * @param cat - 선택된 카테고리 코드 (선택적)
   * @param reg - 선택된 시/도 지역명 (선택적)
   * @param kw - 입력된 검색 키워드 (선택적)
   */
  const navigateToListWithFilters = (cat?: string, reg?: string, kw?: string) => {
    setListCategory(cat)
    setListRegion(reg)
    setListKeyword(kw)
    setSelectedItem(null) // 상세 화면이 열려있었다면 닫기
    setActiveTab('list') // 목록 탭 활성화
  }

  // -------------------------------------------------------------------------
  // [렌더링 (View Layout)]
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f1f4f9] flex justify-center selection:bg-blue-200">
      {/* 모바일 뷰포트 컨테이너 (최대 폭 max-w-md = 448px 모바일 프레임) */}
      <div className="w-full max-w-md bg-[#f8f9ff] min-h-screen flex flex-col shadow-2xl relative border-x border-[#e2e8f0]/80 overflow-x-hidden">
        {/* 특정 물건이 선택된 경우: 상세 화면(`AuctionDetailScreen`)을 최상위 레이어로 오버레이 */}
        {selectedItem ? (
          <main className="flex-1 p-4">
            <AuctionDetailScreen
              item={selectedItem}
              isSaved={watchlist.includes(selectedItem.id)}
              onToggleWatchlist={toggleWatchlist}
              onBack={() => setSelectedItem(null)}
            />
          </main>
        ) : (
          <>
            {/* 앱 상단 고정 헤더 */}
            <AppHeader
              onSearchClick={() => navigateToListWithFilters()}
              onAlarmClick={() =>
                alert('최근 24시간 동안 마감 임박 물건 3건이 신규 등록되었습니다.')
              }
              alarmCount={watchlist.length}
            />

            {/* 메인 탭 화면 본체 */}
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
                  items={items}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
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
          </>
        )}
      </div>
    </div>
  )
}
