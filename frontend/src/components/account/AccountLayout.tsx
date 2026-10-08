import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, LogOut, MessageCircle, ShieldCheck } from 'lucide-react'
import { clearToken } from '../../api/client'
import { LegalFooter } from '../common/LegalFooter'
import { translations } from '../../i18n'

const links = [
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/assistant', label: 'Assistant', icon: MessageCircle },
  { to: '/account/privacy', label: 'Privacy & data', icon: ShieldCheck },
]

interface AccountLayoutProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

/** The frame of the signed-in pages (behind RequireToken): logo, navigation, log out, page title and the legal links. */
export function AccountLayout({ title, subtitle, actions, children }: AccountLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col">
      <header className="bg-white border-b border-[#DDE3EA]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/analytics" className="flex items-center gap-2.5 shrink-0 hover:opacity-90">
            <img src="/AW.svg" alt="" className="h-8 w-auto" />
            <span className="text-xl font-bold text-[#3B495D] tracking-tight leading-none">AutoWallet</span>
          </Link>
          <nav aria-label="Account" className="order-3 md:order-none w-full md:w-auto md:flex-1 flex items-center gap-1 overflow-x-auto">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 h-9 px-3 rounded-[10px] text-sm font-medium whitespace-nowrap transition ${
                    isActive ? 'bg-[#ECEEFA] text-[#4A53A0]' : 'text-[#5E6B7E] hover:text-[#1A2330] hover:bg-[#F3F6FA]'
                  }`
                }
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              clearToken()
              navigate('/login')
            }}
            className="ml-auto inline-flex items-center gap-2 h-9 px-3 rounded-[10px] text-sm font-medium text-[#5E6B7E] hover:text-[#1A2330] hover:bg-[#F3F6FA] transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1200px] mx-auto flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2330]">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[#5E6B7E]">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>

      <div className="pb-6">
        <LegalFooter t={translations} />
      </div>
    </div>
  )
}
