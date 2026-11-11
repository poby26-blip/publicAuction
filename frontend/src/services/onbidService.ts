import { MOCK_GONG_ITEMS, type GongItem } from '../data/mockAuctionData'

/**
 * 차세대 온비드(B010003) API 원시 응답 아이템 인터페이스
 */
export interface RawOnbidItem {
  onbidCltrno?: number | string
  cltrMngNo?: string // 관리번호 (예: 2022-05506-004)
  onbidCltrNm?: string // 물건명 (예: 부산 서구 아미동2가 토지)
  prptDivCd?: string // 재산유형코드 (0007: 압류재산 등)
  prptDivNm?: string // 재산구분명 (압류재산, 신탁공매, 국유재산 등)
  dspsMthodCd?: string // 처분방식코드 (0001: 매각)
  dspsMthodNm?: string // 처분방식명
  cltrUsgLclsCtgrNm?: string // 용도대분류명 (부동산, 차량, 동산)
  cltrUsgMclsCtgrNm?: string // 용도중분류명 (아파트, 토지, 상가)
  cltrUsgSclsCtgrNm?: string // 용도소분류명
  apslEvlAmt?: number // 감정평가금액 (원)
  lowstBidPrcIndctCont?: string | number // 최저입찰가 (문자열 또는 숫자)
  cltrBidBgngDt?: string // 입찰시작일시 (YYYYMMDDHHmm)
  cltrBidEndDt?: string // 입찰마감일시 (YYYYMMDDHHmm)
  thnlImgUrlAdr?: string // 온비드 썸네일 이미지 URL
  lctnSdnm?: string // 시도명 (예: 서울특별시)
  lctnSggnm?: string // 시군구명
  lctnEmdNm?: string // 읍면동명
  landSqms?: number // 토지면적 (㎡)
  bldSqms?: number // 건물면적 (㎡)
  pbctStatNm?: string // 공고상태명 (입찰준비중, 입찰진행중 등)
  usbdNft?: number // 유찰횟수
}

/**
 * 온비드 API 조회 파라미터 옵션
 */
export interface OnbidQueryOptions {
  pageNo?: number
  numOfRows?: number
  region?: string // 시도명 (예: '서울특별시', '경기도', '부산광역시' 등)
  category?: string // 카테고리 ('apt', 'commercial', 'land', 'car', 'etc')
  pvctTrgtYn?: 'Y' | 'N' // 수의계약대상여부 (기본값: 'N')
}

// 환경변수 로드
const API_KEY = import.meta.env.VITE_PUBLIC_DATA_API_KEY || ''
// 개발 환경에서는 Vite 프록시(/api/public-data)를 사용하여 CORS 방지
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/public-data'

/**
 * 온비드 날짜 포맷 (YYYYMMDDHHmm)을 D-Day 및 표시 문자열로 변환
 */
