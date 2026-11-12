/**
 * @file onbidService.ts
 * @description 공공데이터포털(data.go.kr)의 한국자산관리공사(KAMCO) 차세대 온비드 OpenAPI(기관코드: B010003) 연동 서비스 모듈입니다.
 * 
 * [3대 자산 상품군 OpenAPI 오퍼레이션 규격]
 * 1. 부동산 목록: /B010003/OnbidRlstListSrvc2/getRlstCltrList2
 * 2. 동산 목록:   /B010003/OnbidMvastListSrvc2/getMvastCltrList2
 * 3. 자동차 목록: /B010003/OnbidCarListSrvc2/getCarCltrList2
 * 
 * [연동 핵심 규격 및 주의사항]
 * - Base URL: 개발 환경에서는 Vite 프록시(/api/public-data)를 통하여 CORS를 우회합니다.
 * - 필수 파라미터: 수의계약대상여부(pvctTrgtYn='N'), 처분방식코드(dspsMthodCd='0001': 매각), 재산구분코드(prptDivCd).
 */

import {
  MOCK_GONG_ITEMS,
  type GongItem,
  getRegionApiQueries,
  getCategoryFallbackImage,
} from '../data/mockAuctionData'

/**
 * 차세대 온비드(B010003) API 원시 JSON 응답 아이템 인터페이스
 */
export interface RawOnbidItem {
  /** 물건식별고유번호 */
  onbidCltrno?: number | string
  /** 관리번호 (예: 2022-05506-004) */
  cltrMngNo?: string
  /** 온비드 물건명 (예: 부산 서구 아미동2가 토지) */
  onbidCltrNm?: string
  /** 재산구분코드 (0007: 금융기관담보/신탁재산, 0002: 압류재산 등) */
  prptDivCd?: string
  /** 재산구분명 (압류재산, 신탁공매, 국유재산 등) */
  prptDivNm?: string
  /** 처분방식코드 (0001: 매각, 0002: 대부/임대) */
  dspsMthodCd?: string
  /** 처분방식명 */
  dspsMthodNm?: string
  /** 용도대분류명 (부동산, 차량, 동산) */
  cltrUsgLclsCtgrNm?: string
  /** 용도중분류명 (주거용건물, 상가용및업무용건물, 토지 등) */
  cltrUsgMclsCtgrNm?: string
  /** 용도소분류명 (아파트, 단독주택, 근린생활시설 등) */
  cltrUsgSclsCtgrNm?: string
  /** 감정평가금액 (원) */
  apslEvlAmt?: number
  /** 최저입찰가 표시내용 (문자열 또는 숫자) */
  lowstBidPrcIndctCont?: string | number
  /** 입찰시작일시 (형식: YYYYMMDDHHmm) */
  cltrBidBgngDt?: string
  /** 입찰마감일시 (형식: YYYYMMDDHHmm) */
  cltrBidEndDt?: string
  /** 온비드 현장 사진/썸네일 이미지 URL */
  thnlImgUrlAdr?: string
  /** 물건 소재지 시도명 (예: 서울특별시, 경기도) */
  lctnSdnm?: string
  /** 물건 소재지 시군구명 (예: 강서구, 평택시) */
  lctnSggnm?: string
  /** 물건 소재지 읍면동명 (예: 등촌동, 장당동) */
  lctnEmdNm?: string
  /** 토지면적 (㎡) */
  landSqms?: number
  /** 건물면적 (㎡) */
  bldSqms?: number
  /** 공고진행상태명 (입찰준비중, 입찰진행중 등) */
  pbctStatNm?: string
  /** 유찰횟수 (0회, 1회 등) */
  usbdNft?: number
}

/**
 * 온비드 API 조회 시 전달 가능한 쿼리 옵션 인터페이스
 */
export interface OnbidQueryOptions {
  /** 요청할 페이지 번호 (기본값: 1) */
  pageNo?: number
  /** 한 페이지에 수신할 매물 건수 (기본값: 20) */
  numOfRows?: number
  /** 시/도 지역 필터 (예: '서울', '서울특별시', '경기도', '부산' 등) */
  region?: string
  /** 카테고리 필터 ('apt', 'commercial', 'land', 'car' 등) */
  category?: string
  /** 수의계약대상여부 (기본 공매는 'N', 수의계약은 'Y') */
  pvctTrgtYn?: 'Y' | 'N'
}

