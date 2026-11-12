/**
 * @file Toast.tsx
 * @description '공매이지' 앱 전역에서 사용하는 Stitch 디자인 기반 플로팅 토스트 팝업 컴포넌트입니다.
 * 
 * [주요 기능]
 * 1. 브라우저 기본 alert()를 대체하는 비침습적(Non-blocking) 모바일 토스트 알림
 * 2. 메시지 성격별 아이콘 분기 (success: 체크, info: 알림, warning: 주의)
 * 3. 선택적 원클릭 액션 버튼 지원 (예: 관심 보관함 바로 이동)
 * 4. 상세 화면 오버레이(z-50) 위에서도 가려지지 않도록 z-[60] 계층 보장
 */

export type ToastType = 'success' | 'info' | 'warning'

export interface ToastOptions {
  /** 토스트 아이콘 성격 ('success' | 'info' | 'warning', 기본값: 'success') */
  type?: ToastType
  /** 토스트 우측에 표시할 선택적 액션 버튼 라벨 */
  actionLabel?: string
  /** 액션 버튼 클릭 시 실행할 콜백 */
  onAction?: () => void
  /** 자동 닫힘 지연 시간(ms, 기본값: 2500) */
  duration?: number
}

export type ShowToastFn = (message: string, options?: ToastOptions) => void

interface ToastProps {
  /** 표시할 안내 메시지 (null이면 숨김) */
  message: string | null
  /** 토스트 아이콘 성격 */
  type?: ToastType
  /** 선택적 우측 액션 버튼 라벨 */
  actionLabel?: string
  /** 선택적 액션 버튼 클릭 콜백 */
  onAction?: () => void
  /** 토스트 닫기(액션 수행 후 등) 콜백 */
  onDismiss?: () => void
}

const TOAST_ICON_MAP: Record<ToastType, { icon: string; colorClass: string }> = {
  success: { icon: 'check_circle', colorClass: 'text-[#39b282]' },
  info: { icon: 'notifications_active', colorClass: 'text-[#aec7f7]' },
  warning: { icon: 'info', colorClass: 'text-[#ffb4ab]' },
}

export function Toast({
  message,
  type = 'success',
  actionLabel,
  onAction,
  onDismiss,
}: ToastProps) {
  const { icon, colorClass } = TOAST_ICON_MAP[type]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-18 left-1/2 -translate-x-1/2 z-[60] w-max max-w-[min(92vw,480px)] transition-all duration-300 pointer-events-none ${
        message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <div className="pointer-events-auto px-4 py-2.5 bg-[#002046]/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-white/10 flex items-center gap-2.5">
        <span className={`material-symbols-outlined text-[18px] shrink-0 ${colorClass}`}>
          {icon}
        </span>
        <span className="text-xs font-semibold leading-snug break-keep">
          {message || ''}
        </span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              onAction()
              onDismiss?.()
            }}
            className="ml-1 px-2.5 py-1 rounded-lg bg-[#0051d5] hover:bg-[#316bf3] text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

