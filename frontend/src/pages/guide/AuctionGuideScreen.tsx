/**
 * @file AuctionGuideScreen.tsx
 * @description 공매 초보자를 위한 온비드 공매 가이드 오버레이 페이지 컴포넌트입니다.
 *
 * [주요 섹션 구성]
 * 1. 핵심 비결: 감정가보다 40% 저렴하게 낙찰받는 3가지 비결 + 압류재산·신탁공매 비교
 * 2. 실전 체크리스트: 입찰 전 권리분석 필수 5계명 (직접 체크 가능한 인터랙티브 UI)
 * 3. 입찰 로드맵: 온비드 공매 입찰 5단계 진행 절차
 * 4. 용어 사전: 초보자가 꼭 알아야 할 핵심 용어 5선 (아코디언 토글)
 * 5. 하단 CTA: 반값공매 물건 바로 보러가기
 */

import { useState } from 'react'

interface AuctionGuideScreenProps {
  /** 가이드 화면 닫기(뒤로가기) 콜백 */
  onBack: () => void
  /** '반값공매 물건 바로 보러가기' 클릭 시 목록 화면 이동 콜백 */
  onExploreHalfPrice: () => void
}

/** 낙찰 3가지 비결 데이터 */
const WINNING_SECRETS = [
  {
    step: '비결 01',
    icon: 'trending_down',
    title: '유찰 2~4회차(20~40% 할인) 공략',
    summary:
      '공매는 입찰자가 없으면 다음 회차로 넘어가며 통상 최저입찰가가 약 10%씩 하락합니다.',
    tip: '50% 이상 반값 구간은 경쟁이 급격히 몰리므로, 유찰 2~4회차 구간이나 초기 보증금 부담으로 경쟁자가 적은 물건을 노리는 전략이 유리합니다.',
  },
  {
    step: '비결 02',
    icon: 'balance',
    title: '압류재산과 신탁공매 구분하기',
    summary:
      '압류재산(세금 체납)은 기준 권리 이후가 소멸되어 초보자에게 적합하고, 신탁공매는 특약 확인이 필수입니다.',
    tip: '신탁공매는 공고문 특약에 따라 매수인 인수 조건이 있어 진입 장벽이 높지만, 그만큼 경쟁률이 낮아 저가 낙찰 기회가 많습니다.',
  },
  {
    step: '비결 03',
    icon: 'notifications_active',
    title: '비대면 온라인 입찰 & 알림 활용',
    summary:
      '법원 출석 없이 온비드 PC·모바일로 전국 어디서나 편리하게 입찰할 수 있습니다.',
    tip: "공매이지의 '입찰 D-1 특가', '반값공매' 필터와 관심물건 기일 알림을 활용하면 유찰 직후 경쟁이 덜한 타이밍을 놓치지 않습니다.",
  },
] as const

/** 입찰 전 권리분석 체크리스트 5계명 */
const CHECKLIST_ITEMS = [
  {
    id: 'notice',
    title: '1. 공고문 및 공매재산명세서 정독하기',
    desc: '압류재산은 공매재산명세서, 신탁공매는 공고문의 특수조건·부대조건에서 매수인 인수 조건을 반드시 확인하세요.',
    appTip: '공매이지 상세 화면 > 입찰 유의·특이사항 확인',
  },
  {
    id: 'tenant',
    title: '2. 임차인 현황 및 배분요구 종기일 확인하기',
    desc: '대항력 있는 선순위 임차인이 있는지, 보증금을 낙찰자가 추가로 인수해야 하는지 확인해야 합니다.',
    appTip: '공매이지 상세 화면 > 임대차·점유 건수 및 배분요구종기일 확인',
  },
  {
    id: 'eviction',
    title: '3. 명도(인도) 책임 주체 파악하기',
    desc: '기존 점유자를 내보내는 명도 책임이 낙찰자에게 있는지 확인하고, 협상 및 명도 비용·기간을 입찰가에 반영하세요.',
    appTip: '공매이지 상세 화면 > 명도/인도 책임 항목 확인',
  },
  {
    id: 'appraisal',
    title: '4. 감정평가서와 현재 시세 비교하기',
    desc: '감정 평가 시점과 현재 시장 시세의 차이를 파악해야 고가 낙찰을 피할 수 있습니다.',
    appTip: '공매이지 상세 화면 > 감정평가 내역 원문 & 네이버·카카오 지도 확인',
  },
  {
    id: 'arrears',
    title: '5. 미납 관리비 및 공과금 체납 여부 확인하기',
    desc: '아파트·상가·오피스텔 등 집합건물은 공용부분 미납 관리비를 낙찰자가 승계할 수 있으므로 관리사무소 사전 문의가 필요합니다.',
    appTip: '현장 임장 및 관리사무소 유선 확인 권장',
  },
] as const

