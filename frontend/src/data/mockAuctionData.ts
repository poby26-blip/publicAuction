export interface GongItem {
  id: string
  title: string
  category: string
  categoryIcon: string
  address: string
  appraisalPrice: number
  minimumPrice: number
  discountRate: number // %
  dDay: number
  deadlineTime?: string
  failCount: number
  auctionType: string // '신탁공매' | '압류재산' | '국유재산' | '대법원경매'
  auctionDate: string
  imageUrl: string
  images: string[]
  area: string
  viewCount: number
  isUrgent?: boolean
  isHalfPrice?: boolean
}

/**
 * 대한민국 17개 표준 광역자치단체 및 전남광주통합특별시 메타데이터 인터페이스
 */
export interface RegionMeta {
  /** UI 표시용 짧은 명칭 (모바일 칩/탭용: '전체', '서울', '경기', '전남광주', '울산' 등) */
  label: string
  /** 정식 행정구역 명칭 (셀렉트박스 등: '전국', '서울특별시', '전남광주통합특별시' 등) */
  fullName: string
  /** 온비드 API 조회 시 lctnSdnm 파라미터로 넘길 유효 질의어 목록 */
  apiQueries: string[]
  /** 주소(address) 문자열 일치 판정에 사용할 키워드 목록 */
  matchKeywords: string[]
}

/**
 * 대한민국 표준 광역자치단체 및 2026년 출범 '전남광주통합특별시' 공식 메타데이터 정의
 */
export const GONG_REGION_METAS: RegionMeta[] = [
  {
    label: '전체',
    fullName: '전국',
    apiQueries: [],
    matchKeywords: [],
  },
  {
    label: '서울',
    fullName: '서울특별시',
    apiQueries: ['서울특별시', '서울'],
    matchKeywords: ['서울', '서울특별시'],
  },
  {
    label: '경기',
    fullName: '경기도',
    apiQueries: ['경기도', '경기'],
    matchKeywords: ['경기', '경기도'],
  },
  {
    label: '인천',
    fullName: '인천광역시',
    apiQueries: ['인천광역시', '인천'],
    matchKeywords: ['인천', '인천광역시'],
  },
  {
    label: '부산',
    fullName: '부산광역시',
    apiQueries: ['부산광역시', '부산'],
    matchKeywords: ['부산', '부산광역시'],
  },
  {
    label: '대구',
    fullName: '대구광역시',
    apiQueries: ['대구광역시', '대구'],
    matchKeywords: ['대구', '대구광역시'],
  },
  {
    label: '대전',
    fullName: '대전광역시',
    apiQueries: ['대전광역시', '대전'],
    matchKeywords: ['대전', '대전광역시'],
  },
  {
    label: '울산',
    fullName: '울산광역시',
    apiQueries: ['울산광역시', '울산'],
    matchKeywords: ['울산', '울산광역시'],
  },
  {
    label: '세종',
    fullName: '세종특별자치시',
    apiQueries: ['세종특별자치시', '세종'],
    matchKeywords: ['세종', '세종특별자치시'],
  },
  {
    label: '강원',
    fullName: '강원특별자치도',
    apiQueries: ['강원특별자치도', '강원도', '강원'],
    matchKeywords: ['강원', '강원도', '강원특별자치도'],
  },
  {
    label: '충북',
    fullName: '충청북도',
    apiQueries: ['충청북도', '충북'],
    matchKeywords: ['충북', '충청북도'],
  },
  {
    label: '충남',
    fullName: '충청남도',
    apiQueries: ['충청남도', '충남'],
    matchKeywords: ['충남', '충청남도'],
  },
  {
    label: '전북',
    fullName: '전북특별자치도',
    apiQueries: ['전북특별자치도', '전라북도', '전북'],
    matchKeywords: ['전북', '전북특별자치도', '전라북도'],
  },
  {
    label: '전남광주',
    fullName: '전남광주통합특별시',
    apiQueries: ['전남광주통합특별시', '광주광역시', '전라남도', '광주', '전남'],
    matchKeywords: ['전남광주', '광주특별시', '광주광역시', '전라남도', '광주', '전남'],
  },
  {
    label: '경북',
    fullName: '경상북도',
    apiQueries: ['경상북도', '경북'],
    matchKeywords: ['경북', '경상북도'],
  },
  {
    label: '경남',
    fullName: '경상남도',
    apiQueries: ['경상남도', '경남'],
    matchKeywords: ['경남', '경상남도'],
  },
  {
    label: '제주',
    fullName: '제주특별자치도',
    apiQueries: ['제주특별자치도', '제주도', '제주'],
    matchKeywords: ['제주', '제주도', '제주특별자치도'],
  },
]

