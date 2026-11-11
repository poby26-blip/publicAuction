interface SkeletonProps {
  count?: number
}

/**
 * 가로 스크롤 카드 스켈레톤 (Shimmer UI)
 * 홈 화면 '마감 임박 D-1 특가' 등 가로 카드 형태의 로딩 플레이스홀더
 */
export function CardSkeleton({ count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count })

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={`card-skeleton-${idx}`}
          className="w-68 flex-shrink-0 bg-white rounded-2xl border border-[#e5eeff] overflow-hidden shadow-xs animate-pulse flex flex-col justify-between"
        >
          {/* 썸네일 이미지 영역 */}
          <div className="aspect-16/10 bg-slate-200"></div>

          {/* 콘텐츠 영역 */}
          <div className="p-3.5 space-y-2">
            <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
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
 * 홈 화면 '이번 주 유찰 추천! 반값 물건' 및 공매 목록 화면에서 재사용
 */
export function ListSkeleton({ count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count })

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={`list-skeleton-${idx}`}
          className="bg-white rounded-2xl border border-[#e5eeff] p-4 flex gap-3.5 shadow-2xs animate-pulse"
        >
          {/* 정사각형 썸네일 영역 */}
          <div className="w-24 h-24 rounded-xl bg-slate-200 flex-shrink-0"></div>

          {/* 텍스트 및 정보 영역 */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div className="space-y-1.5">
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-2/5"></div>
          </div>
        </div>
      ))}
    </>
  )
}