/** 온비드 입찰 5단계 로드맵 */
const BIDDING_STEPS = [
  {
    step: 'STEP 1',
    title: '물건 탐색 & 관심 등록',
    desc: '공매이지에서 지역·상품군(부동산/동산/자동차)을 고르고, 마음에 드는 물건은 하트(찜)와 기일 알림을 설정합니다.',
  },
  {
    step: 'STEP 2',
    title: '권리분석 & 목표 입찰가 산정',
    desc: '예상 시세에서 취득세, 명도비, 수리비, 기대 수익을 뺀 나만의 상한선 입찰가를 미리 정합니다.',
  },
  {
    step: 'STEP 3',
    title: '온비드 전자입찰 & 보증금 납부',
    desc: '온비드(onbid.co.kr)에 인증서 로그인 후 물건관리번호를 조회하고, 입찰서 제출 후 가상계좌로 입찰보증금(통상 최저입찰가의 10%)을 마감 전까지 입금합니다.',
  },
  {
    step: 'STEP 4',
    title: '개찰 및 매각결정 확인',
    desc: '보통 입찰 마감 다음 날 개찰이 진행됩니다. 최고가 입찰 시 매각결정이 내려지며, 패찰 시 보증금은 등록 계좌로 전액 자동 환불됩니다.',
  },
  {
    step: 'STEP 5',
    title: '잔금 납부 & 소유권 이전',
    desc: '지정 기한 내 잔금을 완납하면 소유권 이전 등기(압류재산은 촉탁등기 등) 절차를 거쳐 내 소유가 됩니다.',
  },
] as const

/** 필수 용어 사전 */
const GLOSSARY_ITEMS = [
  {
    id: 'appraisal_min',
    term: '감정가 vs 최저입찰가',
    short: '평가 기준 가격과 이번 회차 입찰 최소 금액',
    detail:
      '감정가는 감정평가사가 산정한 물건의 기준 가치이며, 최저입찰가는 이번 공매 회차에서 입찰할 수 있는 최소 금액입니다. 유찰될 때마다 최저입찰가가 낮아져 할인율이 커집니다.',
  },
  {
    id: 'deposit',
    term: '입찰보증금 (통상 10%)',
    short: '입찰 참여 시 가상계좌로 예치하는 보증금',
    detail:
      '입찰 의사를 확인하기 위해 납부하는 금액으로 보통 최저입찰가의 10%입니다. 낙찰 후 정당한 사유 없이 계약을 포기하면 보증금은 몰수되므로 반드시 분석 후 입찰해야 하며, 유찰·패찰 시 100% 환불됩니다.',
  },
  {
    id: 'private_contract',
    term: '유찰 & 수의계약',
    short: '입찰자 없음(유찰)과 선착순·협의 매각(수의계약)',
    detail:
      '입찰자가 없어 다음 회차로 넘어가는 것이 유찰입니다. 여러 번 유찰된 물건은 일정 기간 정해진 조건으로 선착순·협의 매각(수의계약)으로 전환될 수 있습니다. 공매이지 기본 목록은 경쟁입찰 매물을 우선 표출합니다.',
  },
  {
    id: 'distribution',
    term: '배분요구종기일',
    short: '임차인·채권자가 배당을 신고해야 하는 마감 기한',
    detail:
      '임차인이나 권리자가 매각 대금에서 보증금·채권을 배분받기 위해 권리 신고를 해야 하는 마감일입니다. 선순위 임차인의 배분요구 여부에 따라 보증금 인수 여부가 달라지므로 중요합니다.',
  },
  {
    id: 'entrust_reg',
    term: '촉탁등기',
    short: 'KAMCO가 대신 신청해 주는 편리한 소유권 이전 등기',
    detail:
      '압류재산 공매에서 잔금을 완납하면 한국자산관리공사(KAMCO)가 관할 등기소에 소유권 이전 및 말소 등기를 대신 촉탁(신청)해 주는 제도입니다. (등록면허세 등 관련 제세금은 매수인 부담)',
  },
] as const

