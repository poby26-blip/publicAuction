import { useState } from 'react'
import { AppBottomNav, type AppTab } from './components/layout/AppBottomNav'
import { AppHeader } from './components/layout/AppHeader'
import { MOCK_GONG_ITEMS, type GongItem } from './data/mockAuctionData'
import { AuctionDetailScreen } from './pages/auction/AuctionDetailScreen'
import { AuctionListScreen } from './pages/auction/AuctionListScreen'
import { HomeScreen } from './pages/home/HomeScreen'
import { MyScreen } from './pages/my/MyScreen'
import { WatchlistScreen } from './pages/watchlist/WatchlistScreen'

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [watchlist, setWatchlist] = useState<string[]>(['gong-01', 'gong-04'])
  const [selectedItem, setSelectedItem] = useState<GongItem | null>(null)
  const [listCategory, setListCategory] = useState<string | undefined>()
  const [listRegion, setListRegion] = useState<string | undefined>()

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const navigateToListWithFilters = (cat?: string, reg?: string) => {
    setListCategory(cat)
    setListRegion(reg)
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
                  items={MOCK_GONG_ITEMS}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectItem={(item) => setSelectedItem(item)}
                  onNavigateToList={navigateToListWithFilters}
                />
              )}

              {activeTab === 'list' && (
                <AuctionListScreen
                  items={MOCK_GONG_ITEMS}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectItem={(item) => setSelectedItem(item)}
                  initialCategory={listCategory}
                  initialRegion={listRegion}
                />
              )}

              {activeTab === 'watchlist' && (
                <WatchlistScreen
                  items={MOCK_GONG_ITEMS}
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
