import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export function MaintenancePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full bg-[#F3F6FA] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DDE3EA] p-8 sm:p-10 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ECEEFA] flex items-center justify-center text-[#5A64B4]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A2330]">Dashboard Preview</h1>
        <p className="text-sm text-[#5E6B7E] leading-relaxed">
          Authentication succeeded or preview mode active. The core dashboard and envelopes are ready for implementation next.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full h-11 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] text-white text-sm font-medium transition cursor-pointer"
          >
            Back to Auth Screen
          </button>
        </div>
      </div>
    </div>
  )
}
