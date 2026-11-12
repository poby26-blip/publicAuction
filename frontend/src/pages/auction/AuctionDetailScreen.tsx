/**
 * @file AuctionDetailScreen.tsx
 * @description '공매이지' 앱의 공매 물건 상세 정보 화면 컴포넌트입니다.
 * 
 * [주요 기능]
 * 1. 온비드 물건상세 OpenAPI 비동기 연계 (다중 현장 사진, 등기 권리내역, 감정평가서, 차량/동산 제원)
 * 2. 최저입찰가, 감정평가액, 할인율 및 10% 입찰보증금 자동 계산
 * 3. 입찰 일정, 기관·명도책임·배분요구종기, 유의사항 실데이터 표출
 * 4. 식별번호·주소 원클릭 복사, 지도 위치 연계(네이버/카카오) 및 온비드 입찰 이동 지원
 */

import { useEffect, useState } from 'react'
import { PhotoGalleryModal } from '../../components/common/PhotoGalleryModal'
import { type ShowToastFn } from '../../components/common/Toast'
import {
  type GongDetailInfo,
  type GongItem,
  formatWon,
  getCategoryFallbackImage,
} from '../../data/mockAuctionData'
import { fetchOnbidItemDetail } from '../../services/onbidService'

/**
 * 금액을 1만원 이상이면 '억/만원' 단위로, 1만원 미만이면 '원' 단위로 포맷합니다.
 */
function formatDetailAmount(amount: number): string {
  return amount >= 10000 ? formatWon(amount) : `${amount.toLocaleString()}원`
}

/**
 * 클립보드 API 또는 execCommand Fallback을 사용해 텍스트를 안전하게 복사합니다.
 */
async function copyTextSafely(text: string): Promise<boolean> {
  if (!text) return false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 권한 제한·비HTTPS 환경 등에서는 DOM 복사 Fallback으로 진행
  }

  if (typeof document === 'undefined') return false
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

/** 지도 검색에 활용 가능한 유효 주소인지 판별합니다. */
function isSearchableAddress(address?: string): boolean {
  const trimmed = address?.trim()
  return Boolean(trimmed && trimmed !== '소재지 확인중')
}

/** 키-값 상세 정보 행 데이터 타입 */
interface DetailRowItem {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
  copyable?: boolean
}

