import { useState } from 'react'
import { GongBottomNav, type GongTab } from './components/stitch/GongBottomNav'
import { GongHeader } from './components/stitch/GongHeader'
import { MOCK_GONG_ITEMS, type GongItem } from './data/gongchajaData'
import { GongDetailScreen } from './pages/stitch/GongDetailScreen'
import { GongHomeScreen } from './pages/stitch/GongHomeScreen'
import { GongListScreen } from './pages/stitch/GongListScreen'
import { GongMyScreen } from './pages/stitch/GongMyScreen'
import { GongWatchlistScreen } from './pages/stitch/GongWatchlistScreen'

export default function App() {
  const [activeTab, setActiveTab] = useState<GongTab>('home')
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
      {/* Mobile Device Frame Container (max-w-md = 448px, iPhone Pro Max frame) */}
      <div className="w-full max-w-md bg-[#f8f9ff] min-h-screen flex flex-col shadow-2xl relative border-x border-[#e2e8f0]/80 overflow-x-hidden">
        {/* Detail Screen Overlay if item selected */}
        {selectedItem ? (
          <main className="flex-1 p-4">
            <GongDetailScreen
              item={selectedItem}
              isSaved={watchlist.includes(selectedItem.id)}
              onToggleWatchlist={toggleWatchlist}
              onBack={() => setSelectedItem(null)}
            />
          </main>
        ) : (
          <>
            {/* Header */}
            <GongHeader
              onSearchClick={() => navigateToListWithFilters()}
              onAlarmClick={() =>
                alert('최근 24시간 동안 마감 임박 물건 3건이 신규 등록되었습니다.')
              }
              alarmCount={watchlist.length}
            />

            {/* Main Tab Screen Body */}
            <main className="flex-1">
              {activeTab === 'home' && (
                <GongHomeScreen
                  items={MOCK_GONG_ITEMS}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectItem={(item) => setSelectedItem(item)}
                  onNavigateToList={navigateToListWithFilters}
                />
              )}

              {activeTab === 'list' && (
                <GongListScreen
                  items={MOCK_GONG_ITEMS}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectItem={(item) => setSelectedItem(item)}
                  initialCategory={listCategory}
                  initialRegion={listRegion}
                />
              )}

              {activeTab === 'watchlist' && (
                <GongWatchlistScreen
                  items={MOCK_GONG_ITEMS}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  onSelectItem={(item) => setSelectedItem(item)}
                  onExplore={() => setActiveTab('list')}
                />
              )}

              {activeTab === 'my' && <GongMyScreen />}
            </main>

            {/* Sticky Bottom Navigation Bar (Stitch 64px Spec) */}
            <GongBottomNav
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
