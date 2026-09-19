import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Menu, X } from 'lucide-react'
import { GoogleIcon, GitHubIcon } from './icons'

// Page 1: AutoWallet Modern Authentication Page (Inspired by uploaded layout & UI Kit)
function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('yourmail@company.com')
  const [password, setPassword] = useState('password123')
  const [fullName, setFullName] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (activeTab === 'signup') {
      if (fullName.trim().length < 2) {
        setErrorMessage('Full name must be at least 2 characters.')
        return
      }
      if (bankAccountId.trim().length < 3) {
        setErrorMessage('Bank account ID must be at least 3 characters.')
        return
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters.')
        return
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.')
        return
      }
      if (!agreeTerms) {
        setErrorMessage('Please accept the Terms & Conditions.')
        return
      }
    }

    navigate('/maintenance')
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f2f7fc] via-[#edf4fa] to-[#e4eef7] relative flex flex-col font-sans overflow-x-hidden select-none">
      
      {/* Background Decorative Layer - Strictly behind all interactive UI (z-0, pointer-events-none) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Responsive Concentric Layered Organic Curved Arcs (Scales down gracefully on smaller windows / mobile) */}
        <div className="absolute -right-20 -top-20 sm:-right-32 sm:-top-32 w-[240px] sm:w-[380px] lg:w-[520px] h-[240px] sm:h-[380px] lg:h-[520px] rounded-full border-[18px] sm:border-[28px] lg:border-[40px] border-[#A2D0EF]/20" />
        <div className="absolute -left-12 sm:left-0 top-1/3 sm:top-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] md:w-[620px] lg:w-[720px] xl:w-[860px] h-[320px] sm:h-[500px] md:h-[620px] lg:h-[720px] xl:h-[860px] rounded-full border-[22px] sm:border-[36px] lg:border-[55px] border-[#A2D0EF]/25" />
        <div className="absolute left-2 sm:left-6 lg:left-12 top-1/3 sm:top-1/2 -translate-y-1/2 w-[260px] sm:w-[400px] md:w-[500px] lg:w-[580px] xl:w-[690px] h-[260px] sm:h-[400px] md:h-[500px] lg:h-[580px] xl:h-[690px] rounded-full border-[18px] sm:border-[30px] lg:border-[45px] border-[#8A95D2]/20" />
        <div className="absolute left-6 sm:left-12 lg:left-24 top-1/3 sm:top-1/2 -translate-y-1/2 w-[180px] sm:w-[300px] md:w-[380px] lg:w-[440px] xl:w-[520px] h-[180px] sm:h-[300px] md:h-[380px] lg:h-[440px] xl:h-[520px] rounded-full bg-gradient-to-br from-[#A2D0EF]/35 to-[#8A95D2]/30 blur-xs" />
        <div className="absolute -bottom-16 -left-16 sm:-bottom-24 sm:-left-24 w-[200px] sm:w-[300px] lg:w-[420px] h-[200px] sm:h-[300px] lg:h-[420px] rounded-full border-[16px] sm:border-[24px] lg:border-[35px] border-[#A2D0EF]/20" />
      </div>

      {/* TOP NAVIGATION - Responsive for Mobile & Desktop */}
      <header className="w-full px-4 sm:px-8 lg:px-16 py-3.5 sm:py-5 lg:py-6 flex items-center justify-between relative z-30">
        
        {/* Logo: AW + AutoWallet */}
        <div
          className="flex items-center gap-2 cursor-pointer group select-none"
          onClick={() => navigate('/')}
        >
          <img
            src="/AW.svg"
            alt="AutoWallet Logo"
            className="h-7 sm:h-8 lg:h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3B495D] tracking-tight leading-none">
            AutoWallet
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-semibold text-[#7B8B9E]">
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="hover:text-[#3B495D] transition cursor-pointer"
          >
            How it Works
          </button>
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="hover:text-[#3B495D] transition cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="hover:text-[#3B495D] transition cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Mobile Right: Hamburger Menu Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-[#3B495D] hover:bg-white/60 active:scale-95 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/maintenance')
              }}
              className="text-left px-3 py-2 text-sm font-semibold text-[#3B495D] hover:bg-[#F0F4F8] rounded-xl transition cursor-pointer"
            >
              How it Works
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/maintenance')
              }}
              className="text-left px-3 py-2 text-sm font-semibold text-[#3B495D] hover:bg-[#F0F4F8] rounded-xl transition cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/maintenance')
              }}
              className="text-left px-3 py-2 text-sm font-semibold text-[#3B495D] hover:bg-[#F0F4F8] rounded-xl transition cursor-pointer"
            >
              FAQ
            </button>
          </div>
        )}
      </header>

      {/* MAIN BODY: RESPONSIVE SPLIT VIEW (Illustration on top on mobile, left on desktop) */}
      <div className="flex-1 w-full flex flex-col lg:flex-row items-center lg:items-stretch justify-center relative z-10">
        
        {/* HERO ARTWORK COLUMN (Top on Mobile, Left on Desktop) */}
        <div className="w-full lg:w-[50%] xl:w-[52%] relative flex items-center justify-center px-4 py-3 sm:py-6 lg:py-16 overflow-hidden bg-transparent shrink-0">
          
          {/* Centered Isometric Desk Artwork */}
          <div className="relative z-10 w-full max-w-[210px] sm:max-w-[270px] md:max-w-xs lg:max-w-md xl:max-w-xl transition-transform duration-500 hover:scale-[1.03]">
            <img
              src="/login-desk-hero.png"
              alt="AutoWallet Budgeting Workstation"
              className="w-full h-auto object-contain drop-shadow-xl"
            />
          </div>

        </div>

        {/* AUTHENTICATION FORM COLUMN (Below Hero on Mobile, Right on Desktop) */}
        <div className="w-full lg:w-[50%] xl:w-[48%] flex items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 lg:py-12 relative z-10">
          <div className="w-full max-w-sm sm:max-w-md relative z-10">
            
            {/* Login / Sign up Tab Switcher - Styled like UI Kit "Tabs" component */}
            <div className="flex justify-center mb-7">
              <div className="inline-flex p-1.5 rounded-full bg-[#F0F4F8] border border-slate-200/60 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login')
                    setErrorMessage(null)
                  }}
                  className={`px-7 sm:px-8 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[#8A95D2] text-white shadow-xs shadow-[#8A95D2]/30'
                      : 'text-[#7B8B9E] hover:text-[#3B495D]'
                  }`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup')
                    setErrorMessage(null)
                  }}
                  className={`px-7 sm:px-8 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-[#8A95D2] text-white shadow-xs shadow-[#8A95D2]/30'
                      : 'text-[#7B8B9E] hover:text-[#3B495D]'
                  }`}
                >
                  Sign up
                </button>
              </div>
            </div>

            {/* ERROR BANNER - UI Kit Input Error Style */}
            {errorMessage && (
              <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#FFA5A5] text-[#D9383A] text-xs font-medium flex items-center gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D9383A]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (Sign Up only) */}
              {activeTab === 'signup' && (
                <div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full bg-[#F0F4F8] hover:bg-[#eaf1f7] focus:bg-white border border-transparent focus:border-[#8A95D2] focus:ring-2 focus:ring-[#8A95D2]/25 rounded-full px-5 py-3.5 text-xs sm:text-sm font-medium text-[#3B495D] placeholder-[#8F9CAE] focus:outline-none transition shadow-2xs"
                  />
                </div>
              )}

              {/* Email Address Input */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="w-full bg-[#F0F4F8] hover:bg-[#eaf1f7] focus:bg-white border border-transparent focus:border-[#8A95D2] focus:ring-2 focus:ring-[#8A95D2]/25 rounded-full px-5 py-3.5 text-xs sm:text-sm font-medium text-[#3B495D] placeholder-[#8F9CAE] focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Bank Account ID / IBAN (Sign Up only - Required by Backend) */}
              {activeTab === 'signup' && (
                <div>
                  <input
                    type="text"
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    placeholder="Bank Account ID / IBAN"
                    required
                    minLength={3}
                    maxLength={50}
                    className="w-full bg-[#F0F4F8] hover:bg-[#eaf1f7] focus:bg-white border border-transparent focus:border-[#8A95D2] focus:ring-2 focus:ring-[#8A95D2]/25 rounded-full px-5 py-3.5 text-xs sm:text-sm font-medium text-[#3B495D] placeholder-[#8F9CAE] focus:outline-none transition shadow-2xs tracking-wide"
                  />
                  <p className="px-5 pt-1.5 text-[11px] text-[#8F9CAE]">
                    Connect your income account for automated envelope splitting
                  </p>
                </div>
              )}

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={activeTab === 'signup' ? 8 : 1}
                  className="w-full bg-[#F0F4F8] hover:bg-[#eaf1f7] focus:bg-white border border-transparent focus:border-[#8A95D2] focus:ring-2 focus:ring-[#8A95D2]/25 rounded-full px-5 py-3.5 pr-12 text-xs sm:text-sm font-medium text-[#3B495D] placeholder-[#8F9CAE] focus:outline-none transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8F9CAE] hover:text-[#3B495D] transition cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {activeTab === 'signup' && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                    minLength={8}
                    className="w-full bg-[#F0F4F8] hover:bg-[#eaf1f7] focus:bg-white border border-transparent focus:border-[#8A95D2] focus:ring-2 focus:ring-[#8A95D2]/25 rounded-full px-5 py-3.5 pr-12 text-xs sm:text-sm font-medium text-[#3B495D] placeholder-[#8F9CAE] focus:outline-none transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8F9CAE] hover:text-[#3B495D] transition cursor-pointer p-1"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Options Row: Remember Me & Forgot Password / Terms */}
              <div className="flex items-center justify-between px-2 pt-1">
                {activeTab === 'login' ? (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#8A95D2] focus:ring-[#8A95D2] accent-[#8A95D2] cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm text-[#7B8B9E] font-medium">Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('/maintenance')}
                      className="text-xs sm:text-sm font-medium text-[#8A95D2] hover:text-[#7A85C2] hover:underline transition cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#8A95D2] focus:ring-[#8A95D2] accent-[#8A95D2] cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-[#7B8B9E] font-medium">
                      I agree to Terms & Conditions
                    </span>
                  </label>
                )}
              </div>

              {/* Main Full-Width Action Button - UI Kit Pill Button (#8A95D2) */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-full bg-[#8A95D2] hover:bg-[#7A85C2] text-white font-semibold text-sm sm:text-base shadow-md shadow-[#8A95D2]/30 active:scale-[0.99] transition cursor-pointer"
                >
                  {activeTab === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              </div>

              {/* Divider: "or log in with:" / "or sign up with:" */}
              <div className="flex items-center my-4 sm:my-5">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-3.5 text-xs text-[#8F9CAE] font-medium whitespace-nowrap">
                  {activeTab === 'login' ? 'or log in with:' : 'or sign up with:'}
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Social Login: Google and GitHub side by side */}
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/maintenance')}
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#8A95D2]/50 hover:bg-[#F8FAFC] shadow-xs active:scale-[0.98] transition cursor-pointer text-xs sm:text-sm font-semibold text-[#3B495D]"
                >
                  <GoogleIcon className="w-5 h-5 shrink-0" />
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/maintenance')}
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#8A95D2]/50 hover:bg-[#F8FAFC] shadow-xs active:scale-[0.98] transition cursor-pointer text-xs sm:text-sm font-semibold text-[#3B495D]"
                >
                  <GitHubIcon className="w-5 h-5 shrink-0 fill-current text-[#3B495D]" />
                  <span>GitHub</span>
                </button>
              </div>

            </form>

          </div>
        </div>



      </div>

    </div>
  )
}

// Page 2: The Under Maintenance Page (Updated to match UI Kit)
function MaintenancePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#eaf1f8] text-[#3B495D] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Ambient background curves */}
      <div className="absolute -left-32 -top-32 w-[500px] h-[500px] rounded-full bg-[#A2D0EF]/30 blur-3xl pointer-events-none" />
      <div className="absolute -right-32 -bottom-32 w-[500px] h-[500px] rounded-full bg-[#8A95D2]/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white border border-slate-100 rounded-3xl p-10 shadow-xl text-center space-y-6">
        <div className="flex justify-center">
          <img
            src="/AW.svg"
            alt="AutoWallet Logo"
            className="h-14 w-auto object-contain drop-shadow-md"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3B495D] tracking-tight">Under Maintenance</h1>
          <p className="text-xs sm:text-sm text-[#7B8B9E]">
            This module is currently being connected to the AutoWallet backend.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#8A95D2] hover:bg-[#7A85C2] text-white font-semibold py-3 px-4 rounded-full transition shadow-md shadow-[#8A95D2]/25 active:scale-95 cursor-pointer text-sm"
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
