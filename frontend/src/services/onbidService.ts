/**
 * @file onbidService.ts
 * @description 공공데이터포털(data.go.kr)의 한국자산관리공사(KAMCO) 차세대 온비드 OpenAPI(기관코드: B010003) 연동 서비스 모듈입니다.
 * 
 * [연동 핵심 규격 및 개발 주의사항]
 * 1. Base URL: 개발 환경에서는 Vite 프록시(/api/public-data)를 통하여 CORS(교차 출처 리소스 공유)를 우회합니다.
 * 2. Operation명: 가이드 문서의 오탈자와 달리 실제 운영 서버에서는 숫자 '2'가 붙은 'getRlstCltrList2'를 호출해야 정상 동작합니다.
 * 3. 필수 파라미터: 수의계약대상여부(pvctTrgtYn='N') 및 처분방식코드(dspsMthodCd='0001': 매각)가 반드시 포함되어야 합니다.
 * 4. 재산유형코드: 신탁/담보(0007) 및 압류재산(0002) 31,000여 건을 우선 조회하여 실제 아파트, 주택, 상가 매물을 확보합니다.
 */

import { MOCK_GONG_ITEMS, type GongItem, getRegionApiQueries } from '../data/mockAuctionData'

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
  // 감정평가금액 (원)
  const appraisal = raw.apslEvlAmt || 0

  // 최저입찰가 (문자열에 콤마가 포함된 경우 숫자 변환)
  const minBid = typeof raw.lowstBidPrcIndctCont === 'string'
    ? parseInt(raw.lowstBidPrcIndctCont.replace(/,/g, ''), 10) || appraisal
    : raw.lowstBidPrcIndctCont || appraisal

  // 감정가 대비 할인율(%) 계산
  const discountRate = appraisal > 0 && minBid < appraisal
    ? Math.round(((appraisal - minBid) / appraisal) * 100)
    : 0

  // 입찰 마감일자 파싱
  const { dDay, formattedDate } = parseOnbidDate(raw.cltrBidEndDt)

  // 자산 용도 분류 매핑
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
  } else if (mcls.includes('주거') || mcls.includes('아파트') || mcls.includes('주택')) {
    category = 'apt'
    categoryIcon = 'apartment'
  }

  // 시/도, 시군구, 읍면동을 결합한 표준 도로명/지번 주소 구성
  const address = [raw.lctnSdnm, raw.lctnSggnm, raw.lctnEmdNm].filter(Boolean).join(' ') || raw.onbidCltrNm || '소재지 확인중'

  // 면적 표기 및 평수 환산
  let area = ''
  if (raw.bldSqms && raw.bldSqms > 0) {
    area = `건물 ${raw.bldSqms}㎡ (약 ${(raw.bldSqms * 0.3025).toFixed(1)}평)`
  } else if (raw.landSqms && raw.landSqms > 0) {
    area = `토지 ${raw.landSqms}㎡ (약 ${(raw.landSqms * 0.3025).toFixed(1)}평)`
  } else {
    area = raw.cltrUsgSclsCtgrNm || raw.cltrUsgMclsCtgrNm || '상세 정보 참조'
  }

  // 썸네일 이미지 유효성 확인 및 Fallback 플레이스홀더 이미지 배열
  const fallbackImages = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
  ]
  const validImageUrl = raw.thnlImgUrlAdr && raw.thnlImgUrlAdr.startsWith('http')
    ? raw.thnlImgUrlAdr
    : fallbackImages[index % fallbackImages.length]

  // 공매 재산구분명 표준화 (신탁공매, 압류재산, 국유재산, 일반공매)
  let auctionType = '온비드공매'
  const rawDivNm = raw.prptDivNm || ''
  if (rawDivNm.includes('신탁') || rawDivNm.includes('담보')) {
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
    deadlineTime: raw.cltrBidEndDt?.substring(8, 12) ? `${raw.cltrBidEndDt.substring(8, 10)}:${raw.cltrBidEndDt.substring(10, 12)} 마감` : undefined,
    failCount: raw.usbdNft || 0,
    auctionType,
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
 * 차세대 온비드 부동산 물건 목록을 실시간으로 조회합니다.
 * 
 * - API 식별자: B010003 / OnbidRlstListSrvc2 / getRlstCltrList2
 * - 신탁/담보(0007) 및 압류재산(0002) 31,000+건을 우선 조회합니다.
 * - 지역(region) 파라미터가 주어진 경우 해당 시/도(lctnSdnm)로 필터링하여 조회합니다.
 * 
 * @param options - 페이징 번호, 건수, 지역 필터 등의 쿼리 옵션
 * @returns 어댑터를 통해 정규화된 GongItem 배열 (통신 실패 시 MOCK_GONG_ITEMS fallback)
 */
export async function fetchOnbidRealEstateList(options: OnbidQueryOptions = {}): Promise<GongItem[]> {
  const {
    pageNo = 1,
    numOfRows = 20,
    region,
    pvctTrgtYn = 'N',
  } = options

  // 요청 파라미터 빌드
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    resultType: 'json',
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    pvctTrgtYn,
    dspsMthodCd: '0001', // 처분방식: 매각
    prptDivCd: '0007,0002', // 신탁/담보 및 압류재산 우선 (31,000+건 실거래 물건)
  })

  // 시/도 지역 필터링 (예: '서울', '충북', '전남광주' 등)
  const regionQueries = getRegionApiQueries(region)

  // 단일 지역 또는 전국 조회 시
  if (regionQueries.length <= 1) {
    if (regionQueries.length === 1) {
      params.append('lctnSdnm', regionQueries[0])
    }

    const requestUrl = `${BASE_URL}/B010003/OnbidRlstListSrvc2/getRlstCltrList2?${params.toString()}`

    try {
      const res = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      // HTTP 상태 코드 에러 시 Fallback 반환
      if (!res.ok) {
        console.warn(`[Onbid API] HTTP 오류 (${res.status}): fallback 샘플 데이터를 사용합니다.`)
        return MOCK_GONG_ITEMS
      }

      const data = await res.json()

      // 온비드 응답 헤더 결과코드 검증 ('00'이 정상 코드)
      const header = data.header || data.response?.header
      if (header?.resultCode !== '00') {
        console.warn(`[Onbid API] 응답 오류 (${header?.resultCode}: ${header?.resultMsg})`)
        return MOCK_GONG_ITEMS
      }

      // JSON 응답 본체 아이템 추출
      const body = data.body || data.response?.body
      const rawItems = body?.items?.item

      // 조회 결과가 0건인 경우 빈 배열 반환
      if (!rawItems || (Array.isArray(rawItems) && rawItems.length === 0)) {
        return []
      }

      // 단일 객체 또는 배열 응답 정규화 후 어댑터 변환
      const itemList: RawOnbidItem[] = Array.isArray(rawItems) ? rawItems : [rawItems]
      return itemList.map((item, idx) => adaptOnbidToGongItem(item, idx))
    } catch (error) {
      console.error('[Onbid API] 통신 예외 발생:', error)
      return MOCK_GONG_ITEMS
    }
  }

  // 복수 쿼리 대상(예: '전남광주' -> '전남광주통합특별시', '광주광역시', '전라남도') 병렬 호출 및 병합
  try {
    const promises = regionQueries.slice(0, 3).map(async (queryName) => {
      const p = new URLSearchParams(params)
      p.set('lctnSdnm', queryName)
      const res = await fetch(`${BASE_URL}/B010003/OnbidRlstListSrvc2/getRlstCltrList2?${p.toString()}`)
      if (!res.ok) return []
      const data = await res.json()
      const raw = data.body?.items?.item || data.response?.body?.items?.item
      if (!raw) return []
      const list: RawOnbidItem[] = Array.isArray(raw) ? raw : [raw]
      return list.map((item, idx) => adaptOnbidToGongItem(item, idx))
    })

    const results = await Promise.all(promises)
    const combined = results.flat()

    // 물건 고유 ID 기준 중복 제거
    const seen = new Set<string>()
    return combined.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  } catch (error) {
    console.error('[Onbid API] 복수 지역 통신 예외 발생:', error)
    return MOCK_GONG_ITEMS
  }
}

