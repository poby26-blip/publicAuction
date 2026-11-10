import { useState } from 'react'

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'bookmark' | 'my'>('home')

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Mobile Screen Container */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-lg relative">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              PA
            </div>
            <h1 className="text-base font-semibold text-slate-800">공공경매</h1>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
            하이브리드
          </span>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 p-4 pb-20">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white mb-6 shadow-sm">
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">Stitch 화면 설계 준비 완료</span>
            <h2 className="text-xl font-bold mt-2">공공경매 모바일 웹</h2>
            <p className="text-xs text-blue-100 mt-1">Google Stitch 화면 기획을 기반으로 컴포넌트를 구현합니다.</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">React + TypeScript 환경</p>
                <p className="text-xs text-slate-500">Vite & Tailwind CSS 설정 완료</p>
              </div>
              <span className="text-emerald-500 text-lg">✓</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">모바일 뷰포트 최적화</p>
                <p className="text-xs text-slate-500">Safe Area & 모바일 제스처 대응</p>
              </div>
              <span className="text-emerald-500 text-lg">✓</span>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">다음 단계</p>
                <p className="text-xs text-blue-600">Stitch 기획 화면 및 컴포넌트 구현</p>
              </div>
              <span className="text-blue-500 text-sm font-semibold">대기중</span>
            </div>
          </div>
        </main>

        {/* Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-20">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center py-1 px-3 ${activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            <span className="text-xs">홈</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center py-1 px-3 ${activeTab === 'search' ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            <span className="text-xs">검색/물건</span>
          </button>
          <button
            onClick={() => setActiveTab('bookmark')}
            className={`flex flex-col items-center py-1 px-3 ${activeTab === 'bookmark' ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            <span className="text-xs">관심</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex flex-col items-center py-1 px-3 ${activeTab === 'my' ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            <span className="text-xs">MY</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