/**
 * 기존 UI 칩 및 드롭다운과 하위 호환성을 유지하기 위한 17개 표준 지역 라벨 목록
 */
export const GONG_REGIONS = GONG_REGION_METAS.map((r) => r.label)

/**
 * 주어진 물건 주소(address)가 선택된 지역(selectedRegion)과 일치하는지 판별합니다.
 * - '전체'이거나 지역이 지정되지 않은 경우 항상 true를 반환합니다.
 * - '전남광주' 선택 시 '전남광주통합특별시', '광주광역시', '전라남도'를 모두 매칭합니다.
 * - '충북' 선택 시 '충청북도', '충북'을 모두 매칭합니다.
 * 
 * @param address - 물건 소재지 주소
 * @param selectedRegion - 사용자가 선택한 지역명 (label 또는 fullName)
 * @returns 매칭 여부 (boolean)
 */
export function isRegionMatch(address: string, selectedRegion?: string): boolean {
  if (!selectedRegion || selectedRegion === '전체' || selectedRegion === '전국') {
    return true
  }

  const meta = GONG_REGION_METAS.find(
    (r) => r.label === selectedRegion || r.fullName === selectedRegion
  )

  if (!meta) {
    // 정의되지 않은 임의 지역명일 경우 단순 포함 여부 검사
    return address.includes(selectedRegion)
  }

  return meta.matchKeywords.some((kw) => address.includes(kw))
}

/**
 * 선택된 지역명에 대해 온비드 OpenAPI의 lctnSdnm 파라미터로 사용할 유효 질의어 목록을 반환합니다.
 * @param selectedRegion - 선택된 지역명
 * @returns OpenAPI 시도명 파라미터 배열 (예: ['충청북도'] 또는 전남광주의 경우 ['전남광주통합특별시', '광주광역시', '전라남도'])
 */
export function getRegionApiQueries(selectedRegion?: string): string[] {
  if (!selectedRegion || selectedRegion === '전체' || selectedRegion === '전국') {
    return []
  }

  const meta = GONG_REGION_METAS.find(
    (r) => r.label === selectedRegion || r.fullName === selectedRegion
  )

  return meta ? meta.apiQueries : [selectedRegion]
}

export const GONG_CATEGORIES = [
  { id: 'apt', label: '아파트/주택', icon: 'apartment', count: 142 },
  { id: 'commercial', label: '상가/오피스', icon: 'storefront', count: 89 },
  { id: 'land', label: '토지/임야', icon: 'landscape', count: 215 },
  { id: 'car', label: '자동차/운송', icon: 'directions_car', count: 64 },
  { id: 'goods', label: '동산/귀금속', icon: 'inventory_2', count: 37 },
  { id: 'factory', label: '공장/창고', icon: 'factory', count: 48 },
  { id: 'new', label: '신규등록', icon: 'bolt', count: 52 },
  { id: 'half', label: '반값공매', icon: 'local_fire_department', count: 76 },
]

