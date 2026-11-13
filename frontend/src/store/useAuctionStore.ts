/**
 * @file useAuctionStore.ts
 * @description '공매이지' 앱의 전역 상태 통합 관리 스토어 (Zustand 기반)
 * 
 * [설계 원칙 및 이점]
 * 1. 단일 진실 공급원(Single Source of Truth):
 *    - 1차 상품군(AssetGroup), 2차 세부카테고리(subCategory), 지역, 검색어, 정렬 상태를 중앙 집중 관리합니다.
 *    - 홈 화면 ➔ 공매 목록 화면 이동 시 파라미터 누락으로 인한 카테고리 풀림 버그를 원천 방지합니다.
 * 2. React Native 100% 호환성:
 *    - 순수 TypeScript 클로저 기반으로 DOM에 의존하지 않아, React Native 앱 전환 시 코드를 그대로 재사용합니다.
 * 3. 비동기 스토리지 추상화 연동:
 *    - storageService와 연계하여 관심물건(찜) 및 기일알림 상태를 웹(localStorage) 및 네이티브(AsyncStorage/MMKV)에 영구 보존합니다.
 */

import { create } from 'zustand'
import type { AppTab } from '../components/layout/AppNavigation'
import {
  type AssetGroup,
  type GongItem,
  resolveAssetGroup,
} from '../data/mockAuctionData'
import {
  loadWatchlistItems,
  saveWatchlistItems,
  clearWatchlistItems,
  loadBidAlertItems,
  saveBidAlertItems,
} from '../services/storageService'

/**
 * 전역 필터 및 검색 파라미터 인터페이스
 */
export interface FilterState {
  /** 1차 상품군 대분류 ('all' | 'real_estate' | 'movable' | 'car') */
  assetGroup: AssetGroup
  /** 2차 세부/테마 카테고리 ('all', 'apt', 'commercial', 'land', 'factory', 'new', 'half', 'goods', 'car') */
  subCategory: string
  /** 선택된 시/도 지역 ('전체', '서울', '경기', '전남광주' 등) */
  selectedRegion: string
  /** 선택된 공매 재산구분 유형 ('all', '신탁공매', '압류재산', '국유재산') */
  selectedType: string
  /** 정렬 기준 ('dDay': 마감임박순, 'discount': 할인율순, 'price': 최저가순, 'views': 인기순) */
  sortBy: 'dDay' | 'discount' | 'price' | 'views'
  /** 실시간 입력 중인 검색 키워드 */
  keyword: string
  /** Enter/버튼으로 확정된 OpenAPI 검색어 */
  committedQuery: string
  /** 동일 검색어 재조회 트리거용 카운터 */
  searchNonce: number
}

/**
 * 네비게이션 및 상세 오버레이 상태 인터페이스
 */
export interface NavigationState {
  /** 현재 활성화된 메인 탭 */
  activeTab: AppTab
  /** 현재 상세 화면에 열려 있는 물건 (null이면 메인 탭 표시) */
  selectedItem: GongItem | null
}

/**
 * 관심물건(찜) 및 기일알림 상태 인터페이스
 */
export interface WatchlistAlertState {
  /** 사용자가 찜한 공매 물건 목록 */
  watchlistItems: GongItem[]
  /** 스토리지 초기 복원 완료 여부 플래그 */
  isWatchlistInitialized: boolean
  /** 기일 알림 설정한 물건 목록 */
  alertItems: GongItem[]
  /** 알림 스토리지 초기 복원 여부 플래그 */
  isAlertInitialized: boolean
}

/**
 * 전체 스토어 상태 및 액션 인터페이스
 */
export interface AuctionStore extends FilterState, NavigationState, WatchlistAlertState {
  // --- [필터 및 검색 액션] ---
  setAssetGroup: (group: AssetGroup) => void
  setSubCategory: (sub: string) => void
  setSelectedRegion: (region: string) => void
  setSelectedType: (type: string) => void
  setSortBy: (sort: 'dDay' | 'discount' | 'price' | 'views') => void
  setKeyword: (kw: string) => void
  setCommittedQuery: (query: string) => void
  submitSearch: () => void
  clearSearch: () => void
  resetFilters: () => void

  // --- [화면 이동 및 네비게이션 액션] ---
  setActiveTab: (tab: AppTab) => void
  setSelectedItem: (item: GongItem | null) => void

  /**
   * 홈 화면 등에서 1차 상품군과 2차 세부카테고리를 온전히 유지한 채 공매 목록 탭으로 전환합니다.
   * - 파라미터 누락 버그를 원천 방어합니다.
   */
  navigateToListWithFilters: (params?: {
    assetGroup?: AssetGroup
    subCategory?: string
    region?: string
    keyword?: string
  }) => void

