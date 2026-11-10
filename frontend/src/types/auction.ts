export type AuctionCategory = 'apartment' | 'house' | 'land' | 'commercial' | 'vehicle' | 'etc'

export type AuctionStatus = 'scheduled' | 'in_progress' | 'sold' | 'failed'

export interface AuctionItem {
  id: string
  caseNumber: string // 사건번호 (예: 2024타경10425)
  court: string // 관할법원/기관 (예: 서울중앙지방법원)
  department: string // 담당계
  title: string // 물건명
  address: string // 소재지
  category: AuctionCategory
  categoryLabel: string
  appraisalPrice: number // 감정가 (원)
  minimumPrice: number // 최저입찰가 (원)
  bidDeposit: number // 입찰보증금 (10%)
  failCount: number // 유찰 횟수
  auctionDate: string // 매각기일 (YYYY-MM-DD)
  dDay: number // D-day (남은 일수)
  viewCount: number // 조회수
  likeCount: number // 관심 등록수
  imageUrl: string // 대표 이미지 URL
  images: string[] // 상세 이미지 목록
  status: AuctionStatus
  area: string // 전용면적 / 토지면적
  bidRate: number // 감정가 대비 비율 (%)
}

