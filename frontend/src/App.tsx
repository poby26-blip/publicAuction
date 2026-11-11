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
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [items, setItems] = useState<GongItem[]>(MOCK_GONG_ITEMS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [watchlist, setWatchlist] = useState<string[]>(['gong-01', 'gong-04'])
  const [selectedItem, setSelectedItem] = useState<GongItem | null>(null)
  const [listCategory, setListCategory] = useState<string | undefined>()
  const [listRegion, setListRegion] = useState<string | undefined>()
  const [listKeyword, setListKeyword] = useState<string | undefined>()

  // 앱 시작 시 차세대 온비드 OpenAPI 실데이터 연동 호출
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

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // 상단 지역 칩 변경 시 해당 지역의 온비드 OpenAPI 실데이터 동적 페칭
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

  const navigateToListWithFilters = (cat?: string, reg?: string, kw?: string) => {
    setListCategory(cat)
    setListRegion(reg)
    setListKeyword(kw)
    setSelectedItem(null)
    setActiveTab('list')
  }

  return (
    <div className="min-h-screen bg-[#f1f4f9] flex justify-center selection:bg-blue-200">
      {/* Mobile Device Frame Container (max-w-md = 448px) */}
      <div className="w-full max-w-md bg-[#f8f9ff] min-h-screen flex flex-col shadow-2xl relative border-x border-[#e2e8f0]/80 overflow-x-hidden">
        {/* Detail Screen Overlay if item selected */}
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
            {/* Header */}
            <AppHeader
              onSearchClick={() => navigateToListWithFilters()}
              onAlarmClick={() =>
                alert('최근 24시간 동안 마감 임박 물건 3건이 신규 등록되었습니다.')
              }
              alarmCount={watchlist.length}
            />

            {/* Main Tab Screen Body */}
            <main className="flex-1">
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

              {activeTab === 'watchlist' && (
                <WatchlistScreen
                  items={items}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectItem={(item) => setSelectedItem(item)}
                  onExplore={() => setActiveTab('list')}
                />
              )}

              {activeTab === 'my' && <MyScreen />}
            </main>

            {/* Sticky Bottom Navigation Bar */}
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
