/**
 * @file PhotoGalleryModal.tsx
 * @description 공매 물건의 현장 사진을 원본 비율로 크게 감상하고 확대·탐색할 수 있는 풀스크린 라이트박스 모달입니다.
 * 
 * [주요 기능]
 * 1. 모바일·폴더블·태블릿 전 화면을 덮는 z-[70] 풀스크린 라이트박스
 * 2. 터치 스와이프(좌/우), 네비게이션 버튼 및 키보드(ESC, 방향키) 지원
 * 3. 1x ↔ 확대 보기 전환 (세부 현장·차량 번호판 등 정밀 확인용 스크롤 팬 지원)
 * 4. 하단 썸네일 스트립을 통한 즉시 이동 및 상세 슬라이더 인덱스 동기화
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface PhotoGalleryModalProps {
  /** 상단 헤더에 표시할 물건명 */
  title: string
  /** 표시할 이미지 URL 목록 */
  images: string[]
  /** 현재 선택된 이미지 인덱스 */
  currentIndex: number
  /** 이미지 로드 실패 시 사용할 대체 이미지 URL */
  fallbackImage: string
  /** 모달 내 이미지 전환 시 부모 인덱스 동기화 콜백 */
  onSelectIndex: (index: number) => void
  /** 모달 닫기 콜백 */
  onClose: () => void
}

export function PhotoGalleryModal({
  title,
  images,
  currentIndex,
  fallbackImage,
  onSelectIndex,
  onClose,
}: PhotoGalleryModalProps) {
  const [isZoomed, setIsZoomed] = useState<boolean>(false)
  const touchStartXRef = useRef<number | null>(null)

  const totalCount = images.length
  const safeIndex =
    totalCount > 0 ? Math.min(Math.max(currentIndex, 0), totalCount - 1) : 0
  const activeSrc = images[safeIndex] || fallbackImage

  const handleSelect = useCallback(
    (nextIndex: number) => {
      if (totalCount === 0) return
      const normalized = (nextIndex + totalCount) % totalCount
      setIsZoomed(false)
      onSelectIndex(normalized)
    },
    [onSelectIndex, totalCount]
  )

  const handlePrev = useCallback(() => {
    handleSelect(safeIndex - 1)
  }, [handleSelect, safeIndex])

  const handleNext = useCallback(() => {
    handleSelect(safeIndex + 1)
  }, [handleSelect, safeIndex])

  /** 키보드 단축키(ESC 닫기, 좌/우 화살표 이동) 지원 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (totalCount > 1 && e.key === 'ArrowLeft') {
        handlePrev()
      } else if (totalCount > 1 && e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleNext, handlePrev, onClose, totalCount])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 사진 전체보기`}
      className="fixed inset-0 z-[70] bg-black/95 text-white flex flex-col select-none"
    >
      {/* 1. 상단 컨트롤 헤더 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-white truncate">{title}</p>
          <p className="text-[11px] text-white/70 mt-0.5">
            {totalCount > 1
              ? `${safeIndex + 1} / ${totalCount}장 · 사진을 눌러 확대`
              : '원본 사진 보기 · 사진을 눌러 확대'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className={`h-9 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
              isZoomed
                ? 'bg-[#0051d5] text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            aria-label={isZoomed ? '축소 보기' : '확대 보기'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isZoomed ? 'zoom_out' : 'zoom_in'}
            </span>
            <span className="hidden sm:inline">{isZoomed ? '원래대로' : '확대'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="사진 전체보기 닫기"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
      </div>

      {/* 2. 메인 이미지 뷰포트 (스와이프 · 확대 스크롤 · 좌우 이동 버튼) */}
      <div
        className={`relative flex-1 min-h-0 flex ${
          isZoomed ? 'overflow-auto items-start justify-start p-4' : 'overflow-hidden items-center justify-center p-2 sm:p-6'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isZoomed) {
            onClose()
          }
        }}
        onTouchStart={(e) => {
          if (isZoomed || totalCount <= 1) return
          touchStartXRef.current = e.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(e) => {
          if (touchStartXRef.current === null || isZoomed || totalCount <= 1) return
          const endX = e.changedTouches[0]?.clientX
          if (typeof endX === 'number') {
            const deltaX = endX - touchStartXRef.current
            if (deltaX > 45) {
              handlePrev()
            } else if (deltaX < -45) {
              handleNext()
            }
          }
          touchStartXRef.current = null
        }}
      >
        <img
          src={activeSrc}
          alt={`${title} 현장 사진 ${safeIndex + 1}`}
          onClick={() => setIsZoomed((prev) => !prev)}
          onError={(e) => {
            e.currentTarget.src = fallbackImage
          }}
          className={`rounded-lg transition-all duration-200 ${
            isZoomed
              ? 'w-[185%] sm:w-[150%] md:w-[135%] max-w-none h-auto cursor-zoom-out mx-auto'
              : 'max-w-full max-h-full object-contain cursor-zoom-in'
          }`}
        />

        {/* 이전/다음 화살표 버튼 (다중 사진일 때 표출) */}
        {totalCount > 1 && !isZoomed && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="이전 사진"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="다음 사진"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            </button>
          </>
        )}
      </div>

      {/* 3. 하단 썸네일 스트립 (다중 사진일 때 표출) */}
      {totalCount > 1 && (
        <div className="px-4 py-3 bg-black/75 border-t border-white/10 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`w-13 h-13 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  safeIndex === idx
                    ? 'border-[#aec7f7] scale-100 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
                aria-label={`${idx + 1}번째 사진 보기`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