/**
 * 차세대 온비드 자동차 물건 목록을 실시간으로 조회합니다.
 * 
 * - API 식별자: B010003 / OnbidCarListSrvc2 / getCarCltrList2
 * - 승용차, 화물/특수차량 공매 목록을 조회합니다.
 * - 신탁/담보(0007) 및 압류재산(0002) 차량 목록을 우선 조회합니다.
 * 
 * @param pageNo - 페이지 번호 (기본값: 1)
 * @param numOfRows - 가져올 건수 (기본값: 20)
 * @param region - 시/도 지역명 필터 (선택적)
 * @returns 어댑터를 통해 정규화된 차량 GongItem 배열
 */
export async function fetchOnbidCarList(pageNo = 1, numOfRows = 20, region?: string): Promise<GongItem[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    resultType: 'json',
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    pvctTrgtYn: 'N',
    dspsMthodCd: '0001',
    prptDivCd: '0007,0002', // 신탁/담보 및 압류재산 공매 차량 조회
  })

  // 시/도 지역 필터 (예: '서울', '전남광주', '부산' 등)
  const regionQueries = getRegionApiQueries(region)

  if (regionQueries.length <= 1) {
    if (regionQueries.length === 1) {
      params.append('lctnSdnm', regionQueries[0])
    }

    const requestUrl = `${BASE_URL}/B010003/OnbidCarListSrvc2/getCarCltrList2?${params.toString()}`

    try {
      const res = await fetch(requestUrl)
      if (!res.ok) return []
      const data = await res.json()
      const rawItems = data.body?.items?.item || data.response?.body?.items?.item
      if (!rawItems) return []
      const list: RawOnbidItem[] = Array.isArray(rawItems) ? rawItems : [rawItems]
      return list.map((item, idx) => {
        const gongItem = adaptOnbidToGongItem(item, idx)
        gongItem.category = 'car'
        gongItem.categoryIcon = 'directions_car'
        return gongItem
      })
    } catch {
      return []
    }
  }

  // 복수 쿼리 대상(예: '전남광주') 병렬 호출 및 병합
  try {
    const promises = regionQueries.slice(0, 3).map(async (queryName) => {
      const p = new URLSearchParams(params)
      p.set('lctnSdnm', queryName)
      const res = await fetch(`${BASE_URL}/B010003/OnbidCarListSrvc2/getCarCltrList2?${p.toString()}`)
      if (!res.ok) return []
      const data = await res.json()
      const raw = data.body?.items?.item || data.response?.body?.items?.item
      if (!raw) return []
      const list: RawOnbidItem[] = Array.isArray(raw) ? raw : [raw]
      return list.map((item, idx) => {
        const gongItem = adaptOnbidToGongItem(item, idx)
        gongItem.category = 'car'
        gongItem.categoryIcon = 'directions_car'
        return gongItem
      })
    })

    const results = await Promise.all(promises)
    const combined = results.flat()

    const seen = new Set<string>()
    return combined.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  } catch {
    return []
  }
}
