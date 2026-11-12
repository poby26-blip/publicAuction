/**
 * @file storageService.ts
 * @description '공매이지' 앱의 영구 로컬 저장소 추상화 레이어(Storage Abstraction Layer)입니다.
 * 
 * [아키텍처 목적 및 React Native 전환 대비]
 * - UI 컴포넌트(App.tsx 등)가 브라우저 전용 `localStorage`에 직접 의존하지 않도록 분리합니다.
 * - React Native 표준 라이브러리(`@react-native-async-storage/async-storage`)와 동일한
 *   비동기(Promise) 기반 인터페이스를 채택하여, 향후 모바일 네이티브 앱 전환 시
 *   비즈니스 로직 수정 없이 어댑터(storageAdapter) 구현체만 교체하면 즉시 동작합니다.
 */

import { type GongItem } from '../data/mockAuctionData'

/**
 * 앱 전역 로컬 저장소 키 상수 관리 객체
 */
export const STORAGE_KEYS = {
  /** 관심 등록(찜)한 공매 물건(GongItem[]) 목록 키 */
  WATCHLIST_ITEMS: 'gong_watchlist_items_v1',
} as const

/**
 * 웹(localStorage) 및 React Native(AsyncStorage / MMKV) 호환용 공통 스토리지 어댑터 인터페이스
 */
export interface AppStorageAdapter {
  /** 지정된 키의 문자열 값을 비동기로 조회합니다. */
  getItem(key: string): Promise<string | null>
  /** 지정된 키에 문자열 값을 비동기로 저장합니다. */
  setItem(key: string, value: string): Promise<void>
  /** 지정된 키의 데이터를 비동기로 삭제합니다. */
  removeItem(key: string): Promise<void>
}

/**
 * [현재 활성 어댑터: 웹 브라우저 localStorage 구현체]
 * - window / localStorage가 존재하지 않는 환경에서도 ReferenceError 없이 안전하게 동작합니다.
 * 
 * ---------------------------------------------------------------------------
 * [React Native 앱 이식 시 교체 가이드]
 * 1) AsyncStorage 사용 시:
 *    import AsyncStorage from '@react-native-async-storage/async-storage'
 *    const activeStorageAdapter: AppStorageAdapter = AsyncStorage
 * 
 * 2) MMKV (고성능 동기 스토리지) 사용 시:
 *    import { MMKV } from 'react-native-mmkv'
 *    const mmkv = new MMKV()
 *    const activeStorageAdapter: AppStorageAdapter = {
 *      getItem: async (k) => mmkv.getString(k) ?? null,
 *      setItem: async (k, v) => { mmkv.set(k, v) },
 *      removeItem: async (k) => { mmkv.delete(k) },
 *    }
 * ---------------------------------------------------------------------------
 */
const webLocalStorageAdapter: AppStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return null
    }
    return window.localStorage.getItem(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return
    }
    window.localStorage.setItem(key, value)
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return
    }
    window.localStorage.removeItem(key)
  },
}

/** 현재 플랫폼에서 사용 중인 스토리지 어댑터 인스턴스 */
let activeStorageAdapter: AppStorageAdapter = webLocalStorageAdapter

/**
 * 런타임 플랫폼 환경에 맞춰 스토리지 어댑터를 동적으로 주입할 수 있습니다.
 * (예: React Native 엔트리포인트에서 AsyncStorage/MMKV 어댑터 주입)
 */
export function setStorageAdapter(adapter: AppStorageAdapter): void {
  activeStorageAdapter = adapter
}

// ---------------------------------------------------------------------------
// [관심물건(Watchlist) 전용 도메인 스토리지 API]
// ---------------------------------------------------------------------------

/**
 * 로컬 저장소에 영구 보관된 관심물건(GongItem[]) 목록을 비동기로 불러옵니다.
 * - 데이터가 없거나 JSON 파싱에 실패한 경우 안전하게 빈 배열([])을 반환합니다.
 * 
 * @returns 저장된 GongItem 배열 Promise
 */
export async function loadWatchlistItems(): Promise<GongItem[]> {
  try {
    const raw = await activeStorageAdapter.getItem(STORAGE_KEYS.WATCHLIST_ITEMS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('[storageService] 관심물건 복원 실패:', err)
    return []
  }
}

/**
 * 관심물건(GongItem[]) 목록을 JSON 문자열로 직렬화하여 로컬 저장소에 비동기 영구 저장합니다.
 * 
 * @param items - 저장할 GongItem 객체 배열
 */
export async function saveWatchlistItems(items: GongItem[]): Promise<void> {
  try {
    await activeStorageAdapter.setItem(STORAGE_KEYS.WATCHLIST_ITEMS, JSON.stringify(items))
  } catch (err) {
    console.error('[storageService] 관심물건 저장 실패:', err)
  }
}

/**
 * 로컬 저장소에 보관된 모든 관심물건 데이터를 일괄 삭제합니다.
 */
export async function clearWatchlistItems(): Promise<void> {
  try {
    await activeStorageAdapter.removeItem(STORAGE_KEYS.WATCHLIST_ITEMS)
  } catch (err) {
    console.error('[storageService] 관심물건 초기화 실패:', err)
  }
}

