export function GongMyScreen() {
  return (
    <div className="flex flex-col gap-5 pb-24 px-4 pt-2">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#e5eeff] shadow-2xs flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl bg-[#002046] flex items-center justify-center text-white font-headline font-bold text-xl">
          공
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-headline font-bold text-[#002046]">공차자 회원</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5]">
              일반 투자자
            </span>
          </div>
          <p className="text-xs text-[#74777f] mt-0.5">ibkproject126@gmail.com</p>
        </div>
      </div>

      {/* Quick Menu */}
      <div className="bg-white rounded-2xl border border-[#e5eeff] p-2 divide-y divide-[#f8f9ff]">
        <button
          type="button"
          onClick={() => alert('온비드 공동인증서 연동 준비 중입니다.')}
          className="w-full p-3 flex items-center justify-between text-xs text-[#0b1c30] hover:bg-[#f8f9ff] rounded-xl transition-colors"
        >
          <span className="flex items-center gap-2.5 font-semibold">
            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">key</span>
            온비드 전자입찰 인증서 관리
          </span>
          <span className="material-symbols-outlined text-[18px] text-[#74777f]">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={() => alert('입찰 내역 조회 준비 중입니다.')}
          className="w-full p-3 flex items-center justify-between text-xs text-[#0b1c30] hover:bg-[#f8f9ff] rounded-xl transition-colors"
        >
          <span className="flex items-center gap-2.5 font-semibold">
            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">receipt_long</span>
            나의 모의/실전 입찰 내역
          </span>
          <span className="material-symbols-outlined text-[18px] text-[#74777f]">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={() => alert('공공데이터 포털 OpenAPI v2.4와 정상 연동 중입니다.')}
          className="w-full p-3 flex items-center justify-between text-xs text-[#0b1c30] hover:bg-[#f8f9ff] rounded-xl transition-colors"
        >
          <span className="flex items-center gap-2.5 font-semibold">
            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">api</span>
            공공데이터 포털 API 연동 상태
          </span>
          <span className="text-[11px] font-bold text-[#059669]">정상 연동됨</span>
        </button>
      </div>

      {/* System Info */}
      <div className="p-4 bg-[#eff4ff] rounded-2xl text-xs text-[#44474e] space-y-1">
        <p className="font-bold text-[#002046]">공차자 공매 정보 앱 (v2.4)</p>
        <p className="text-[11px] text-[#74777f]">
          데이터 출처: 한국자산관리공사(KAMCO) 온비드 및 대법원 법원경매정보
        </p>
      </div>
    </div>
  )
}