// ---------------------------------------------------------------------------
// [환경 변수 로드 (Environment Variables)]
// ---------------------------------------------------------------------------

/** 공공데이터포털 일반 인증키 (Decoding 키) */
const API_KEY = import.meta.env.VITE_PUBLIC_DATA_API_KEY || ''

/** 온비드 API 기본 엔드포인트 URL (개발 환경: /api/public-data 프록시) */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/public-data'

/**
 * 온비드 날짜 형식 문자열(YYYYMMDDHHmm)을 파싱하여 D-Day 및 포맷팅된 날짜 문자열을 반환합니다.
 * 
 * [특이사항 방어 처리]
 * - 온비드에서 상시 공고이거나 마감일 미정 물건은 '299912301600' 형식으로 내려옵니다.
 * - 2999년 등 비정상 미래 날짜인 경우 '상시 매각'으로 안전하게 변환하여 D-Day 오계산을 방지합니다.
 * 
 * @param rawDate - YYYYMMDDHHmm 형태의 날짜 문자열
 * @returns { dDay: 잔여 일수, formattedDate: 'YYYY.MM.DD HH:mm' 형태의 표시용 문자열 }
 */
function parseOnbidDate(rawDate?: string): { dDay: number; formattedDate: string } {
  if (!rawDate || rawDate.length < 8) {
    return { dDay: 7, formattedDate: '일정 확인중' }
  }

  // 온비드 상시/미정 공고(2999년) 방어 처리
  if (rawDate.startsWith('2999')) {
    return { dDay: 30, formattedDate: '상시 매각' }
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
 * 차세대 온비드 원시 JSON 데이터(RawOnbidItem)를 공매이지 앱 UI 표준 모델(GongItem)로 변환하는 어댑터(Adapter) 함수입니다.
 * 
 * [주요 변환 작업]
 * 1. 감정가와 최저가 기반 할인율(discountRate %) 자동 계산
 * 2. 입찰 마감일시 기반 D-Day 및 마감 시각 포맷팅
 * 3. 용도중분류명에 따른 카테고리(apt, commercial, land, car) 매핑
 * 4. 시/도, 시군구, 읍면동 주소 문자열 정규화
 * 5. 평수 환산(㎡ * 0.3025) 및 면적 텍스트 구성
 * 6. 썸네일 이미지 유효성 검증 및 실패 대비 카테고리별 고화질 Fallback 이미지 매핑
 * 
 * @param raw - 온비드 API 원시 데이터 객체
 * @param index - 리스트 인덱스 (기본 썸네일 순환용)
 * @returns 공매이지 앱 컴포넌트에서 직접 사용하는 GongItem 객체
 */
export function adaptOnbidToGongItem(raw: RawOnbidItem, index: number): GongItem {
  // 원시 감정평가금액 및 최저입찰가 파싱 (동산/불용품 중 감정가 미정 시 최저가로 안전 보정)
  const rawAppraisal = raw.apslEvlAmt || 0

  // 최저입찰가 (문자열에 콤마가 포함된 경우 숫자 변환)
  const minBid = typeof raw.lowstBidPrcIndctCont === 'string'
    ? parseInt(raw.lowstBidPrcIndctCont.replace(/,/g, ''), 10) || rawAppraisal
    : raw.lowstBidPrcIndctCont || rawAppraisal

  const appraisal = rawAppraisal > 0 ? rawAppraisal : minBid

  // 감정가 대비 할인율(%) 계산
  const discountRate = appraisal > 0 && minBid < appraisal
    ? Math.round(((appraisal - minBid) / appraisal) * 100)
    : 0

  // 입찰 마감일자 파싱
  const { dDay, formattedDate } = parseOnbidDate(raw.cltrBidEndDt)

  // 자산 용도 분류 매핑 (주의: '부동산' 문자열에 '동산'이 포함되므로 isRealEstate 선행 판별 필수)
  let category = 'apt'
  let categoryIcon = 'apartment'
  const lcls = raw.cltrUsgLclsCtgrNm || ''
  const mcls = raw.cltrUsgMclsCtgrNm || ''
  const scls = raw.cltrUsgSclsCtgrNm || ''
  const cltrTitle = raw.onbidCltrNm || ''
  const isRealEstate = lcls.includes('부동산')

  if (
    !isRealEstate &&
    (lcls === '동산' ||
      mcls.includes('기계') ||
      mcls.includes('유가증권') ||
      mcls.includes('물품') ||
      mcls.includes('귀금속'))
  ) {
    category = 'goods'
    categoryIcon = 'inventory_2'
  } else if (
    !isRealEstate &&
    (lcls.includes('차량') || mcls.includes('차량') || mcls.includes('자동차'))
  ) {
    category = 'car'
    categoryIcon = 'directions_car'
  } else if (
    mcls.includes('공장') ||
    mcls.includes('창고') ||
    mcls.includes('산업') ||
    scls.includes('공장') ||
    scls.includes('창고') ||
    cltrTitle.includes('공장') ||
    cltrTitle.includes('창고')
  ) {
    category = 'factory'
    categoryIcon = 'factory'
  } else if (mcls.includes('토지') || mcls.includes('대지') || mcls.includes('임야')) {
    category = 'land'
    categoryIcon = 'landscape'
  } else if (
    mcls.includes('상가') ||
    mcls.includes('업무') ||
    mcls.includes('오피스') ||
    mcls.includes('근린생활')
  ) {
    category = 'commercial'
    categoryIcon = 'storefront'
  } else if (mcls.includes('주거') || mcls.includes('아파트') || mcls.includes('주택')) {
    category = 'apt'
    categoryIcon = 'apartment'
  }

  // 시/도, 시군구, 읍면동을 결합한 표준 도로명/지번 주소 구성
  const address =
    [raw.lctnSdnm, raw.lctnSggnm, raw.lctnEmdNm].filter(Boolean).join(' ') ||
    raw.onbidCltrNm ||
    '소재지 확인중'

  // 면적 또는 용도 제원 표기
  let area = ''
  if (raw.bldSqms && raw.bldSqms > 0) {
    area = `건물 ${raw.bldSqms}㎡ (약 ${(raw.bldSqms * 0.3025).toFixed(1)}평)`
  } else if (raw.landSqms && raw.landSqms > 0) {
    area = `토지 ${raw.landSqms}㎡ (약 ${(raw.landSqms * 0.3025).toFixed(1)}평)`
  } else {
    area = raw.cltrUsgSclsCtgrNm || raw.cltrUsgMclsCtgrNm || raw.cltrUsgLclsCtgrNm || '상세 정보 참조'
  }

  // 카테고리 전용 안전 Fallback 썸네일 이미지 적용
  const categoryFallback = getCategoryFallbackImage(category)
  const validImageUrl =
    raw.thnlImgUrlAdr && raw.thnlImgUrlAdr.startsWith('http')
      ? raw.thnlImgUrlAdr
      : categoryFallback

  // 공매 재산구분명 표준화 (신탁공매, 압류재산, 국유재산, 일반공매)
  let auctionType = '온비드공매'
  const rawDivNm = raw.prptDivNm || ''
  if (rawDivNm.includes('신탁') || rawDivNm.includes('담보') || rawDivNm.includes('수탁')) {
    auctionType = '신탁공매'
  } else if (rawDivNm.includes('압류') || rawDivNm.includes('체납')) {
    auctionType = '압류재산'
  } else if (rawDivNm.includes('국유')) {
    auctionType = '국유재산'
  } else if (rawDivNm) {
    auctionType = rawDivNm
  }

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
    deadlineTime: raw.cltrBidEndDt?.substring(8, 12)
      ? `${raw.cltrBidEndDt.substring(8, 10)}:${raw.cltrBidEndDt.substring(10, 12)} 마감`
      : undefined,
    failCount: raw.usbdNft || 0,
    auctionType,
    auctionDate: formattedDate,
    area,
    viewCount: 100 + ((index * 37) % 1500),
    isUrgent: dDay <= 3,
    isHalfPrice: discountRate >= 40,
    imageUrl: validImageUrl,
    images: [validImageUrl],
  }
}

// ---------------------------------------------------------------------------
// [공통 온비드 목록 OpenAPI 실행 엔진 (Shared Query Executor)]
// ---------------------------------------------------------------------------

interface InternalOnbidFetchConfig {
  endpointPath: string
  pageNo: number
  numOfRows: number
  region?: string
  pvctTrgtYn?: 'Y' | 'N'
  prptDivCd: string
  fallbackItems: GongItem[]
  forceCategory?: { id: string; icon: string }
}

/**
 * 단일/복수 지역 쿼리 병렬 페칭 및 ID 중복 제거를 공통으로 수행하는 내부 API 실행기입니다.
 */
async function executeOnbidListQuery(config: InternalOnbidFetchConfig): Promise<GongItem[]> {
  const {
    endpointPath,
    pageNo,
    numOfRows,
    region,
    pvctTrgtYn = 'N',
    prptDivCd,
    fallbackItems,
    forceCategory,
  } = config

  const baseParams = new URLSearchParams({
    serviceKey: API_KEY,
    resultType: 'json',
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    pvctTrgtYn,
    dspsMthodCd: '0001', // 처분방식: 매각
    prptDivCd,
  })

  const mapRawList = (rawList: RawOnbidItem[]): GongItem[] =>
    rawList.map((item, idx) => {
      const gongItem = adaptOnbidToGongItem(item, idx)
      if (forceCategory) {
        gongItem.category = forceCategory.id
        gongItem.categoryIcon = forceCategory.icon
        // 강제 보정된 카테고리의 이미지로 Fallback 재동기화
        if (gongItem.imageUrl.includes('images.unsplash.com')) {
          const fallbackUrl = getCategoryFallbackImage(forceCategory.id)
          gongItem.imageUrl = fallbackUrl
          gongItem.images = [fallbackUrl]
        }
      }
      return gongItem
    })

  const fetchSingleRegion = async (lctnSdnm?: string): Promise<GongItem[] | null> => {
    const p = new URLSearchParams(baseParams)
    if (lctnSdnm) {
      p.append('lctnSdnm', lctnSdnm)
    }

    const res = await fetch(`${BASE_URL}${endpointPath}?${p.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      console.warn(`[Onbid API] HTTP 오류 (${res.status}) - ${endpointPath}`)
      return null
    }

    const data = await res.json()
    const header = data.header || data.response?.header
    if (header?.resultCode !== '00') {
      console.warn(`[Onbid API] 응답 오류 (${header?.resultCode}: ${header?.resultMsg})`)
      return null
    }

    const body = data.body || data.response?.body
    const rawItems = body?.items?.item
    if (!rawItems || (Array.isArray(rawItems) && rawItems.length === 0)) {
      return []
    }

    const itemList: RawOnbidItem[] = Array.isArray(rawItems) ? rawItems : [rawItems]
    return mapRawList(itemList)
  }

  const regionQueries = getRegionApiQueries(region)

  try {
    // 1. 전국 또는 단일 지역 조회
    if (regionQueries.length <= 1) {
      const result = await fetchSingleRegion(regionQueries[0])
      return result === null ? fallbackItems : result
    }

    // 2. 복수 행정구역 쿼리(예: '전남광주' -> '전남광주통합특별시', '광주광역시', '전라남도') 병렬 호출 및 병합
    const results = await Promise.all(
      regionQueries.slice(0, 3).map((queryName) => fetchSingleRegion(queryName))
    )
    const combined = results.flatMap((r) => r || [])

    const seen = new Set<string>()
    return combined.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  } catch (error) {
    console.error(`[Onbid API] 통신 예외 발생 (${endpointPath}):`, error)
    return fallbackItems
  }
}

// ---------------------------------------------------------------------------
// [3대 상품군(부동산 / 동산 / 자동차) 및 통합 OpenAPI 서비스]
// ---------------------------------------------------------------------------

/**
 * 1. 차세대 온비드 [부동산] 물건 목록을 실시간으로 조회합니다.
 * - API 식별자: B010003 / OnbidRlstListSrvc2 / getRlstCltrList2
 * - 신탁/담보(0007) 및 압류재산(0002) 매물을 우선 조회합니다.
 */
export async function fetchOnbidRealEstateList(options: OnbidQueryOptions = {}): Promise<GongItem[]> {
  const { pageNo = 1, numOfRows = 20, region, pvctTrgtYn = 'N' } = options

  return executeOnbidListQuery({
    endpointPath: '/B010003/OnbidRlstListSrvc2/getRlstCltrList2',
    pageNo,
    numOfRows,
    region,
    pvctTrgtYn,
    prptDivCd: '0007,0002',
    fallbackItems: MOCK_GONG_ITEMS.filter((i) => i.category !== 'car'),
  })
}

/**
 * 2. 차세대 온비드 [동산] 물건 목록을 실시간으로 조회합니다.
 * - API 식별자: B010003 / OnbidMvastListSrvc2 / getMvastCltrList2
 * - 기계기구, 유가증권, 귀금속, 불용품, 기타 동산(차량 제외) 공매 목록을 조회합니다.
 * - 1차 압류/공유(0007,0002) 조회 후 0건인 경우 불용품/국유 동산(0004,0010)을 추가 탐색합니다.
 */
export async function fetchOnbidMovableList(
  pageNo = 1,
  numOfRows = 20,
  region?: string
): Promise<GongItem[]> {
  const primary = await executeOnbidListQuery({
    endpointPath: '/B010003/OnbidMvastListSrvc2/getMvastCltrList2',
    pageNo,
    numOfRows,
    region,
    prptDivCd: '0007,0002',
    fallbackItems: [],
    forceCategory: { id: 'goods', icon: 'inventory_2' },
  })

  if (primary.length > 0 || pageNo > 1) {
    return primary
  }

  // 1페이지 압류/신탁 동산이 없는 경우 불용품(0004) 및 국유재산(0010) 동산 추가 탐색
  return executeOnbidListQuery({
    endpointPath: '/B010003/OnbidMvastListSrvc2/getMvastCltrList2',
    pageNo,
    numOfRows,
    region,
    prptDivCd: '0004,0010',
    fallbackItems: [],
    forceCategory: { id: 'goods', icon: 'inventory_2' },
  })
}

/**
 * 3. 차세대 온비드 [자동차] 물건 목록을 실시간으로 조회합니다.
 * - API 식별자: B010003 / OnbidCarListSrvc2 / getCarCltrList2
 * - 승용차, 화물/특수차량 공매 목록을 조회합니다.
 */
export async function fetchOnbidCarList(
  pageNo = 1,
  numOfRows = 20,
  region?: string
): Promise<GongItem[]> {
  return executeOnbidListQuery({
    endpointPath: '/B010003/OnbidCarListSrvc2/getCarCltrList2',
    pageNo,
    numOfRows,
    region,
    prptDivCd: '0007,0002',
    fallbackItems: [],
    forceCategory: { id: 'car', icon: 'directions_car' },
  })
}

/**
 * 4. 3대 상품군(부동산 + 동산 + 자동차) 공매 물건을 병렬 호출하여 통합 목록으로 제공합니다.
 * - '전체 보기' 탭 등에서 모든 자산 유형을 고르게 탐색할 때 사용합니다.
 */
export async function fetchOnbidAllAssetsList(
  pageNo = 1,
  numOfRows = 20,
  region?: string
): Promise<GongItem[]> {
  const realEstateCount = Math.max(8, Math.ceil(numOfRows * 0.5))
  const movableCount = Math.max(4, Math.floor(numOfRows * 0.25))
  const carCount = Math.max(4, Math.floor(numOfRows * 0.25))

  const [realEstateItems, movableItems, carItems] = await Promise.all([
    fetchOnbidRealEstateList({ pageNo, numOfRows: realEstateCount, region }),
    fetchOnbidMovableList(pageNo, movableCount, region),
    fetchOnbidCarList(pageNo, carCount, region),
  ])

  const combined = [...realEstateItems, ...movableItems, ...carItems]
  const seen = new Set<string>()
  return combined.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