function parseOnbidDate(rawDate?: string): { dDay: number; formattedDate: string } {
  if (!rawDate || rawDate.length < 8) {
    return { dDay: 7, formattedDate: '일정 확인중' }
  }

  const year = parseInt(rawDate.substring(0, 4), 10)
  const month = parseInt(rawDate.substring(4, 6), 10) - 1
  const day = parseInt(rawDate.substring(6, 8), 10)
  const hour = rawDate.length >= 10 ? parseInt(rawDate.substring(8, 10), 10) : 10
  const minute = rawDate.length >= 12 ? parseInt(rawDate.substring(10, 12), 10) : 0

  const targetDate = new Date(year, month, day, hour, minute)
  const now = new Date()
  const diffTime = targetDate.getTime() - now.getTime()
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const formattedDate = `${year}.${String(month + 1).padStart(2, '0')}.${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  return { dDay: diffDays, formattedDate }
}

/**
 * 차세대 온비드 원시 데이터를 공매이지 UI 모델(GongItem)로 변환하는 어댑터
 */
export function adaptOnbidToGongItem(raw: RawOnbidItem, index: number): GongItem {
  const appraisal = raw.apslEvlAmt || 0
  const minBid = typeof raw.lowstBidPrcIndctCont === 'string'
    ? parseInt(raw.lowstBidPrcIndctCont.replace(/,/g, ''), 10) || appraisal
    : raw.lowstBidPrcIndctCont || appraisal

  // 할인율 계산
  const discountRate = appraisal > 0 && minBid < appraisal
    ? Math.round(((appraisal - minBid) / appraisal) * 100)
    : 0

  const { dDay, formattedDate } = parseOnbidDate(raw.cltrBidEndDt)

  // 카테고리 매핑
  let category = 'apt'
  let categoryIcon = 'apartment'
  const mcls = raw.cltrUsgMclsCtgrNm || ''
  if (mcls.includes('토지') || mcls.includes('대지') || mcls.includes('임야')) {
    category = 'land'
    categoryIcon = 'landscape'
  } else if (mcls.includes('상가') || mcls.includes('업무') || mcls.includes('오피스')) {
    category = 'commercial'
    categoryIcon = 'storefront'
  } else if (mcls.includes('차량') || mcls.includes('자동차')) {
    category = 'car'
    categoryIcon = 'directions_car'
  }

  // 주소 조합
  const address = [raw.lctnSdnm, raw.lctnSggnm, raw.lctnEmdNm].filter(Boolean).join(' ') || raw.onbidCltrNm || '소재지 확인중'

  // 면적 표기
  let area = ''
  if (raw.bldSqms && raw.bldSqms > 0) {
    area = `건물 ${raw.bldSqms}㎡ (약 ${(raw.bldSqms * 0.3025).toFixed(1)}평)`
  } else if (raw.landSqms && raw.landSqms > 0) {
    area = `토지 ${raw.landSqms}㎡ (약 ${(raw.landSqms * 0.3025).toFixed(1)}평)`
  } else {
    area = raw.cltrUsgSclsCtgrNm || raw.cltrUsgMclsCtgrNm || '상세 정보 참조'
  }

  // 기본 온비드 썸네일 이미지 혹은 카테고리별 고화질 플레이스홀더 이미지
  const fallbackImages = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
  ]
  const validImageUrl = raw.thnlImgUrlAdr && raw.thnlImgUrlAdr.startsWith('http')
    ? raw.thnlImgUrlAdr
    : fallbackImages[index % fallbackImages.length]

  return {
    id: String(raw.onbidCltrno || raw.cltrMngNo || `onbid-${index}`),
    title: raw.onbidCltrNm?.trim() || '온비드 공매 물건',
    category,
    categoryIcon,
    address,
    appraisalPrice: appraisal,
    minimumPrice: minBid,
    discountRate,
    dDay,
    deadlineTime: raw.cltrBidEndDt?.substring(8, 12) ? `${raw.cltrBidEndDt.substring(8, 10)}:${raw.cltrBidEndDt.substring(10, 12)} 마감` : undefined,
    failCount: raw.usbdNft || 0,
    auctionType: raw.prptDivNm || '온비드공매',
    auctionDate: formattedDate,
    area,
    viewCount: 100 + (index * 37) % 1500,
    isUrgent: dDay <= 3,
    isHalfPrice: discountRate >= 40,
    imageUrl: validImageUrl,
    images: [validImageUrl, ...fallbackImages.slice(0, 2)],
  }
}

/**
 * 차세대 온비드 부동산 물건 목록 조회 (B010003/OnbidRlstListSrvc2/getRlstCltrList2)
 */
export async function fetchOnbidRealEstateList(options: OnbidQueryOptions = {}): Promise<GongItem[]> {
  const {
    pageNo = 1,
    numOfRows = 20,
    region,
    pvctTrgtYn = 'N',
  } = options

  // 파라미터 조합
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    resultType: 'json',
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    pvctTrgtYn,
    dspsMthodCd: '0001', // 매각
    prptDivCd: '0002,0003,0004,0005,0006,0007,0008,0010,0011,0013', // 전 재산유형
  })

  // 지역 필터 (시도명)
  if (region && region !== '전체') {
    params.append('lctnSdnm', region)
  }

  const requestUrl = `${BASE_URL}/B010003/OnbidRlstListSrvc2/getRlstCltrList2?${params.toString()}`

  try {
    const res = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      console.warn(`[Onbid API] HTTP 오류 (${res.status}): fallback 샘플 데이터를 사용합니다.`)
      return MOCK_GONG_ITEMS
    }

    const data = await res.json()

    // 온비드 결과코드 검증 (00: 정상)
    const header = data.header || data.response?.header
    if (header?.resultCode !== '00') {
      console.warn(`[Onbid API] 응답 오류 (${header?.resultCode}: ${header?.resultMsg})`)
      return MOCK_GONG_ITEMS
    }

    const body = data.body || data.response?.body
    const rawItems = body?.items?.item

    if (!rawItems || (Array.isArray(rawItems) && rawItems.length === 0)) {
      return []
    }

    const itemList: RawOnbidItem[] = Array.isArray(rawItems) ? rawItems : [rawItems]
    return itemList.map((item, idx) => adaptOnbidToGongItem(item, idx))
  } catch (error) {
    console.error('[Onbid API] 통신 예외 발생:', error)
    return MOCK_GONG_ITEMS
  }
}

/**
 * 차세대 온비드 차량 물건 목록 조회 (B010003/OnbidCarListSrvc2/getCarCltrList2)
 */
export async function fetchOnbidCarList(pageNo = 1, numOfRows = 10): Promise<GongItem[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    resultType: 'json',
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    pvctTrgtYn: 'N',
    dspsMthodCd: '0001',
  })

  const requestUrl = `${BASE_URL}/B010003/OnbidCarListSrvc2/getCarCltrList2?${params.toString()}`

  try {
    const res = await fetch(requestUrl)
    if (!res.ok) return []
    const data = await res.json()
    const rawItems = data.body?.items?.item || data.response?.body?.items?.item
    if (!rawItems) return []
    const list: RawOnbidItem[] = Array.isArray(rawItems) ? rawItems : [rawItems]
    return list.map((item, idx) => adaptOnbidToGongItem(item, idx))
  } catch {
    return []
  }
}