/** key-value 정보 행 리스트를 일관된 스타일로 렌더링하는 로컬 헬퍼 */
function DetailRowList({
  rows,
  onCopy,
}: {
  rows: DetailRowItem[]
  onCopy?: (value: string, label: string) => void
}) {
  return (
    <div className="space-y-2 text-xs text-[#44474e]">
      {rows.map((row, idx) => (
        <div
          key={row.label}
          className={`flex justify-between items-start gap-3 py-1 ${
            idx < rows.length - 1 ? 'border-b border-[#f8f9ff]' : ''
          }`}
        >
          <span className="text-[#74777f] shrink-0">{row.label}</span>
          <div className="flex items-center justify-end gap-1.5 min-w-0">
            <strong
              className={`text-right break-keep ${
                row.highlight ? 'text-[#0051d5]' : 'text-[#0b1c30]'
              } ${row.mono ? 'font-mono' : ''}`}
            >
              {row.value}
            </strong>
            {row.copyable && onCopy && (
              <button
                type="button"
                onClick={() => onCopy(row.value, row.label)}
                className="px-1.5 py-0.5 rounded-md bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0051d5] text-[10px] font-bold shrink-0 inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                aria-label={`${row.label} 복사`}
              >
                <span className="material-symbols-outlined text-[12px]">content_copy</span>
                <span>복사</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * AuctionDetailScreen 컴포넌트의 Props 인터페이스
 */
interface AuctionDetailScreenProps {
  /** 표출할 온비드 공매 물건 실데이터 */
  item: GongItem

  /** 관심 등록(찜) 여부 */
  isSaved: boolean

  /** 기일 알림 설정 여부 (영구 저장 상태) */
  isAlertEnabled?: boolean

  /** 관심 등록 토글 콜백 */
  onToggleWatchlist: (item: GongItem) => void

  /** 기일 알림 설정 토글 콜백 */
  onToggleAlert?: (item: GongItem) => void

  /** 전역 토스트 팝업 표시 콜백 */
  onShowToast?: ShowToastFn

  /** 상세 화면 닫기 및 목록 복귀 콜백 */
  onBack: () => void
}

export function AuctionDetailScreen({
  item,
  isSaved,
  isAlertEnabled = false,
  onToggleWatchlist,
  onToggleAlert,
  onShowToast,
  onBack,
}: AuctionDetailScreenProps) {
  /** 현재 선택된 슬라이더 이미지 인덱스 */
  const [selectedImg, setSelectedImg] = useState<number>(0)

  /** 사진 전체보기 라이트박스 모달 열림 여부 */
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false)

  /** 온비드 물건상세 OpenAPI 비동기 조회 결과 */
  const [detail, setDetail] = useState<GongDetailInfo | null>(null)

  /** 상세 API 추가 조회 진행 여부 */
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false)

  /** 상세 화면 진입 시 온비드 물건상세 API 비동기 연동 */
  useEffect(() => {
    let isCancelled = false

    async function loadDetail() {
      setIsDetailLoading(true)
      try {
        const fetched = await fetchOnbidItemDetail(item)
        if (!isCancelled) {
          setDetail(fetched)
        }
      } finally {
        if (!isCancelled) {
          setIsDetailLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      isCancelled = true
    }
  }, [item])

  /** 법정 입찰보증금 (최저입찰가의 10%) 자동 계산 */
  const deposit = Math.floor(item.minimumPrice * 0.1)

  /** 카테고리별 안전 Fallback 이미지 */
  const fallbackImg = getCategoryFallbackImage(item.category)

  /** 상세 API 사진 목록이 있으면 우선 사용하고, 없으면 목록 이미지로 대체 */
  const galleryImages =
    detail?.photos && detail.photos.length > 0
      ? detail.photos
      : item.images.length > 0
        ? item.images
        : [item.imageUrl || fallbackImg]
  const safeSelectedImg = selectedImg < galleryImages.length ? selectedImg : 0

  /** 상세·목록 실데이터 병합 필드 */
  const displayAddress = detail?.roadAddress || detail?.jibunAddress || item.address
  const subJibunAddress =
    detail?.roadAddress &&
    detail?.jibunAddress &&
    detail.roadAddress !== detail.jibunAddress
      ? detail.jibunAddress
      : undefined
  const bidStatus = item.bidStatus || detail?.bidStatus
  const bidRound = detail?.bidRound || item.bidRound
  const orgName = detail?.orgName || item.orgName
  const rqstOrgName = detail?.rqstOrgName || item.rqstOrgName
  const bidMethod = detail?.bidMethod || item.bidMethod || '온비드 전자입찰 (인터넷)'
  const evictionResponsibility =
    detail?.evictionResponsibility || item.evictionResponsibility
  const distributionDeadline =
    detail?.distributionDeadline || item.distributionDeadline
  const bidPeriodText =
    item.bidStartDate && item.auctionDate && item.auctionDate !== '상시 매각'
      ? `${item.bidStartDate} ~ ${item.auctionDate}`
      : item.auctionDate || '일정 확인중'

  const scheduleRows: DetailRowItem[] = [
    item.cltrMngNo
      ? { label: '물건관리번호', value: item.cltrMngNo, mono: true, copyable: true }
      : { label: '온비드 식별번호', value: item.id, mono: true, copyable: true },
    ...(item.cltrMngNo && item.onbidCltrno
      ? [
          {
            label: '온비드 물건번호',
            value: String(item.onbidCltrno),
            mono: true,
            copyable: true,
          },
        ]
      : []),
    ...(bidStatus ? [{ label: '공고 진행상태', value: bidStatus, highlight: true }] : []),
    ...(bidRound ? [{ label: '공매 회차', value: `${bidRound}회차` }] : []),
    { label: '입찰기간', value: bidPeriodText },
    { label: '물건면적/제원', value: item.area },
    { label: '입찰방식', value: bidMethod, highlight: true },
    ...(orgName ? [{ label: '집행기관', value: orgName }] : []),
    ...(rqstOrgName && rqstOrgName !== orgName
      ? [{ label: '의뢰기관', value: rqstOrgName }]
      : []),
    ...(evictionResponsibility
      ? [{ label: '명도/인도책임', value: evictionResponsibility }]
      : []),
    ...(distributionDeadline
      ? [{ label: '배분요구종기', value: distributionDeadline }]
      : []),
    ...(detail?.firstNoticeDate
      ? [{ label: '최초 공고일', value: detail.firstNoticeDate }]
      : []),
  ]

  const vehicleRows: DetailRowItem[] = detail?.vehicleSpec
    ? [
        ...(detail.vehicleSpec.maker || detail.vehicleSpec.vehicleType
          ? [
              {
                label: '제조사 / 차종',
                value: [detail.vehicleSpec.maker, detail.vehicleSpec.vehicleType]
                  .filter(Boolean)
                  .join(' · '),
              },
            ]
          : []),
        ...(detail.vehicleSpec.model || detail.vehicleSpec.year
          ? [
              {
                label: '모델 / 연식',
                value: [
                  detail.vehicleSpec.model,
                  detail.vehicleSpec.year ? `${detail.vehicleSpec.year}년식` : undefined,
                ]
                  .filter(Boolean)
                  .join(' · '),
              },
            ]
          : []),
        ...(detail.vehicleSpec.plateNumber
          ? [{ label: '차량번호', value: detail.vehicleSpec.plateNumber, mono: true }]
          : []),
        ...(detail.vehicleSpec.mileageKm !== undefined
          ? [
              {
                label: '주행거리',
                value: `${detail.vehicleSpec.mileageKm.toLocaleString()} km`,
              },
            ]
          : []),
        ...(detail.vehicleSpec.fuel || detail.vehicleSpec.transmission
          ? [
              {
                label: '연료 / 변속기',
                value: [detail.vehicleSpec.fuel, detail.vehicleSpec.transmission]
                  .filter(Boolean)
                  .join(' · '),
              },
            ]
          : []),
        ...(detail.vehicleSpec.color
          ? [{ label: '차량색상', value: detail.vehicleSpec.color }]
          : []),
        ...(detail.vehicleSpec.displacement
          ? [{ label: '배기량', value: `${detail.vehicleSpec.displacement} cc` }]
          : []),
        ...(detail.deliveryPlace
          ? [{ label: '인도/보관장소', value: detail.deliveryPlace, copyable: true }]
          : []),
      ]
    : []

  const movableRows: DetailRowItem[] = detail?.movableSpec
    ? [
        ...(detail.movableSpec.maker
          ? [{ label: '제조사', value: detail.movableSpec.maker }]
          : []),
        ...(detail.movableSpec.model
          ? [{ label: '모델명', value: detail.movableSpec.model }]
          : []),
        ...(detail.movableSpec.year
          ? [{ label: '제조연도', value: detail.movableSpec.year }]
          : []),
        ...(detail.movableSpec.quantity
          ? [{ label: '수량', value: detail.movableSpec.quantity }]
          : []),
        ...(detail.movableSpec.size || detail.movableSpec.weight
          ? [
              {
                label: '규격 / 중량',
                value: [detail.movableSpec.size, detail.movableSpec.weight]
                  .filter(Boolean)
                  .join(' · '),
              },
            ]
          : []),
        ...(detail.movableSpec.storagePlace || detail.deliveryPlace
          ? [
              {
                label: '보관장소',
                value: (detail.movableSpec.storagePlace || detail.deliveryPlace)!,
                copyable: true,
              },
            ]
          : []),
      ]
    : []

  const noteItems = [
    detail?.locationNote
      ? { label: '위치 및 주변현황', content: detail.locationNote, isWarning: false }
      : null,
    detail?.usageNote
      ? { label: '이용현황', content: detail.usageNote, isWarning: false }
      : null,
    detail?.etcNote
      ? { label: '물건 상태 및 특이사항', content: detail.etcNote, isWarning: true }
      : null,
    detail?.incidentalCondition
      ? { label: '부대조건', content: detail.incidentalCondition, isWarning: true }
      : null,
    detail?.noticeNote
      ? { label: '입찰 유의사항', content: detail.noticeNote, isWarning: true }
      : null,
  ].filter(
    (entry): entry is { label: string; content: string; isWarning: boolean } =>
      entry !== null
  )

  /** 관리번호/주소 등 텍스트 원클릭 복사 및 토스트 안내 */
  const handleCopy = async (text: string, label: string) => {
    const copied = await copyTextSafely(text)
    if (copied) {
      onShowToast?.(`${label}(${text})가 복사되었습니다.`, {
        type: 'success',
        duration: 2200,
      })
    } else {
      onShowToast?.(`${label} 복사에 실패했습니다. 직접 선택해 복사해 주세요.`, {
        type: 'warning',
      })
    }
  }

  /** 네이버 지도 / 카카오맵 위치 검색 새 탭 열기 */
  const handleOpenMap = (provider: 'naver' | 'kakao', targetAddress: string) => {
    if (!isSearchableAddress(targetAddress)) {
      onShowToast?.('위치 검색이 가능한 상세 주소 정보가 없습니다.', { type: 'warning' })
      return
    }
    const encoded = encodeURIComponent(targetAddress.trim())
    const url =
      provider === 'naver'
        ? `https://map.naver.com/p/search/${encoded}`
        : `https://map.kakao.com/link/search/${encoded}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /** 관리번호 자동 복사 후 온비드 사이트 이동 안내 토스트 표시 */
  const handleOpenOnbid = async () => {
    const managementCode = item.cltrMngNo || item.id
    const copied = await copyTextSafely(managementCode)
    const message = copied
      ? `관리번호(${managementCode})를 복사했습니다. 온비드 검색창에 붙여넣어 바로 찾으세요.`
      : `최저입찰가 ${formatWon(item.minimumPrice)} · 온비드에서 관리번호(${managementCode})로 입찰 가능합니다.`

    onShowToast?.(message, {
      type: 'info',
      actionLabel: '온비드 이동',
      duration: 4000,
      onAction: () => {
        window.open('https://www.onbid.co.kr', '_blank', 'noopener,noreferrer')
      },
    })
  }

  /**
   * 모바일 Web Share API 또는 클립보드 복사를 통한 공매 물건 공유 핸들러
   */
  const handleShare = async () => {
    const shareText = `[공매이지] ${item.title} · 최저가 ${formatWon(item.minimumPrice)}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[공매이지] ${item.title}`,
          text: `온비드 공매 최저가 ${formatWon(item.minimumPrice)} (${item.discountRate}% 할인)`,
          url: window.location.href,
        })
      } catch { }
    } else {
      const copied = await copyTextSafely(`${shareText}\n${window.location.href}`)
      onShowToast?.(
        copied
          ? '물건 정보가 클립보드에 복사되었습니다.'
          : '물건 정보 복사에 실패했습니다.',
        { type: copied ? 'success' : 'warning' }
      )
    }
  }

  return (
    <div className="pb-28">
      {/* 1. 상단 고정 헤더 앱바 */}
      <div className="sticky top-0 z-40 bg-[#f8f9ff]/90 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between border-b border-[#e5eeff]">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#002046] hover:bg-[#e5eeff] transition-colors cursor-pointer"
          aria-label="뒤로가기"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <span className="text-sm font-bold text-[#002046] line-clamp-1 max-w-[200px] sm:max-w-md md:max-w-lg">
          {item.title}
        </span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#44474e] hover:bg-[#e5eeff] cursor-pointer"
            aria-label="공유"
          >
            <span className="material-symbols-outlined text-[22px]">share</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleWatchlist(item)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#44474e] hover:bg-[#e5eeff] cursor-pointer"
            aria-label="관심등록"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${isSaved ? 'text-[#ba1a1a] fill-1' : ''
                }`}
            >
              favorite
            </span>
          </button>
        </div>
      </div>

      {/* 본문 반응형 컨테이너: 모바일/폴더블 1열 -> 태블릿(md+) 2컬럼 분할 (좌측 sticky 요약 / 우측 상세) */}
      <div className="flex flex-col md:grid md:grid-cols-12 md:gap-6 md:p-6 md:items-start">
        {/* 좌측 컬럼: 사진 갤러리 + 제목·주소·지도 링크 (태블릿 이상 상단 고정) */}
        <div className="md:col-span-5 md:sticky md:top-[76px] flex flex-col">
          {/* 2. 대표 이미지 슬라이더 영역 */}
          <div className="relative aspect-4/3 bg-slate-900 overflow-hidden md:rounded-2xl md:border md:border-[#e5eeff] md:shadow-xs group">
            <img
              src={galleryImages[safeSelectedImg] || item.imageUrl || fallbackImg}
              alt={item.title}
              onClick={() => setIsGalleryOpen(true)}
              className="w-full h-full object-cover cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = fallbackImg
              }}
            />
            {/* 배지 및 버튼 가독성을 위한 상·하단 은은한 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15 pointer-events-none" />

            {/* D-Day 및 공매 유형 뱃지 */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ba1a1a] text-white shadow-xs">
                {item.dDay <= 0 ? '오늘 마감' : item.dDay > 365 ? '상시 매각' : `D-${item.dDay}`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-xs">
                {item.auctionType}
              </span>
            </div>

            {/* 우측 하단 순번 배지 & 사진 전체보기 버튼 */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              {galleryImages.length > 1 && (
                <span className="bg-black/60 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-xs pointer-events-none">
                  {safeSelectedImg + 1} / {galleryImages.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-[#002046] text-[11px] font-bold shadow-xs backdrop-blur-xs active:scale-95 transition-all cursor-pointer"
                aria-label="사진 전체보기 열기"
              >
                <span className="material-symbols-outlined text-[14px] text-[#0051d5]">
                  photo_library
                </span>
                <span>전체보기</span>
              </button>
            </div>
          </div>

          {/* 썸네일 리스트 */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 p-3 bg-white border-b border-[#e5eeff] md:border md:rounded-2xl md:mt-2.5 overflow-x-auto no-scrollbar">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    safeSelectedImg === idx
                      ? 'border-[#0051d5] scale-95'
                      : 'border-transparent opacity-60'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* 제목 및 주소 */}
          <div className="px-4 pt-4 md:px-1 md:pt-4">
            <div className="flex items-center flex-wrap gap-1.5 text-xs font-bold text-[#0051d5] mb-1">
              <span>한국자산관리공사 온비드</span>
              <span>·</span>
              <span>{item.usageName || item.auctionType}</span>
            </div>
            <h2 className="text-xl font-headline font-bold text-[#002046] leading-snug">
              {item.title}
            </h2>
            <p className="text-xs text-[#74777f] flex items-start mt-1.5">
              <span className="material-symbols-outlined text-[16px] mr-1 text-[#74777f] shrink-0 mt-0.5">
                location_on
              </span>
              <span>{displayAddress}</span>
            </p>
            {subJibunAddress && (
              <p className="text-[11px] text-[#74777f] pl-5 mt-0.5">
                지번: {subJibunAddress}
              </p>
            )}

            {/* 주소 복사 및 지도 위치 바로보기 액션 바 */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={() => handleCopy(displayAddress, '주소')}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#dce9ff] hover:bg-[#eff4ff] text-[#002046] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px] text-[#0051d5]">
                  content_copy
                </span>
                <span>주소 복사</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenMap('naver', displayAddress)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#dce9ff] hover:bg-[#eff4ff] text-[#002046] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px] text-[#059669]">map</span>
                <span>네이버 지도</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenMap('kakao', displayAddress)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#dce9ff] hover:bg-[#eff4ff] text-[#002046] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px] text-[#0051d5]">
                  explore
                </span>
                <span>카카오맵</span>
              </button>
            </div>
          </div>
        </div>

        {/* 우측 컬럼: 가격 요약 + 입찰일정 + 자산군별 제원 + 유의사항 + 감정/권리 내역 */}
        <div className="p-4 md:p-0 md:col-span-7 flex flex-col gap-5">

        {/* 가격 정보 카드 */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#eff4ff]">
            <div>
              <span className="text-xs text-[#74777f] font-medium">최저입찰가</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                {item.discountRate > 0 && (
                  <span className="text-2xl font-black text-[#059669]">
                    {item.discountRate}%
                  </span>
                )}
                <span className="text-2xl font-black text-[#002046]">
                  {formatWon(item.minimumPrice)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#74777f]">감정평가액</span>
              {item.appraisalPrice > item.minimumPrice ? (
                <p className="text-sm font-semibold text-[#74777f] line-through">
                  {formatWon(item.appraisalPrice)}
                </p>
              ) : (
                <p className="text-xs font-medium text-[#74777f]">
                  {item.appraisalPrice > 0 ? formatWon(item.appraisalPrice) : '미산정'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-[#eff4ff] rounded-xl">
              <span className="text-[#44474e] block text-[11px]">입찰보증금 (10%)</span>
              <strong className="text-sm font-bold text-[#002046] mt-0.5 block">
                {formatWon(deposit)}
              </strong>
            </div>
            <div className="p-3 bg-[#eff4ff] rounded-xl">
              <span className="text-[#44474e] block text-[11px]">유찰 이력</span>
              <strong className="text-sm font-bold text-[#ba1a1a] mt-0.5 block">
                {item.failCount > 0 ? `${item.failCount}회 유찰` : '신규공매'}
              </strong>
            </div>
          </div>
        </div>

        {/* 입찰 일정 및 상세 제원 카드 */}
        <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-headline font-bold text-[#002046] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">event</span>
              온비드 입찰일정 및 공고 정보
            </h3>
            {isDetailLoading && (
              <span className="text-[10px] font-semibold text-[#0051d5] animate-pulse">
                상세조회중...
              </span>
            )}
          </div>
          <DetailRowList rows={scheduleRows} onCopy={handleCopy} />

          {/* 부동산 세부 면적·지분 내역 */}
          {detail?.areaDetails && detail.areaDetails.length > 0 && (
            <div className="pt-2 border-t border-[#eff4ff] space-y-1.5">
              <span className="text-[11px] font-bold text-[#002046] block">
                세부 면적 및 지분 내역
              </span>
              <div className="space-y-1">
                {detail.areaDetails.map((areaItem, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] bg-[#f8f9ff] rounded-lg px-2.5 py-1.5 text-[#44474e] flex flex-wrap items-center justify-between gap-1"
                  >
                    <span className="font-semibold text-[#0b1c30]">
                      {[areaItem.kind, areaItem.area].filter(Boolean).join(' · ') || '면적 정보'}
                    </span>
                    {areaItem.shareInfo && (
                      <span className="text-[#74777f]">{areaItem.shareInfo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 자동차 / 동산 자산군별 상세 제원 카드 */}
        {vehicleRows.length > 0 && (
          <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-2.5">
            <h3 className="text-sm font-headline font-bold text-[#002046] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">
                directions_car
              </span>
              차량 상세 제원
            </h3>
            <DetailRowList rows={vehicleRows} onCopy={handleCopy} />
          </div>
        )}

        {movableRows.length > 0 && (
          <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-2.5">
            <h3 className="text-sm font-headline font-bold text-[#002046] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">
                inventory_2
              </span>
              동산 상세 제원
            </h3>
            <DetailRowList rows={movableRows} onCopy={handleCopy} />
          </div>
        )}

        {/* 현장 현황 및 입찰 유의·특이사항 (온비드 실데이터) */}
        {noteItems.length > 0 && (
          <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-3">
            <h3 className="text-sm font-headline font-bold text-[#002046] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">
                fact_check
              </span>
              물건 현황 및 입찰 유의사항
            </h3>
            <div className="space-y-2.5">
              {noteItems.map((note) => (
                <div
                  key={note.label}
                  className={`rounded-xl p-3 text-xs ${
                    note.isWarning
                      ? 'bg-rose-50/70 border border-rose-200/70'
                      : 'bg-[#f8f9ff] border border-[#e5eeff]'
                  }`}
                >
                  <span
                    className={`font-bold block mb-1 ${
                      note.isWarning ? 'text-[#ba1a1a]' : 'text-[#002046]'
                    }`}
                  >
                    {note.label}
                  </span>
                  <p className="text-[#44474e] leading-relaxed whitespace-pre-line break-keep">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 감정평가 이력 및 원문 평가서 카드 */}
        {detail?.appraisals && detail.appraisals.length > 0 && (
          <div className="bg-white border border-[#e5eeff] rounded-2xl p-4 shadow-2xs space-y-2.5">
            <h3 className="text-sm font-headline font-bold text-[#002046] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">
                description
              </span>
              감정평가 내역
            </h3>
            <div className="space-y-2">
              {detail.appraisals.map((appr, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#0b1c30] truncate">
                      {appr.orgName || '감정평가기관'}
                    </p>
                    <p className="text-[11px] text-[#74777f] mt-0.5">
                      {[
                        appr.date ? `평가일 ${appr.date}` : undefined,
                        appr.amount ? formatDetailAmount(appr.amount) : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {appr.reportUrl && (
                    <a
                      href={appr.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0051d5] text-[11px] font-bold shrink-0 flex items-center gap-1 transition-colors"
                    >
                      <span>평가서</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 등기부 주요 권리내역 및 권리분석 체크 배너 */}
        <div className="bg-[#eff4ff] border border-[#dce9ff] rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-[#0051d5] shrink-0 mt-0.5">
              security
            </span>
            <div className="text-xs flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h4 className="font-bold text-[#002046]">
                  공매이지 권리분석 체크
                </h4>
                {detail && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#0051d5]">
                    등기권리 {detail.rights.length}건 · 임대차 {detail.leaseCount}건
                  </span>
                )}
              </div>
              <p className="text-[#44474e] leading-relaxed">
                {detail?.rights && detail.rights.length > 0
                  ? '온비드 상세 API에서 조회된 등기부 주요 권리 내역입니다. 말소기준권리 및 인수 여부를 입찰 전 등기부등본과 함께 반드시 확인하세요.'
                  : '해당 공매 자산은 캠코 온비드 연동을 통해 조회된 물건입니다. 입찰 참여 전 등기부등본 및 감정평가서를 반드시 최종 확인하세요.'}
              </p>
            </div>
          </div>

          {isDetailLoading && !detail && (
            <div className="bg-white/75 rounded-xl p-3 text-[11px] text-[#44474e] animate-pulse">
              온비드 물건상세(현장사진·등기 권리·감정평가) 실데이터를 불러오는 중입니다...
            </div>
          )}

          {detail?.rights && detail.rights.length > 0 && (
            <div className="space-y-1.5">
              {detail.rights.map((right, idx) => (
                <div
                  key={idx}
                  className="bg-white/90 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs border border-[#dce9ff]/80"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] text-[10px] font-bold shrink-0">
                        {right.rightType}
                      </span>
                      {right.holderName && (
                        <span className="font-semibold text-[#0b1c30] truncate">
                          {right.holderName}
                        </span>
                      )}
                    </div>
                    {right.regDate && (
                      <span className="text-[10px] text-[#74777f] mt-0.5 block">
                        등기일 {right.regDate}
                      </span>
                    )}
                  </div>
                  {right.amount !== undefined && (
                    <span className="font-bold text-[#002046] shrink-0">
                      {formatDetailAmount(right.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 4. 하단 고정 액션 바 */}
      <div className="fixed bottom-0 left-0 right-0 md:max-w-5xl xl:max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border-t border-[#e2e8f0] p-3 md:px-6 flex items-center gap-3 z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
        {/* 태블릿 이상 하단 요약 */}
        <div className="hidden md:flex flex-col mr-auto">
          <span className="text-[11px] text-[#74777f]">
            최저입찰가 · 보증금(10%) {formatWon(deposit)}
          </span>
          <strong className="text-base font-extrabold text-[#002046]">
            {formatWon(item.minimumPrice)}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => onToggleAlert?.(item)}
          aria-pressed={isAlertEnabled}
          className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            isAlertEnabled
              ? 'border-[#0051d5] bg-[#eff4ff] text-[#0051d5]'
              : 'border-[#c4c6cf]/60 text-[#44474e] hover:bg-slate-50'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              isAlertEnabled ? 'text-[#0051d5] fill-1' : ''
            }`}
          >
            notifications
          </span>
          <span className="text-[10px] mt-0.5">기일알림</span>
        </button>

        <button
          type="button"
          onClick={handleOpenOnbid}
          className="flex-1 md:flex-none md:min-w-[240px] bg-[#0051d5] hover:bg-[#003ea8] active:scale-[0.99] text-white font-bold py-3.5 px-5 rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>온비드 입찰 참여하기</span>
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        </button>
      </div>

      {/* 5. 풀스크린 사진 전체보기 라이트박스 모달 */}
      {isGalleryOpen && (
        <PhotoGalleryModal
          title={item.title}
          images={galleryImages}
          currentIndex={safeSelectedImg}
          fallbackImage={fallbackImg}
          onSelectIndex={setSelectedImg}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  )
}

