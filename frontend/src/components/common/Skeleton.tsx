/**
 * @file Skeleton.tsx
 * @description 공매이지 앱 전반에서 사용하는 로딩 플레이스홀더 (Shimmer / Skeleton UI) 공통 컴포넌트 모듈입니다.
 * 실시간 온비드 OpenAPI 비동기 통신 중 사용자에게 매끄러운 로딩 경험을 제공합니다.
 */

/**
 * 스켈레톤 컴포넌트의 공통 속성 인터페이스
 */
interface SkeletonProps {
  /** 렌더링할 스켈레톤 카드의 개수 (기본값: 1) */
  count?: number
}

/**
 * 가로 스크롤 카드 스켈레톤 (Shimmer UI)
 * 
 * - 적용 위치: 홈 화면의 '마감 임박 D-1 특가' 가로 스크롤 섹션
 * - 너비 68(w-68)의 고정 폭을 가지며, 실제 경매 카드와 동일한 비율(16:10 썸네일) 및 구조를 표현합니다.
 * - Tailwind CSS의 `animate-pulse`를 활용하여 은은한 깜빡임 효과(Shimmer)를 제공합니다.
 */
export function CardSkeleton({ count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count })

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={`card-skeleton-${idx}`}
          className="w-68 lg:w-full flex-shrink-0 bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-xs animate-pulse flex flex-col justify-between"
          aria-hidden="true"
        >
          {/* 상단 썸네일 이미지 영역 (16:10 비율) */}
          <div className="aspect-16/10 bg-slate-200"></div>

          {/* 하단 카드 콘텐츠 영역 */}
          <div className="p-3.5 space-y-2">
            {/* 자산 유형 및 지역 태그 플레이스홀더 */}
            <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
            {/* 물건 제목 플레이스홀더 */}
            <div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
            {/* 가격 정보 플레이스홀더 (최저입찰가 및 감정가) */}
            <div className="pt-2 border-t border-[#eff4ff] space-y-1.5">
              <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
              <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * 세로 리스트 카드 스켈레톤 (Shimmer UI)
 * 
 * - 적용 위치: 홈 화면 '이번 주 유찰 추천! 반값 물건' 및 공매 목록 화면(`AuctionListScreen`)
 * - 좌측 24x24(w-24 h-24) 정사각형 썸네일과 우측 상세 정보 영역이 배치된 가로형 리스트 카드 형태입니다.
 */
export function ListSkeleton({ count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count })

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={`list-skeleton-${idx}`}
          className="bg-white rounded-2xl border border-[#e5eeff] p-4 flex gap-3.5 shadow-2xs animate-pulse"
          aria-hidden="true"
        >
          {/* 좌측 정사각형 썸네일 이미지 영역 */}
          <div className="w-24 h-24 rounded-xl bg-slate-200 flex-shrink-0"></div>

          {/* 우측 텍스트 및 메타데이터 영역 */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="space-y-1.5">
              {/* 유찰 횟수 및 공매 구분 뱃지 */}
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              {/* 물건명 */}
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              {/* 소재지 주소 */}
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
            {/* 최저입찰가 및 할인율 정보 */}
            <div className="h-4 bg-slate-200 rounded w-2/5"></div>
          </div>
        </div>
      ))}
    </>
  )
}
