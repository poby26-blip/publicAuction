/**
 * @file MyScreen.tsx
 * @description '공매이지' 앱의 마이페이지(알림 설정 및 앱 기본 설정/고객지원) 화면 컴포넌트입니다.
 * Google Stitch 마이페이지 디자인 토큰을 기반으로 구성되었으며,
 * 회원·인증·입찰내역 등 차기 버전(v2.0) 기능을 제외한 실용 설정 항목을 제공합니다.
 * 
 * [주요 기능]
 * 1. 상단 플로팅 토스트 알림 피드백 (설정 저장, API 새로고침, 캐시 정리 안내)
 * 2. 공매 및 입찰 알림 설정 4종 토글 스위치 (storageService를 통한 RN 호환 영구 저장)
 * 3. 공공데이터 포털 차세대 온비드 OpenAPI(B010003) 연동 상태 확인 및 실시간 새로고침
 * 4. 앱 기본 설정 & 고객지원 (캐시 정리, 공매 FAQ 모달, 이용약관/처리방침 모달, 버전 정보)
 */

import { useEffect, useState } from 'react'
import { type ShowToastFn } from '../../components/common/Toast'
import {
  type AlertSettings,
  DEFAULT_ALERT_SETTINGS,
  loadAlertSettings,
  resetAlertSettings,
  saveAlertSettings,
} from '../../services/storageService'

/**
 * MyScreen 컴포넌트의 Props 인터페이스
 */
interface MyScreenProps {
  /** 현재 온비드 OpenAPI 실시간 동기화(로딩) 중 여부 */
  isApiSyncing?: boolean

  /** 현재 로드되어 있는 온비드 실시간 공매 물건 건수 */
  syncedItemCount?: number

  /** 공공데이터 OpenAPI 실시간 데이터 재조회 핸들러 (로드된 건수 반환) */
  onRefreshApiData?: () => Promise<number>

  /** 앱 전역 플로팅 토스트 팝업 표시 콜백 */
  onShowToast?: ShowToastFn
}

/**
 * 공매 및 입찰 알림 스위치 항목 메타데이터 정의
 */
const ALERT_ITEMS: {
  key: keyof AlertSettings
  title: string
  desc: string
  badge?: string
  icon?: string
}[] = [
  {
    key: 'ddayAlert',
    title: '입찰 마감 D-1 / D-Day 알림',
    desc: '관심 등록한 공매 물건의 입찰 시작 및 마감 3시간 전 알림을 표시합니다.',
    badge: '필수권장',
  },
  {
    key: 'customFilterAlert',
    title: '조건 맞춤 신규 공매 등록 알림',
    desc: '관심 지역 및 주요 상품군의 신규 저가 공매 물건 소식을 받아봅니다.',
  },
  {
    key: 'priceCutAlert',
    title: '감정가 하향 & 유찰 속보 푸시',
    desc: '온비드 회차별 개찰 직후 최저입찰가 변동 및 유찰 결과를 빠르게 안내합니다.',
  },
  {
    key: 'nightSilence',
    title: '야간 알림 제한',
    desc: '심야 시간대(21:00 ~ 08:00) 동안 비긴급 푸시 알림을 음소거합니다.',
    icon: 'bedtime',
  },
]

/**
 * 온비드 공매 FAQ 핵심 문답 데이터
 */
const FAQ_ITEMS = [
  {
    q: '입찰보증금 10%는 언제 어떻게 납부하나요?',
    a: '온비드 전자입찰 참여 시 최저입찰가의 10% 이상에 해당하는 보증금을 지정된 가상계좌로 입찰 마감 전까지 입금해야 입찰이 유효하게 접수됩니다.',
  },
  {
    q: '유찰이 여러 번 되면 가격이 얼마나 내려가나요?',
    a: '일반적으로 공매 물건이 유찰될 때마다 매 회차 감정평가액 대비 약 10%씩 최저입찰가가 저감되며, 반값(50%) 이하의 알짜 물건도 다수 출현합니다.',
  },
  {
    q: '전남광주통합특별시 지역 검색은 어떻게 동작하나요?',
    a: '2026년 7월 행정통합을 반영하여 전남광주통합특별시뿐만 아니라 기존 광주광역시·전라남도 주소로 등록된 공고까지 한 번에 통합 조회해 드립니다.',
  },
  {
    q: '공매 물건 입찰 전 반드시 확인해야 할 사항은 무엇인가요?',
    a: '앱에서 제공하는 정보는 온비드 공개 데이터를 바탕으로 하며, 실제 입찰 전 온비드 공고 원문과 등기부등본·배분요구종기일 등 권리관계를 반드시 최종 확인하셔야 합니다.',
  },
]

