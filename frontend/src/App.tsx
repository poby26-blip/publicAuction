/**
 * @file App.tsx
 * @description '공매이지' 모바일 웹 하이브리드 앱의 최상위 루트 애플리케이션 컴포넌트입니다.
 * 탭 라우팅, 공공데이터포털 차세대 온비드 OpenAPI 실데이터 연동 파이프라인,
 * 지역별 동적 페칭 및 전역 상태(관심목록, 선택 물건 등)를 중앙에서 총괄 관리합니다.
 */

import { useEffect, useRef, useState } from 'react'
import { type ShowToastFn, Toast, type ToastOptions } from './components/common/Toast'
import { AppNavigation } from './components/layout/AppNavigation'
import { AppHeader } from './components/layout/AppHeader'
import { type GongItem } from './data/mockAuctionData'
import { AuctionDetailScreen } from './pages/auction/AuctionDetailScreen'
import { AuctionListScreen } from './pages/auction/AuctionListScreen'
import { HomeScreen } from './pages/home/HomeScreen'
import { MyScreen } from './pages/my/MyScreen'
import { WatchlistScreen } from './pages/watchlist/WatchlistScreen'
import { useAuctionStore } from './store/useAuctionStore'

export default function App() {
  // -------------------------------------------------------------------------
  // [전역 상태 관리 (Zustand Store 연동)]
  // -------------------------------------------------------------------------
  const {
    activeTab,
    setActiveTab,
    selectedItem,
    setSelectedItem,
    watchlistItems,
    alertItems,
    homeItems,
    isHomeLoading,
    fetchHomeData,
    initStorage,
    toggleWatchlist: storeToggleWatchlist,
    toggleBidAlert: storeToggleBidAlert,
    clearWatchlist: storeClearWatchlist,
    removeSelectedWatchlist: storeRemoveSelectedWatchlist,
    navigateToListWithFilters: storeNavigateToListWithFilters,
  } = useAuctionStore()

  /** 하트 UI 활성화 여부 판정 및 뱃지 카운트용 관심물건 ID 파생 배열 */
  const watchlist = watchlistItems.map((item) => item.id)

  /** 입찰 마감이 3일 이내로 임박한 관심물건 수 */
  const urgentWatchlistCount = watchlistItems.filter((item) => item.dDay <= 3).length

  /** 기일알림 활성화 여부 판정용 ID 배열 */
  const alertIds = alertItems.map((item) => item.id)

  /** 관심물건 + 기일알림 물건 중 3일 이내 임박 물건 (중복 ID 제거) */
  const urgentAlarmItems = (() => {
    const map = new Map<string, GongItem>()
    for (const item of watchlistItems) {
      if (item.dDay <= 3) map.set(item.id, item)
    }
    for (const item of alertItems) {
      if (item.dDay <= 3 && !map.has(item.id)) map.set(item.id, item)
    }
    return Array.from(map.values())
  })()
  const totalUrgentAlarmCount = urgentAlarmItems.length

  /** 상세 화면 고정 오버레이 스크롤 컨테이너 Ref */
  const detailOverlayRef = useRef<HTMLDivElement | null>(null)

  /**
   * 상세 화면 오버레이 진입 시:
   * 1) 오버레이 자체 스크롤을 항상 최상단(scrollTop = 0)으로 초기화합니다.
   * 2) 뒤쪽 목록/홈 화면의 window 스크롤이 움직이지 않도록 body 스크롤을 잠그고,
   *    상세를 닫을 때 기존 overflow 스타일을 복원해 원래 목록 스크롤 위치를 그대로 보존합니다.
   */
  useEffect(() => {
    if (!selectedItem) return

    if (detailOverlayRef.current) {
      detailOverlayRef.current.scrollTop = 0
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [selectedItem])

  /** 앱 전역 플로팅 토스트 팝업 상태 */
  const [toast, setToast] = useState<{
    message: string | null
    options?: ToastOptions
  }>({ message: null })
  const toastTimerRef = useRef<number | null>(null)

  /** 앱 언마운트 시 토스트 타이머 정리 */
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  /**
   * 앱 전역 어디서든 호출 가능한 플로팅 토스트 표시 함수
   */
  const showToast: ShowToastFn = (message, options) => {
    setToast({ message, options })
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast({ message: null })
    }, options?.duration ?? 2500)
  }

  /** 토스트 수동 닫기 */
  const dismissToast = () => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current)
    }
    setToast({ message: null })
  }

  // -------------------------------------------------------------------------
  // [초기 스토리지 복원 (Storage Initialization)]
  // -------------------------------------------------------------------------

  /**
   * 앱 마운트 시 영구 스토리지에서 관심물건 및 기일알림 데이터를 비동기로 복원합니다.
   */
  useEffect(() => {
    initStorage()
  }, [initStorage])

  // -------------------------------------------------------------------------
  // [이벤트 핸들러 (Event Handlers)]
  // -------------------------------------------------------------------------

  /**
   * 특정 공매 물건의 관심 등록(찜) 여부를 토글합니다.
   * - 이미 보관 중인 물건이면 목록에서 제거하고, 없으면 최신 항목(배열 맨 앞)으로 추가합니다.
   * @param targetItem - 토글할 공매 물건(GongItem) 객체
   */
  const toggleWatchlist = async (targetItem: GongItem) => {
    const exists = watchlistItems.some((item) => item.id === targetItem.id)
    await storeToggleWatchlist(targetItem)
    showToast(
      exists
        ? '관심 공매 보관함에서 해제되었습니다.'
        : '관심 공매 보관함에 담았습니다.',
      { type: exists ? 'info' : 'success', duration: 2000 }
    )
  }

  /**
   * 특정 공매 물건의 기일 알림 설정 여부를 토글하고 스토리지에 영구 저장합니다.
   * @param targetItem - 기일 알림을 토글할 공매 물건(GongItem) 객체
   */
  const toggleBidAlert = async (targetItem: GongItem) => {
    const isAdded = await storeToggleBidAlert(targetItem)
    showToast(
      isAdded
        ? '입찰 마감일 알림이 설정되었습니다.'
        : '입찰 마감일 알림이 해제되었습니다.',
      { type: isAdded ? 'success' : 'info', duration: 2200 }
    )
  }

  /**
   * 보관함에 담긴 모든 관심물건을 일괄 삭제하고 스토리지를 초기화합니다.
   */
  const clearWatchlist = async () => {
    await storeClearWatchlist()
    showToast('관심 공매 보관함이 모두 비워졌습니다.', { type: 'info' })
  }

  /**
   * 보관함에서 사용자가 선택한 여러 건의 관심물건을 일괄 삭제합니다.
   * @param targetIds - 삭제할 공매 물건 ID 배열
   */
  const removeWatchlistItems = async (targetIds: string[]) => {
    if (targetIds.length === 0) return
    const idSet = new Set(targetIds)
    const removedCount = watchlistItems.filter((item) => idSet.has(item.id)).length
    if (removedCount === 0) return

    await storeRemoveSelectedWatchlist(targetIds)
    showToast(`선택한 ${removedCount}건의 관심 물건이 삭제되었습니다.`, {
      type: 'info',
      duration: 2200,
    })
  }

  /**
   * 홈 화면에서 카테고리 클릭, 검색창 엔터, '더보기' 클릭 시
   * 전역 스토어 필터를 갱신하고 공매 목록 화면(`AuctionListScreen`)으로 화면을 전환합니다.
   * @param cat - 선택된 카테고리 코드 (생략 시 기본 'all')
   * @param reg - 선택된 시/도 지역명 (생략 시 기본 '전체')
   * @param kw - 입력된 검색 키워드 (생략 시 기본 '')
   */
  const handleNavigateToList = (cat?: string, reg?: string, kw?: string) => {
    storeNavigateToListWithFilters({
      subCategory: cat,
      region: reg,
      keyword: kw,
    })
  }

  /**
   * 상단 헤더 종 모양 알림 버튼 클릭 핸들러
   * - alert()/confirm() 대신 토스트 팝업으로 긴급 마감 안내 및 원클릭 이동을 제공합니다.
   */
  const handleAlarmClick = () => {
    if (totalUrgentAlarmCount > 0) {
      showToast(
        `입찰 마감이 3일 이내로 임박한 관심·알림 물건이 ${totalUrgentAlarmCount}건 있습니다.`,
        {
          type: 'warning',
          actionLabel: '보러가기',
          duration: 3800,
          onAction: () => {
            if (urgentWatchlistCount > 0) {
              setSelectedItem(null)
              setActiveTab('watchlist')
            } else {
              setSelectedItem(urgentAlarmItems[0])
            }
          },
        }
      )
      return
    }

    const urgentMarketCount = homeItems.filter((item) => item.dDay <= 3).length
    if (alertItems.length > 0 && urgentMarketCount === 0) {
      showToast(
        `기일 알림 설정 ${alertItems.length}건 · 현재 3일 이내 마감 임박 물건은 없습니다.`,
        { type: 'info' }
      )
      return
    }

    showToast(
      urgentMarketCount > 0
        ? `관심·알림 임박 없음 · 전체 공매 임박 물건 ${urgentMarketCount}건 등록 중`
        : '현재 등록된 긴급 마감 알림이 없습니다.',
      { type: 'info' }
    )
  }

  // -------------------------------------------------------------------------
  // [렌더링 (View Layout)]
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f8f9ff] selection:bg-blue-200">
      {/* 반응형 앱 프레임: 태블릿(>=768px) 사이드 레일 + 전폭 메인 뷰포트 (좌우 공백 제거) */}
      <div className="w-full bg-[#f8f9ff] min-h-screen flex flex-col md:flex-row relative overflow-x-clip">
        {/* 태블릿(>=768px) 좌측 사이드 레일 / 모바일·폴더블(<768px) 하단 고정 탭 바 */}
        <AppNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedItem(null)
            setActiveTab(tab)
          }}
          watchlistCount={watchlist.length}
        />

        {/* 우측 메인 콘텐츠 칼럼 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 앱 상단 고정 헤더 */}
          <AppHeader
            activeTab={activeTab}
            onSearchClick={() => handleNavigateToList()}
            onAlarmClick={handleAlarmClick}
            alarmCount={totalUrgentAlarmCount}
          />

          {/* 메인 탭 화면 본체 (탭 전환 시 마운트/언마운트) */}
          <main className="flex-1 md:pb-8">
            {/* 1. 홈 탭 화면 (자체 스토어 바인딩) */}
            {activeTab === 'home' && (
              <HomeScreen
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
                onSelectItem={(item) => setSelectedItem(item)}
                onNavigateToList={handleNavigateToList}
              />
            )}

            {/* 2. 공매 전체 목록 탭 화면 (자체 스토어 바인딩) */}
            {activeTab === 'list' && (
              <AuctionListScreen
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
                onSelectItem={(item) => setSelectedItem(item)}
              />
            )}

            {/* 3. 관심 물건(찜) 탭 화면 */}
            {activeTab === 'watchlist' && (
              <WatchlistScreen
                items={watchlistItems}
                watchlist={watchlist}
                alertIds={alertIds}
                onToggleWatchlist={toggleWatchlist}
                onRemoveSelectedWatchlist={removeWatchlistItems}
                onClearWatchlist={clearWatchlist}
                onSelectItem={(item) => setSelectedItem(item)}
                onExplore={() => setActiveTab('list')}
                onShowToast={showToast}
              />
            )}

            {/* 4. 마이페이지 탭 화면 */}
            {activeTab === 'my' && (
              <MyScreen
                isApiSyncing={isHomeLoading}
                syncedItemCount={homeItems.length}
                onRefreshApiData={() => fetchHomeData('전체', 'all')}
                onShowToast={showToast}
              />
            )}
          </main>
        </div>

        {/* 
          [물건 상세 화면 오버레이 레이어]
          뷰포트 기준 fixed 독립 스크롤 오버레이로 표출하여:
          1) 상세 화면 진입 시 항상 최상단(scrollTop = 0)부터 시작하고,
          2) 뒤로가기 시 하위 목록 화면의 스크롤 위치와 누적 페이징 데이터를 손실 없이 온전히 보존합니다.
        */}
        {selectedItem && (
          <div
            ref={detailOverlayRef}
            className="fixed inset-0 w-full z-50 bg-[#f8f9ff] overflow-y-auto overscroll-contain"
          >
            <AuctionDetailScreen
              key={selectedItem.id}
              item={selectedItem}
              isSaved={watchlist.includes(selectedItem.id)}
              isAlertEnabled={alertIds.includes(selectedItem.id)}
              onToggleWatchlist={toggleWatchlist}
              onToggleAlert={toggleBidAlert}
              onShowToast={showToast}
              onBack={() => setSelectedItem(null)}
            />
          </div>
        )}

        {/* 앱 전역 플로팅 토스트 팝업 (모든 탭·상세 오버레이 최상위 계층 z-[60]) */}
        <Toast
          message={toast.message}
          type={toast.options?.type}
          actionLabel={toast.options?.actionLabel}
          onAction={toast.options?.onAction}
          onDismiss={dismissToast}
        />
      </div>
    </div>
  )
}