export function AuctionGuideScreen({
  onBack,
  onExploreHalfPrice,
}: AuctionGuideScreenProps) {
  /** 사용자가 체크한 권리분석 체크리스트 ID 집합 */
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  /** 용어 사전 아코디언 열림 ID */
  const [openTermId, setOpenTermId] = useState<string | null>('appraisal_min')

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const completedCount = checkedIds.length
  const totalCheckCount = CHECKLIST_ITEMS.length

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-32">
      {/* =================================================================== */}
      {/* 1. 상단 Sticky 앱바                                                 */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-30 bg-[#f8f9ff]/95 backdrop-blur-md border-b border-[#e5eeff] px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#002046] hover:bg-[#eff4ff] active:scale-95 transition-all cursor-pointer"
            aria-label="뒤로가기"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="text-lg sm:text-xl font-headline font-extrabold text-[#002046] tracking-tight">
            공매 초보 가이드
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5] text-xs font-bold">
            입문서
          </span>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-sm sm:text-base font-bold text-[#44474e] hover:text-[#002046] px-3 py-1.5 rounded-lg hover:bg-[#eff4ff] transition-colors cursor-pointer"
        >
          닫기
        </button>
      </header>

      {/* 본문 컨테이너 */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 flex flex-col gap-8">
        {/* ================================================================= */}
        {/* 2. 히어로 인사이트 카드                                           */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002046] via-[#1b365d] to-[#0051d5] text-white p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-white/15 text-[#85f8c4] backdrop-blur-xs mb-3.5">
              <span className="material-symbols-outlined text-[18px]">school</span>
              공매이지 입문 가이드
            </span>
            <h2 className="text-2xl sm:text-3xl font-headline font-extrabold leading-snug">
              감정가보다 <span className="text-[#85f8c4]">40% 저렴하게</span>
              <br />
              낙찰받는 3가지 비결
            </h2>
            <p className="text-base sm:text-lg text-white/90 mt-3 leading-relaxed">
              유찰 구조의 원리부터 압류재산·신탁공매 권리분석 체크리스트, 온비드
              전자입찰 실전 절차까지 초보자가 꼭 알아야 할 핵심만 모았습니다.
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#316bf3]/30 rounded-full blur-2xl pointer-events-none" />
        </section>

        {/* ================================================================= */}
        {/* 3. 낙찰 3가지 핵심 비결 + 압류 vs 신탁 비교                       */}
        {/* ================================================================= */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-[#0051d5]">
              emoji_objects
            </span>
            <h3 className="text-xl sm:text-2xl font-headline font-extrabold text-[#002046]">
              저가 낙찰을 위한 3가지 핵심 비결
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {WINNING_SECRETS.map((secret) => (
              <article
                key={secret.step}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5eeff] shadow-2xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#eff4ff] text-[#0051d5] text-xs font-extrabold">
                    {secret.step}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#002046] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">
                      {secret.icon}
                    </span>
                  </div>
                </div>
                <h4 className="text-lg sm:text-xl font-extrabold text-[#002046] leading-snug">
                  {secret.title}
                </h4>
                <p className="text-base text-[#44474e] leading-relaxed">
                  {secret.summary}
                </p>
                <div className="mt-auto pt-3 border-t border-[#eff4ff] text-sm text-[#0051d5] font-semibold leading-relaxed flex items-start gap-2">
                  <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                    tips_and_updates
                  </span>
                  <span>{secret.tip}</span>
                </div>
              </article>
            ))}
          </div>

          {/* 압류재산 vs 신탁공매 한눈에 비교 */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#dce9ff] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#f8f9ff] p-4 sm:p-5 border border-[#e5eeff]">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded bg-[#0051d5] text-white text-xs sm:text-sm font-bold">
                  압류재산
                </span>
                <span className="text-base font-extrabold text-[#002046]">초보자 추천</span>
              </div>
              <p className="text-sm sm:text-base text-[#44474e] leading-relaxed">
                국세·지방세 체납으로 압류된 물건입니다. 기준 권리 이후 권리가
                소멸되며 촉탁등기가 지원되어 경매 경험이 없어도 접근하기 좋습니다.
              </p>
            </div>
            <div className="rounded-xl bg-[#f8f9ff] p-4 sm:p-5 border border-[#e5eeff]">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded bg-[#002046] text-white text-xs sm:text-sm font-bold">
                  신탁공매
                </span>
                <span className="text-base font-extrabold text-[#002046]">특약 확인 필수</span>
              </div>
              <p className="text-sm sm:text-base text-[#44474e] leading-relaxed">
                부동산 신탁사가 위탁받아 매각하는 물건입니다. 공고문 특약에 따라
                미납 관리비·임차인 인수 조건이 달라지므로 공고문 정독이 핵심입니다.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. 입찰 전 권리분석 필수 5계명 (인터랙티브 체크리스트)            */}
        {/* ================================================================= */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[26px] text-[#059669]">
                fact_check
              </span>
              <h3 className="text-xl sm:text-2xl font-headline font-extrabold text-[#002046]">
                입찰 전 권리분석 필수 5계명
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold ${
                  completedCount === totalCheckCount
                    ? 'bg-emerald-100 text-[#059669]'
                    : 'bg-[#eff4ff] text-[#0051d5]'
                }`}
              >
                {completedCount}/{totalCheckCount} 점검 완료
              </span>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setCheckedIds([])}
                  className="text-xs sm:text-sm font-bold text-[#74777f] hover:text-[#002046] cursor-pointer"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-2xs divide-y divide-[#eff4ff] overflow-hidden">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = checkedIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full p-4 sm:p-5 text-left flex items-start gap-3.5 transition-colors cursor-pointer ${
                    isChecked ? 'bg-emerald-50/40' : 'hover:bg-[#f8f9ff]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[26px] shrink-0 mt-0.5 transition-colors ${
                      isChecked ? 'text-[#059669]' : 'text-[#c4c6cf]'
                    }`}
                  >
                    {isChecked ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-base sm:text-lg font-bold leading-snug transition-colors ${
                        isChecked
                          ? 'text-[#059669] line-through'
                          : 'text-[#002046]'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-sm sm:text-base text-[#44474e] mt-1.5 leading-relaxed">
                      {item.desc}
                    </p>
                    <p className="text-xs sm:text-sm text-[#0051d5] font-semibold mt-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] shrink-0">
                        smartphone
                      </span>
                      <span>{item.appTip}</span>
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 5. 온비드 공매 입찰 5단계 실전 로드맵                             */}
        {/* ================================================================= */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-[#0051d5]">
              route
            </span>
            <h3 className="text-xl sm:text-2xl font-headline font-extrabold text-[#002046]">
              온비드 공매 입찰 5단계 절차
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5eeff] shadow-2xs flex flex-col gap-4">
            {BIDDING_STEPS.map((step, idx) => (
              <div key={step.step} className="flex items-stretch gap-3.5">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#002046] text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  {idx < BIDDING_STEPS.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-6 bg-[#dce9ff] mt-1.5" />
                  )}
                </div>
                <div className={`flex-1 ${idx < BIDDING_STEPS.length - 1 ? 'pb-3' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-[#0051d5]">
                      {step.step}
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold text-[#002046]">
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-sm sm:text-base text-[#44474e] mt-1.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 6. 초보자 필수 용어 사전 (아코디언)                               */}
        {/* ================================================================= */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-[#0051d5]">
              menu_book
            </span>
            <h3 className="text-xl sm:text-2xl font-headline font-extrabold text-[#002046]">
              초보자 필수 공매 용어 사전
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-2xs divide-y divide-[#eff4ff] overflow-hidden">
            {GLOSSARY_ITEMS.map((item) => {
              const isOpen = openTermId === item.id
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenTermId(isOpen ? null : item.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-[#f8f9ff] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-base sm:text-lg font-extrabold text-[#002046]">
                        {item.term}
                      </p>
                      <p className="text-sm text-[#74777f] mt-1 leading-snug">
                        {item.short}
                      </p>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[24px] text-[#44474e] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#0051d5]' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-2 bg-[#f8f9ff]/70 text-sm sm:text-base text-[#44474e] leading-relaxed">
                      {item.detail}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* =================================================================== */}
      {/* 7. 하단 고정 CTA 바                                                 */}
      {/* =================================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#e5eeff] px-4 md:px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-3.5 rounded-2xl border border-[#c4c6cf]/70 text-base font-bold text-[#44474e] hover:bg-[#eff4ff] transition-colors cursor-pointer shrink-0"
          >
            홈으로
          </button>
          <button
            type="button"
            onClick={onExploreHalfPrice}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-[#0051d5] hover:bg-[#003ea8] active:scale-[0.99] text-white text-base font-extrabold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              local_fire_department
            </span>
            <span>반값공매 물건 바로 보러가기</span>
          </button>
        </div>
      </div>
    </div>
  )
}