export function MyScreen({
  isApiSyncing = false,
  syncedItemCount = 0,
  onRefreshApiData,
  onShowToast,
}: MyScreenProps) {
  // -------------------------------------------------------------------------
  // [로컬 상태 관리]
  // -------------------------------------------------------------------------

  /** 공매 및 입찰 알림 4종 스위치 상태 */
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS)

  /** 초기 비동기 로드 완료 여부 (Race Condition 방어) */
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  /** API 새로고침 로컬 진행 상태 */
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  /** FAQ 또는 약관 안내 모달 상태 ('faq' | 'policy' | null) */
  const [infoModal, setInfoModal] = useState<'faq' | 'policy' | null>(null)

  /**
   * 앱 구동/탭 진입 시 storageService로부터 저장된 알림 설정을 비동기 복원합니다.
   */
  useEffect(() => {
    let isMounted = true

    async function initSettings() {
      const loaded = await loadAlertSettings()
      if (isMounted) {
        setAlertSettings(loaded)
        setIsInitialized(true)
      }
    }

    initSettings()

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * 알림 설정 변경 시 storageService에 비동기 영구 저장합니다.
   */
  useEffect(() => {
    if (!isInitialized) return
    saveAlertSettings(alertSettings)
  }, [alertSettings, isInitialized])

  /**
   * 개별 알림 스위치 토글 핸들러
   */
  const handleToggleAlert = (key: keyof AlertSettings, title: string) => {
    const nextVal = !alertSettings[key]
    setAlertSettings((prev) => ({ ...prev, [key]: nextVal }))

    if (key === 'nightSilence') {
      onShowToast?.(
        nextVal
          ? '야간 알림 제한(21:00~08:00)이 설정되었습니다.'
          : '야간 알림 제한이 해제되었습니다.',
        { type: nextVal ? 'success' : 'info' }
      )
    } else {
      onShowToast?.(
        nextVal ? `'${title}'이 활성화되었습니다.` : `'${title}'이 해제되었습니다.`,
        { type: nextVal ? 'success' : 'info' }
      )
    }
  }

  /**
   * 공공데이터 포털 OpenAPI 실시간 새로고침 핸들러
   */
  const handleRefreshApi = async () => {
    if (isRefreshing || isApiSyncing) return
    if (!onRefreshApiData) {
      onShowToast?.('공공데이터 포털 OpenAPI v2.4와 정상 연동 중입니다.')
      return
    }

    setIsRefreshing(true)
    try {
      const count = await onRefreshApiData()
      onShowToast?.(`온비드 실시간 공매 데이터 ${count}건을 최신화했습니다.`)
    } catch {
      onShowToast?.('데이터 갱신 중 일시적인 오류가 발생했습니다.', { type: 'warning' })
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * 임시 설정 캐시 정리 핸들러 (관심물건 보관함은 안전하게 유지)
   */
  const handleClearCache = async () => {
    const defaults = await resetAlertSettings()
    setAlertSettings(defaults)
    onShowToast?.('임시 설정 캐시가 안전하게 초기화되었습니다. (관심물건 유지)', { type: 'info' })
  }

  /** 핵심 입찰 푸시 알림 중 1개라도 켜져 있는지 판정 */
  const isPushActive =
    alertSettings.ddayAlert || alertSettings.customFilterAlert || alertSettings.priceCutAlert

  return (
    <div className="flex flex-col gap-5 pb-24 px-4 pt-3 relative">
      {/* 1. 공매 및 입찰 알림 설정 섹션 (Stitch Section 3) */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#0051d5] text-[20px]">
              notifications
            </span>
            <h2 className="text-base font-headline font-bold text-[#002046]">
              공매 및 입찰 알림 설정
            </h2>
          </div>
          <span
            className={`text-[11px] font-semibold ${
              isPushActive ? 'text-[#0051d5]' : 'text-[#74777f]'
            }`}
          >
            {isPushActive ? '실시간 푸시 On' : '알림 Off'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-2xs p-4 flex flex-col gap-4">
          {ALERT_ITEMS.map((item, idx) => {
            const isChecked = alertSettings[item.key]
            return (
              <div key={item.key}>
                {idx > 0 && <div className="h-px bg-[#eff4ff] mb-4" />}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-[#002046]">{item.title}</span>
                      {item.badge && (
                        <span className="bg-[#ffdad6] text-[#93000a] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      {item.icon && (
                        <span className="material-symbols-outlined text-[16px] text-[#44474e]">
                          {item.icon}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#44474e] leading-relaxed">{item.desc}</p>
                  </div>

                  {/* 인터랙티브 토글 스위치 */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked}
                    aria-label={item.title}
                    onClick={() => handleToggleAlert(item.key, item.title)}
                    className={`flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ease-in-out relative p-0.5 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/40 cursor-pointer ${
                      isChecked ? 'bg-[#0051d5]' : 'bg-[#d3e4fe]'
                    }`}
                  >
                    <span
                      className={`block w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. 공공데이터 OpenAPI 연동 관리 카드 */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 px-1">
          <span className="material-symbols-outlined text-[#0051d5] text-[20px]">sync</span>
          <h2 className="text-base font-headline font-bold text-[#002046]">
            공공데이터 OpenAPI 연동
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-2xs p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#002046] shrink-0">
              <span className="material-symbols-outlined text-[22px]">database</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-[#002046]">
                  차세대 온비드 API (B010003)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] text-[10px] font-bold">
                  정상 연동
                </span>
              </div>
              <p className="text-xs text-[#44474e] mt-0.5 truncate">
                부동산·동산·자동차 통합 ({syncedItemCount}건 동기화)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshApi}
            disabled={isRefreshing || isApiSyncing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#eff4ff] text-[#0051d5] text-xs font-bold hover:bg-[#dce9ff] transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                isRefreshing || isApiSyncing ? 'animate-spin' : ''
              }`}
            >
              refresh
            </span>
            <span>새로고침</span>
          </button>
        </div>
      </section>

      {/* 3. 앱 기본 설정 & 고객지원 섹션 (Stitch Section 5) */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 px-1">
          <span className="material-symbols-outlined text-[#0051d5] text-[20px]">tune</span>
          <h2 className="text-base font-headline font-bold text-[#002046]">
            앱 기본 설정 &amp; 고객지원
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-2xs overflow-hidden divide-y divide-[#eff4ff]">
          {/* 버전 정보 */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#44474e] shrink-0">
                <span className="material-symbols-outlined text-[22px]">info</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#002046]">버전 정보</p>
                <p className="text-xs text-[#44474e]">
                  공매이지 v2.4 (공공데이터 표준규격 최신)
                </p>
              </div>
            </div>
            <span className="px-2 py-1 rounded-md bg-[#eff4ff] text-[#44474e] text-[10px] font-bold shrink-0">
              최신 버전
            </span>
          </div>

          {/* 캐시 데이터 정리 */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#44474e] shrink-0">
                <span className="material-symbols-outlined text-[22px]">cleaning_services</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#002046]">임시 설정 캐시 정리</p>
                <p className="text-xs text-[#44474e] truncate">
                  알림 설정을 기본값으로 복원 (관심물건 유지)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="px-3 py-1.5 rounded-lg bg-[#e5eeff] text-[#0051d5] text-xs font-bold hover:bg-[#0051d5] hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              정리
            </button>
          </div>

          {/* 온비드 공매 상담 & FAQ */}
          <button
            type="button"
            onClick={() => setInfoModal('faq')}
            className="w-full p-4 flex items-center justify-between gap-3 hover:bg-[#eff4ff]/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#44474e] shrink-0">
                <span className="material-symbols-outlined text-[22px]">support_agent</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#002046]">온비드 공매 가이드 &amp; FAQ</p>
                <p className="text-xs text-[#44474e]">
                  입찰보증금 납부 방법, 유찰 할인 및 권리분석 안내
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#c4c6cf] text-[20px] shrink-0">
              chevron_right
            </span>
          </button>

          {/* 이용약관 및 개인정보 처리방침 */}
          <button
            type="button"
            onClick={() => setInfoModal('policy')}
            className="w-full p-4 flex items-center justify-between gap-3 hover:bg-[#eff4ff]/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#44474e] shrink-0">
                <span className="material-symbols-outlined text-[22px]">description</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#002046]">
                  이용약관 및 개인정보 처리방침
                </p>
                <p className="text-xs text-[#44474e]">
                  공공데이터 출처 및 로컬 저장소 운영 안내
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#c4c6cf] text-[20px] shrink-0">
              chevron_right
            </span>
          </button>
        </div>

        <p className="text-center text-[11px] text-[#74777f] mt-2">
          © KAMCO 공공데이터 연계 서비스 · 공매이지
        </p>
      </section>

      {/* 4. 공매 FAQ / 이용약관 안내 모달 바텀시트 */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center"
          onClick={() => setInfoModal(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[82vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e5eeff]">
              <h3 className="text-base font-headline font-bold text-[#002046]">
                {infoModal === 'faq'
                  ? '온비드 공매 가이드 & FAQ'
                  : '이용약관 및 개인정보 처리방침'}
              </h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#74777f] hover:bg-[#eff4ff] cursor-pointer"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {infoModal === 'faq' ? (
              <div className="space-y-3.5 text-xs">
                {FAQ_ITEMS.map((faq, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff]">
                    <p className="font-bold text-[#002046] mb-1">Q. {faq.q}</p>
                    <p className="text-[#44474e] leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#44474e] leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] space-y-1.5">
                  <h4 className="font-bold text-[#002046]">1. 공공데이터 출처 및 면책 안내</h4>
                  <p>
                    본 서비스는 공공데이터포털(data.go.kr) 한국자산관리공사(KAMCO) 차세대 온비드 OpenAPI(B010003)를 실시간으로 연계하여 정보를 제공합니다. 실제 입찰 참여 전 온비드 공식 사이트에서 최신 공고문과 권리관계를 반드시 최종 확인하시기 바랍니다.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] space-y-1.5">
                  <h4 className="font-bold text-[#002046]">2. 개인정보 및 로컬 저장소 안내</h4>
                  <p>
                    현재 버전은 별도의 회원가입이나 서버 개인정보 수집 없이 동작하며, 찜한 관심 물건과 알림 설정 정보는 사용자의 기기(브라우저 로컬 스토리지) 내에만 안전하게 저장됩니다.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setInfoModal(null)}
              className="w-full mt-5 py-3 rounded-xl bg-[#002046] text-white text-xs font-bold hover:bg-[#1b365d] transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

