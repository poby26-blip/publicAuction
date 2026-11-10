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

export const GONG_REGIONS = ['전체', '서울', '경기', '인천', '부산', '대전', '대구', '광주']

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
  // Urgent D-1 items (Stitch Screen 1)
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

  // Half-price & Failed Recommended items (Stitch Section 5)
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