  // --- [관심물건 및 기일알림 비동기 액션] ---
  initStorage: () => Promise<void>
  toggleWatchlist: (item: GongItem) => Promise<void>
  removeSelectedWatchlist: (ids: string[]) => Promise<void>
  clearWatchlist: () => Promise<void>
  toggleBidAlert: (item: GongItem) => Promise<boolean>
}

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  // ---------------------------------------------------------------------------
  // [초기 상태 정의 (Initial State)]
  // ---------------------------------------------------------------------------
  assetGroup: 'all',
  subCategory: 'all',
  selectedRegion: '전체',
  selectedType: 'all',
  sortBy: 'dDay',
  keyword: '',
  committedQuery: '',
  searchNonce: 0,

  activeTab: 'home',
  selectedItem: null,

  watchlistItems: [],
  isWatchlistInitialized: false,
  alertItems: [],
  isAlertInitialized: false,

  // ---------------------------------------------------------------------------
  // [필터 및 검색 액션 (Filter Actions)]
  // ---------------------------------------------------------------------------
  setAssetGroup: (group) =>
    set({
      assetGroup: group,
      // 상품군이 변경되면 기존 세부 카테고리가 다른 상품군 소속일 경우 'all'로 리셋
      subCategory: 'all',
    }),

  setSubCategory: (sub) => set({ subCategory: sub }),

  setSelectedRegion: (region) => set({ selectedRegion: region }),

  setSelectedType: (type) => set({ selectedType: type }),

  setSortBy: (sortBy) => set({ sortBy }),

  setKeyword: (keyword) => set({ keyword }),

  setCommittedQuery: (committedQuery) =>
    set({
      committedQuery: committedQuery.trim(),
      searchNonce: get().searchNonce + 1,
    }),

  submitSearch: () => {
    const { keyword, searchNonce } = get()
    set({
      committedQuery: keyword.trim(),
      searchNonce: searchNonce + 1,
    })
  },

  clearSearch: () => {
    const { searchNonce } = get()
    set({
      keyword: '',
      committedQuery: '',
      searchNonce: searchNonce + 1,
    })
  },

  resetFilters: () =>
    set({
      assetGroup: 'all',
      subCategory: 'all',
      selectedRegion: '전체',
      selectedType: 'all',
      sortBy: 'dDay',
      keyword: '',
      committedQuery: '',
      searchNonce: get().searchNonce + 1,
    }),

  // ---------------------------------------------------------------------------
  // [네비게이션 액션 (Navigation Actions)]
  // ---------------------------------------------------------------------------
  setActiveTab: (activeTab) =>
    set({
      activeTab,
      selectedItem: null, // 탭 전환 시 상세 화면 오버레이 닫기
    }),

  setSelectedItem: (selectedItem) => set({ selectedItem }),

  navigateToListWithFilters: (params) => {
    const current = get()
    let targetGroup = params?.assetGroup
    const targetSub = params?.subCategory || 'all'

    // assetGroup이 명시되지 않은 경우 subCategory 코드로부터 유추 (예: 'apt' -> 'real_estate')
    if (!targetGroup) {
      if (targetSub === 'new' || targetSub === 'half') {
        // 테마 카테고리의 경우 기존 선택된 assetGroup이 있으면 유지, 없으면 'all'
        targetGroup = current.assetGroup !== 'all' ? current.assetGroup : 'all'
      } else {
        targetGroup = resolveAssetGroup(targetSub)
      }
    }

    set({
      assetGroup: targetGroup,
      subCategory: targetSub,
      selectedRegion: params?.region || current.selectedRegion || '전체',
      keyword: params?.keyword || '',
      committedQuery: (params?.keyword || '').trim(),
      searchNonce: current.searchNonce + 1,
      selectedItem: null, // 상세 오버레이 닫기
      activeTab: 'list', // 목록 탭 활성화
    })
  },

  // ---------------------------------------------------------------------------
  // [관심물건 & 기일알림 비동기 스토리지 액션 (Watchlist & Alert Actions)]
  // ---------------------------------------------------------------------------
  initStorage: async () => {
    try {
      const [savedWatchlist, savedAlerts] = await Promise.all([
        loadWatchlistItems(),
        loadBidAlertItems(),
      ])
      set({
        watchlistItems: savedWatchlist || [],
        isWatchlistInitialized: true,
        alertItems: savedAlerts || [],
        isAlertInitialized: true,
      })
    } catch (err) {
      console.error('[useAuctionStore] 스토리지 초기화 실패:', err)
      set({
        isWatchlistInitialized: true,
        isAlertInitialized: true,
      })
    }
  },

  toggleWatchlist: async (item) => {
    const { watchlistItems, isWatchlistInitialized } = get()
    if (!isWatchlistInitialized) return

    const exists = watchlistItems.some((w) => w.id === item.id)
    const nextList = exists
      ? watchlistItems.filter((w) => w.id !== item.id)
      : [item, ...watchlistItems]

    set({ watchlistItems: nextList })

    try {
      await saveWatchlistItems(nextList)
    } catch (err) {
      console.error('[useAuctionStore] 관심물건 저장 실패:', err)
    }
  },

  removeSelectedWatchlist: async (ids) => {
    const { watchlistItems } = get()
    const idSet = new Set(ids)
    const nextList = watchlistItems.filter((item) => !idSet.has(item.id))

    set({ watchlistItems: nextList })

    try {
      await saveWatchlistItems(nextList)
    } catch (err) {
      console.error('[useAuctionStore] 관심물건 선택 삭제 실패:', err)
    }
  },

  clearWatchlist: async () => {
    set({ watchlistItems: [] })
    try {
      await clearWatchlistItems()
    } catch (err) {
      console.error('[useAuctionStore] 관심물건 전체 비우기 실패:', err)
    }
  },

  toggleBidAlert: async (item) => {
    const { alertItems, isAlertInitialized } = get()
    if (!isAlertInitialized) return false

    const exists = alertItems.some((a) => a.id === item.id)
    const nextList = exists
      ? alertItems.filter((a) => a.id !== item.id)
      : [item, ...alertItems]

    set({ alertItems: nextList })

    try {
      await saveBidAlertItems(nextList)
      return !exists
    } catch (err) {
      console.error('[useAuctionStore] 기일알림 저장 실패:', err)
      return false
    }
  },
}))
