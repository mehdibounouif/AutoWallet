import { Link } from 'react-router-dom'
import { TopBar } from '../../components/common/TopBar'

interface LegalPageProps {
  document: 'terms' | 'privacy'
}

const documents = {
  terms: {
    title: 'Terms',
    intro: 'Information about using the current AutoWallet prototype.',
    sections: [
      {
        title: 'What AutoWallet does',
        body: 'AutoWallet records a bank account ID and shows how a payment would be divided between budgeting envelopes. It does not connect to your bank or move money.',
      },
      {
        title: 'Payment previews',
        body: 'The Try a payment screen is a local simulation. It does not change account balances. Rule values edited during signup currently affect the preview only; the saved account still uses the default rules.',
      },
      {
        title: 'Using the prototype',
        body: 'Enter an account ID you are authorized to use. Check any calculated amounts yourself before relying on them. The Tax envelope is a budgeting example, not tax advice.',
      },
    ],
  },
  privacy: {
    title: 'Privacy',
    intro: 'What the current AutoWallet prototype does with information you enter.',
    sections: [
      {
        title: 'Account information',
        body: 'Registration sends your name, email, password, and bank account ID to the AutoWallet backend. The backend stores a password hash rather than the password itself. Your bank account ID is used to associate simulated payment activity with your account.',
      },
      {
        title: 'Information in your browser',
        body: 'While signup or two-factor sign-in is in progress, your password stays in page memory and is lost when the page reloads. Other signup draft details are kept in session storage. After sign-in, the browser stores an access token in local storage until you log out.',
      },
      {
        title: 'Payment preview',
        body: 'The amount you enter on Try a payment is calculated in your browser. Running that preview does not submit a payment or change real balances.',
      },
    ],
  },
} as const

export function LegalPage({ document }: LegalPageProps) {
  const content = documents[document]

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col">
      <TopBar />
      <main className="w-full max-w-[760px] mx-auto flex-1 px-4 py-8 sm:py-12">
        <article className="rounded-2xl border border-[#DDE3EA] bg-white p-6 sm:p-10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5A64B4]">AutoWallet prototype</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1A2330]">{content.title}</h1>
          <p className="mt-3 text-[#5E6B7E] leading-relaxed">{content.intro}</p>
          <div className="mt-8 space-y-7">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-[#1A2330]">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#3B495D]">{section.body}</p>
              </section>
            ))}
          </div>
          <p className="mt-8 rounded-xl bg-[#ECEEFA] px-4 py-3 text-sm text-[#3B495D]">
            This page describes the prototype. A complete legal policy must be reviewed before public release.
          </p>
          <nav aria-label="Account and legal pages" className="mt-8 flex flex-wrap gap-5 text-sm font-medium text-[#4A53A0]">
            <Link to="/login" className="hover:underline">Back to login</Link>
            <Link to={document === 'terms' ? '/privacy' : '/terms'} className="hover:underline">
              {document === 'terms' ? 'Privacy' : 'Terms'}
            </Link>
          </nav>
        </article>
      </main>
    </div>
  )
}
