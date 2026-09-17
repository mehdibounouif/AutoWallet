import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'

// AutoWallet Logo Monogram Icon
function AutoWalletLogo() {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/')}
      className="flex items-center gap-2.5 cursor-pointer select-none"
    >
      <svg className="w-9 h-9" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 10L14 30L19 18L24 30L34 10"
          stroke="#2fa599"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 21H30"
          stroke="#38b2ac"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-bold text-slate-800 text-2xl tracking-tight">AutoWallet</span>
    </div>
  )
}

// Google 4-Color Brand Icon
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

// GitHub Mark Icon
function GitHubIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 fill-slate-900" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

// Page 1: AutoWallet Login Page
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/maintenance')
  }

  return (
    <div className="min-h-screen bg-[#f3f7fa] text-slate-800 flex flex-col font-sans">

      {/* Top Navigation Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-12">
          <AutoWalletLogo />
          <nav className="hidden md:flex items-center gap-8 text-base font-medium text-slate-500">
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              className="hover:text-slate-800 transition cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              className="hover:text-slate-800 transition cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              className="hover:text-slate-800 transition cursor-pointer"
            >
              FAQ
            </button>
          </nav>
        </div>

        {/* Right: Sign Up Button */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="bg-[#3f6560] hover:bg-[#345450] text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Content Area: Centered Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-slate-300/50 border border-slate-100/80 overflow-hidden flex flex-col md:flex-row min-h-[580px]">
          
          {/* Left Panel: 38ddfff3 SVG Illustration & Welcome (Matches #E0EFEF background) */}
          <div className="w-full md:w-[48%] bg-[#E0EFEF] p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-slate-900 leading-tight">
                Welcome Back
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-3 font-normal leading-relaxed">
                Log in to access your envelopes and transactions.
              </p>
            </div>

            {/* Illustration: 38ddfff3-fe1c-44bf-a233-3c4e6ee3e529.svg */}
            <div className="flex items-end justify-center pt-8 pb-2">
              <img
                src="/38ddfff3-fe1c-44bf-a233-3c4e6ee3e529.svg"
                alt="AutoWallet Illustration"
                className="w-full max-h-[380px] object-contain drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Right Panel: Enlarged Form Elements */}
          <div className="w-full md:w-[52%] bg-white p-8 sm:p-12 flex flex-col justify-center">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Address */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4a7c76] focus:ring-2 focus:ring-[#4a7c76]/20 transition shadow-xs"
                />
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4a7c76] focus:ring-2 focus:ring-[#4a7c76]/20 transition shadow-xs"
                />
              </div>

              {/* Options Row: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-[#4a7c76] focus:ring-[#4a7c76] cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 font-medium">Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => navigate('/maintenance')}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Log In Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#447670] to-[#558d86] hover:from-[#3a6862] hover:to-[#4a7d77] text-white font-semibold text-base shadow-md shadow-teal-900/15 active:scale-[0.99] transition cursor-pointer tracking-wide"
              >
                Log In
              </button>

              {/* Divider: or log in with */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-400 font-normal">
                    or log in with:
                  </span>
                </div>
              </div>

              {/* OAuth Social Buttons */}
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => navigate('/maintenance')}
                  className="flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700 transition cursor-pointer shadow-xs"
                >
                  <GoogleIcon />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/maintenance')}
                  className="flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700 transition cursor-pointer shadow-xs"
                >
                  <GitHubIcon />
                  <span>GitHub</span>
                </button>
              </div>

              {/* Don't have an account prompt */}
              <div className="text-center pt-3">
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/maintenance')}
                    className="text-[#3ea89f] font-semibold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}

// Page 2: The Under Maintenance Page
function MaintenancePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f3f7fa] text-slate-800 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-teal-50 border border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
          🛠️
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Under Maintenance</h1>
          <p className="text-sm text-slate-500">
            This module is currently being connected to the AutoWallet backend.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#3f6560] hover:bg-[#345450] text-white font-medium py-3.5 px-4 rounded-xl transition shadow-md shadow-teal-900/10 cursor-pointer"
        >
          ← Go Back to Login
        </button>
      </div>
    </div>
  )
}

// Root Router: switches between Page 1 ("/") and Page 2 ("/maintenance")
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
      </Routes>
    </BrowserRouter>
  )
}