export const MOCK_GONG_ITEMS: GongItem[] = [
  // 마감 임박 특가 물건
  {
    id: 'gong-01',
    title: '서울 송파구 잠실동 레이크팰리스 84㎡',
    category: 'apt',
    categoryIcon: 'apartment',
    address: '서울특별시 송파구 잠실레이크팰리스 112동 1802호',
    appraisalPrice: 1850000000,
    minimumPrice: 1295000000,
    discountRate: 30,
    dDay: 1,
    deadlineTime: '14:00 마감',
    failCount: 1,
    auctionType: '압류재산',
    auctionDate: '2026.11.11(수) 14:00',
    area: '전용 84.82㎡ (약 25.7평)',
    viewCount: 1420,
    isUrgent: true,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'gong-02',
    title: '경기 하남시 미사강변 센트럴자이 74㎡',
    category: 'apt',
    categoryIcon: 'apartment',
    address: '경기도 하남시 미사강변한강로 센트럴자이 104동 1201호',
    appraisalPrice: 980000000,
    minimumPrice: 686000000,
    discountRate: 30,
    dDay: 2,
    deadlineTime: '16:00 마감',
    failCount: 1,
    auctionType: '신탁공매',
    auctionDate: '2026.11.12(목) 16:00',
    area: '전용 74.5㎡ (약 22.5평)',
    viewCount: 980,
    isUrgent: true,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'gong-03',
    title: '2021 현대 제네시스 G80 2.5T 가솔린 AWD',
    category: 'car',
    categoryIcon: 'directions_car',
    address: '인천광역시 서구 원창동 한국자산관리공사 차량보관소',
    appraisalPrice: 43000000,
    minimumPrice: 25800000,
    discountRate: 40,
    dDay: 1,
    deadlineTime: '11:00 마감',
    failCount: 2,
    auctionType: '국유재산',
    auctionDate: '2026.11.11(수) 11:00',
    area: '주행거리 32,500km / 무사고',
    viewCount: 2150,
    isUrgent: true,
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
    ],
  },

  // 유찰 추천 반값 물건
  {
    id: 'gong-04',
    title: '서울 강남구 역삼동 근린상가 2층 65㎡',
    category: 'commercial',
    categoryIcon: 'storefront',
    address: '서울특별시 강남구 테헤란로 152 역삼파크빌딩 204호',
    appraisalPrice: 720000000,
    minimumPrice: 368640000,
    discountRate: 51,
    dDay: 6,
    failCount: 3,
    auctionType: '신탁공매',
    auctionDate: '2026.11.16(월) 10:00~16:00',
    area: '전용 65.2㎡ (약 19.7평)',
    viewCount: 3420,
    isHalfPrice: true,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'gong-05',
    title: '인천 연수구 송도동 프리미엄 오피스텔 59㎡',
    category: 'commercial',
    categoryIcon: 'storefront',
    address: '인천광역시 연수구 컨벤시아대로 송도더샵 102동 1502호',
    appraisalPrice: 350000000,
    minimumPrice: 245000000,
    discountRate: 30,
    dDay: 7,
    failCount: 2,
    auctionType: '압류재산',
    auctionDate: '2026.11.17(화) 10:00',
    area: '전용 59.4㎡ (약 18.0평)',
    viewCount: 1680,
    isHalfPrice: false,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'gong-06',
    title: '강원 춘천시 남면 전원주택 대지 및 건물 420㎡',
    category: 'apt',
    categoryIcon: 'holiday_village',
    address: '강원특별자치도 춘천시 남면 남이섬로 88-12',
    appraisalPrice: 210000000,
    minimumPrice: 86100000,
    discountRate: 59,
    dDay: 12,
    failCount: 4,
    auctionType: '국유재산',
    auctionDate: '2026.11.22(일) 10:00',
    area: '대지 420㎡ / 건물 115㎡',
    viewCount: 4890,
    isHalfPrice: true,
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
    ],
  },
]

export function formatWon(price: number): string {
  if (price >= 100000000) {
    const eok = Math.floor(price / 100000000)
    const man = Math.floor((price % 100000000) / 10000)
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`
  }
  return `${Math.floor(price / 10000).toLocaleString()}만원`
}

export const formatPrice = formatWon

