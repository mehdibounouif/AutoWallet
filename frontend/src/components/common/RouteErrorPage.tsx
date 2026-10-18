export function RouteErrorPage() {
  return <main className="min-h-screen flex items-center justify-center bg-[#F3F6FA] px-4 py-10 text-[#1A2330]">
    <section className="w-full max-w-md rounded-2xl border border-[#DDE3EA] bg-white p-6 sm:p-9" aria-labelledby="page-error-title">
      <img src="/AW.svg" alt="AutoWallet" className="mb-6 h-10 w-auto" />
      <h1 id="page-error-title" className="text-2xl font-semibold">We couldn’t display this page</h1>
      <p role="alert" className="mt-3 text-sm leading-6 text-[#5E6B7E]">Try reloading the page. If you were submitting a change, check its status before trying again.</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-lg bg-[#5A64B4] px-5 text-sm font-semibold text-white">Reload page</button>
        <a href="/dashboard" className="text-sm font-semibold text-[#5963B6] underline">Go to Home</a>
      </div>
    </section>
  </main>
}
