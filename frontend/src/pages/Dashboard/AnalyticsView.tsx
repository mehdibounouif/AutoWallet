import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, BarChart3, ChevronDown, House, Landmark, PiggyBank, RefreshCw, TrendingUp, X } from 'lucide-react'
import type { DashboardData, DashboardTransaction } from './dashboardApi'
import { envelopeMeta, envelopeTarget, money, walletOrder } from './envelopeDisplay'
import { hasCompleteSplit } from './paymentUtils'

const chartColor = (type: typeof walletOrder[number]) => type === 'free' ? '#EDA100' : type === 'main' ? '#8A95D2' : envelopeMeta[type].color
type Row = (string | number)[]

function ChartCard({ title, description, headers, rows, children, unavailable }: { title: string; description: string; headers: string[]; rows: Row[]; children?: ReactNode; unavailable?: string }) {
  const [showData, setShowData] = useState(false)
  return <section className="workspace-card analytics-chart"><h3>{title}</h3><p>{description}</p>{unavailable ? <div className="analytics-chart-unavailable"><BarChart3 size={22} /><p>{unavailable}</p></div> : <><div className="analytics-chart-canvas">{children}</div><button className="analytics-data-toggle" onClick={() => setShowData(value => !value)} aria-expanded={showData}>{showData ? 'Hide data' : 'Show data'}<ChevronDown size={13} /></button>{showData && <div className="analytics-data-table"><table><caption className="sr-only">{title}</caption><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}</>}</section>
}

function monthlySeries(payments: DashboardTransaction[]) {
  const groups = new Map<string, { label: string; total: number; payments: DashboardTransaction[] }>()
  for (const payment of payments) {
    if (!payment.created_at) continue
    const date = new Date(payment.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const month = groups.get(key) ?? { label: new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date), total: 0, payments: [] }
    month.total += payment.amount
    month.payments.push(payment)
    groups.set(key, month)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, month]) => month)
}

export function AnalyticsView({ data, onRecord, recordDisabled, onAsk, onRules, onRefresh }: { data: DashboardData; onRecord: () => void; recordDisabled: boolean; onAsk: (question: string) => void; onRules: () => void; onRefresh: () => void }) {
  const [period, setPeriod] = useState('all')
  const [dismissed, setDismissed] = useState<string[]>([])
  const processed = useMemo(() => data.transactions.filter(item => item.status === 'processed'), [data.transactions])
  const dated = processed.every(item => Boolean(item.created_at))
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - Number(period) + 1, 1)
  const payments = period === 'all' ? processed : processed.filter(item => item.created_at && new Date(item.created_at) >= start && new Date(item.created_at) <= now)
  const total = payments.reduce((sum, item) => sum + item.amount, 0)
  const average = payments.length ? total / payments.length : 0
  const deviation = payments.length ? Math.sqrt(payments.reduce((sum, item) => sum + (item.amount - average) ** 2, 0) / payments.length) : 0
  const swing = average > 0 ? deviation / average * 100 : 0
  const thisMonth = processed.filter(item => item.created_at && new Date(item.created_at).getFullYear() === now.getFullYear() && new Date(item.created_at).getMonth() === now.getMonth()).reduce((sum, item) => sum + item.amount, 0)
  const complete = payments.length > 0 && payments.every(hasCompleteSplit)
  const allocations = Object.fromEntries(walletOrder.map(type => [type, payments.reduce((sum, item) => sum + (item.allocations?.[type] ?? 0), 0)]))
  const months = monthlySeries(payments)
  const maxMonthly = Math.max(1, ...months.map(month => month.total))
  const datedComplete = complete && dated
  const balances = Object.fromEntries(data.wallets.map(wallet => [wallet.wallet_type, wallet.balance]))
  const rent = data.rules.find(rule => rule.is_active && rule.target_wallet === 'rent' && rule.rule_type === 'lock_fixed')?.fixed_amount ?? 0
  const savings = balances.savings ?? 0
  const cap = envelopeTarget('savings', data.rules)
  const taxRate = data.rules.find(rule => rule.is_active && rule.target_wallet === 'tax' && rule.rule_type === 'percentage_remainder')?.percentage
  const expectedTax = taxRate === null || taxRate === undefined ? null : total * taxRate / 100
  const tax = balances.tax ?? 0
  const coverage = rent > 0 ? savings / rent : null
  const incomeMax = Math.max(1, ...payments.map(item => item.amount))
  const minimum = payments.length ? Math.min(...payments.map(item => item.amount)) : 0
  const width = Math.max(1, incomeMax - minimum) / 5
  const histogram = Array.from({ length: 5 }, (_, index) => {
    const lower = minimum + width * index
    const upper = index === 4 ? Math.max(incomeMax, lower + width) : lower + width
    return { lower, upper, count: payments.filter(item => item.amount >= lower && (index === 4 ? item.amount <= upper : item.amount < upper)).length }
  })
  const maxCount = Math.max(1, ...histogram.map(bin => bin.count))
  const splitMissing = 'Saved payment allocations are needed for this chart. They are not included in every payment response yet.'
  const datesMissing = 'Payment timestamps are needed for this chart. They are not included in the payment response yet.'
  const moneyCell = (amount: number) => money.format(amount)
  const cumulative = [...payments].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
  const running = Object.fromEntries(walletOrder.map(type => [type, 0]))
  const series = cumulative.map(payment => {
    for (const type of walletOrder) running[type] += payment.allocations?.[type] ?? 0
    return { payment, values: { ...running } }
  })
  const maxAllocation = Math.max(1, ...Object.values(allocations))
  const suggestions = [
    { id: 'tax', icon: Landmark, title: 'Compare your Tax reserve', text: expectedTax !== null ? `${money.format(tax)} MAD is reserved. ${taxRate}% of the selected income would be ${money.format(expectedTax)} MAD. This is a comparison, not a tax bill.` : 'Add a Tax rule to compare your reserve with a percentage of income.', question: 'Explain my Tax reserve compared with my current Tax rule and payments.' },
    { id: 'cap', icon: PiggyBank, title: cap ? `${money.format(Math.max(0, cap - savings))} MAD to your Savings cap` : 'Give your Savings a target', text: cap ? `${money.format(savings)} of ${money.format(cap)} MAD is saved. Check the cap before your next payment.` : 'A Savings cap helps you see how close you are to your target.', question: 'Explain how my Savings cap works and what happens when it is reached.' },
    { id: 'rent', icon: House, title: coverage !== null ? `Savings covers ${coverage.toFixed(1)} rent payments` : 'See how much rent Savings covers', text: rent > 0 ? `At your current Rent rule of ${money.format(rent)} MAD, your Savings balance covers ${coverage!.toFixed(1)} payments. This does not include other living costs.` : 'A fixed Rent rule is needed to calculate this comparison.', question: 'Explain how my current Savings compares with my Rent rule.' },
    { id: 'swing', icon: TrendingUp, title: payments.length > 1 ? `${Math.round(swing)}% payment swing` : 'Build up your payment history', text: payments.length > 1 ? `Your average payment is ${money.format(average)} MAD, with a standard deviation of ${money.format(deviation)} MAD across ${payments.length} payments.` : 'Record more payments to compare the variation in your income.', question: 'Explain how variable my recent payment amounts are and what that means for my envelope rules.' },
  ]

  return <div className="workspace-page analytics-page"><header className="workspace-heading"><div><h1>Analytics</h1><p>{period === 'all' ? 'All recorded income' : `Last ${period} calendar months`} · {payments.length} processed {payments.length === 1 ? 'payment' : 'payments'}</p></div><label className="analytics-period"><span className="sr-only">Analytics period</span><select value={period} onChange={event => setPeriod(event.target.value)}><option value="all">All time</option><option value="3" disabled={!dated}>Last 3 months</option><option value="6" disabled={!dated}>Last 6 months</option></select></label></header>
    {!processed.length ? <section className="workspace-empty workspace-card"><BarChart3 size={38} /><h2>Nothing to analyse yet</h2><p>Record your first payment to see where your income goes.</p><button className="dashboard-primary-button" onClick={onRecord} disabled={recordDisabled}>Record payment</button></section> : !payments.length ? <section className="workspace-empty workspace-card"><BarChart3 size={35} /><h2>No payments in this period</h2><button className="dashboard-secondary-button" onClick={() => setPeriod('all')}>See all time</button></section> : <>
      <div className="analytics-overview"><section className="workspace-card analytics-health"><svg viewBox="0 0 220 130" role="img" aria-label="Health score unavailable"><path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="#e7ecf2" strokeWidth="14" strokeLinecap="round" /><text x="110" y="100" textAnchor="middle" fill="#8693a6" fontSize="42">—</text></svg><h2>Not available right now</h2><p>A health score is not available from the service yet. Your payment totals are shown alongside.</p><button className="workspace-text-button" onClick={onRefresh}><RefreshCw size={13} />Refresh data</button></section>
        <div className="analytics-overview-right"><div className="analytics-stats"><section className="workspace-card"><h2>Income this month</h2><strong>{dated ? money.format(thisMonth) : '—'} <small>MAD</small></strong><p>{dated ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now) : 'Payment dates unavailable'}</p></section><section className="workspace-card"><h2>Average payment</h2><strong>{money.format(average)} <small>MAD</small></strong><p>Across {payments.length} payments</p></section><section className="workspace-card"><h2>Payment swing</h2><strong>{payments.length > 1 ? `${Math.round(swing)}%` : '—'}</strong><p>{payments.length > 1 ? 'Standard deviation ÷ average' : 'Needs at least 2 payments'}</p></section></div>
        <section className="workspace-card analytics-income"><h2>Where your income went</h2>{complete ? <><div className="analytics-stacked-bar" role="img" aria-label="Recorded income by envelope">{walletOrder.map(type => allocations[type] > 0 && <span key={type} style={{ width: `${allocations[type] / total * 100}%`, backgroundColor: chartColor(type) }} title={`${envelopeMeta[type].name}: ${money.format(allocations[type])} MAD`} />)}</div><div className="analytics-allocation-list">{walletOrder.map(type => <div key={type}><span><i style={{ backgroundColor: chartColor(type) }} />{envelopeMeta[type].name}</span><strong>{money.format(allocations[type])}</strong><small>{(allocations[type] / total * 100).toFixed(1)}%</small></div>)}</div></> : <p className="analytics-inline-unavailable">{splitMissing}</p>}</section></div>
      </div>
      <header className="workspace-heading analytics-section-heading"><div><h2>Suggestions</h2><p>From your own numbers. Review your rules before making a change.</p></div>{dismissed.length > 0 && <button className="workspace-text-button" onClick={() => setDismissed([])}>Show dismissed</button>}</header>
      <div className="analytics-suggestions">{suggestions.filter(item => !dismissed.includes(item.id)).map(({ id, icon: Icon, title, text, question }) => <article key={id} className="workspace-card analytics-suggestion"><div className="analytics-suggestion-top"><Icon size={19} /><span className="workspace-tag">Local engine</span><button onClick={() => setDismissed(items => [...items, id])} aria-label={`Dismiss ${title}`}><X size={15} /></button></div><h3>{title}</h3><p>{text}</p><div><button className="workspace-text-button" onClick={() => onAsk(question)}>Ask why<ArrowRight size={14} /></button><button className="workspace-text-button" onClick={onRules}>Review rules</button></div></article>)}</div>
      <header className="workspace-heading analytics-section-heading"><div><h2>The details</h2><p>Focus or hover over a chart for exact amounts. Open its data table for all values.</p></div></header>
      <div className="analytics-charts">
        <ChartCard title="Income by envelope" description="Where each month’s recorded payments went." headers={['Month', ...walletOrder.map(type => `${envelopeMeta[type].name} (MAD)`)]} rows={months.map(month => [month.label, ...walletOrder.map(type => moneyCell(month.payments.reduce((sum, payment) => sum + (payment.allocations?.[type] ?? 0), 0)))])} unavailable={!dated ? datesMissing : !datedComplete ? splitMissing : undefined}>
          <div className="analytics-columns">{months.map(month => <div key={month.label} className="analytics-column"><div className="analytics-column-stack" style={{ height: `${month.total / maxMonthly * 100}%` }}>{walletOrder.map(type => { const value = month.payments.reduce((sum, item) => sum + (item.allocations?.[type] ?? 0), 0); return value > 0 && <span tabIndex={0} key={type} style={{ height: `${value / month.total * 100}%`, backgroundColor: chartColor(type) }} title={`${month.label}, ${envelopeMeta[type].name}: ${money.format(value)} MAD`} aria-label={`${month.label}, ${envelopeMeta[type].name}: ${money.format(value)} MAD`} /> })}</div><small>{month.label}</small></div>)}</div><ChartLegend />
        </ChartCard>
        <ChartCard title="Monthly income" description="Total processed income, before splitting." headers={['Month', 'Income (MAD)']} rows={months.map(month => [month.label, moneyCell(month.total)])} unavailable={!dated ? datesMissing : undefined}>
          <div className="analytics-columns">{months.map(month => <div key={month.label} className="analytics-column"><div tabIndex={0} className="analytics-column-fill" style={{ height: `${month.total / maxMonthly * 100}%` }} title={`${month.label}: ${money.format(month.total)} MAD`} aria-label={`${month.label}: ${money.format(month.total)} MAD`} /><small>{month.label}</small></div>)}</div>
        </ChartCard>
        <ChartCard title="How allocations built up" description="Cumulative recorded allocations, not historical account balances." headers={['Payment', ...walletOrder.map(type => `${envelopeMeta[type].name} (MAD)`)]} rows={series.map(({ payment, values }) => [payment.reference, ...walletOrder.map(type => moneyCell(values[type]))])} unavailable={!dated ? datesMissing : !datedComplete ? splitMissing : undefined}>
          <svg className="analytics-lines" viewBox="0 0 440 180" role="img" aria-label="Cumulative allocations by payment">{[35, 80, 125, 170].map(y => <line key={y} x1="12" y1={y} x2="430" y2={y} stroke="#e6ebf1" />)}{walletOrder.map(type => { const points = series.map(({ values }, index) => [12 + index / Math.max(1, series.length - 1) * 418, 170 - values[type] / maxAllocation * 150]); return <g key={type}><polyline points={points.map(point => point.join(',')).join(' ')} fill="none" stroke={chartColor(type)} strokeWidth="2.5" />{points.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="3" fill={chartColor(type)} tabIndex={0} aria-label={`${envelopeMeta[type].name}, after ${series[index].payment.reference}: ${money.format(series[index].values[type])} MAD`}><title>{envelopeMeta[type].name}: {money.format(series[index].values[type])} MAD</title></circle>)}</g> })}</svg><ChartLegend />
        </ChartCard>
        <ChartCard title="Your usual payment size" description="The number of payments in each amount range." headers={['Amount range (MAD)', 'Payments']} rows={histogram.map(bin => [`${money.format(bin.lower)}–${money.format(bin.upper)}`, bin.count])}>
          <div className="analytics-columns analytics-histogram">{histogram.map((bin, i) => <div key={i} className="analytics-column"><div tabIndex={0} className="analytics-column-fill" style={{ height: `${bin.count / maxCount * 100}%`, backgroundColor: '#7280bd' }} title={`${money.format(bin.lower)}–${money.format(bin.upper)} MAD: ${bin.count} payments`} aria-label={`${money.format(bin.lower)} to ${money.format(bin.upper)} MAD: ${bin.count} payments`} /><small>{Math.round(bin.lower).toLocaleString('en-US')}</small></div>)}</div>
        </ChartCard>
        <ChartCard title="How much payments swing" description={`Average ${money.format(average)} MAD · standard deviation ${money.format(deviation)} MAD.`} headers={['Reference', 'Amount (MAD)', 'Difference from average (MAD)']} rows={payments.map(item => [item.reference, moneyCell(item.amount), moneyCell(item.amount - average)])}>
          <svg viewBox="0 0 440 150" className="analytics-swing" role="img" aria-label="Payment amounts around the average"><rect x={12 + Math.max(0, average - deviation) / incomeMax * 410} y="20" width={(Math.min(incomeMax, average + deviation) - Math.max(0, average - deviation)) / incomeMax * 410} height="90" rx="6" fill="#eff1fa" /><line x1="12" x2="422" y1="110" y2="110" stroke="#dce3eb" /><line x1={12 + average / incomeMax * 410} x2={12 + average / incomeMax * 410} y1="15" y2="115" stroke="#5963b6" strokeDasharray="4 4" />{payments.map((item, index) => <circle key={item.id} cx={12 + item.amount / incomeMax * 410} cy={40 + index % 3 * 25} r="4" fill="#5963b6" tabIndex={0} aria-label={`${item.reference}: ${money.format(item.amount)} MAD`}><title>{item.reference}: {money.format(item.amount)} MAD</title></circle>)}<text x="12" y="140" fontSize="11" fill="#74839b">0 MAD</text><text x="422" y="140" textAnchor="end" fontSize="11" fill="#74839b">{money.format(incomeMax)} MAD</text></svg>
        </ChartCard>
        <ChartCard title="Tax reserve vs income reference" description={expectedTax !== null ? `Reference: ${taxRate}% of the selected gross income. Your rule applies to the remainder, so these can differ.` : 'An active percentage rule for Tax is needed.'} headers={['Measure', 'Amount (MAD)']} rows={expectedTax !== null ? [['Current Tax balance', moneyCell(tax)], [`${taxRate}% of selected income`, moneyCell(expectedTax)]] : []} unavailable={expectedTax === null ? 'No active percentage rule for Tax.' : undefined}>
          <div className="analytics-horizontal-bars">{[['Tax reserve', tax, '#EB6834'], ['Income reference', expectedTax ?? 0, '#aab5c6']].map(([label, amount, color]) => <div key={String(label)}><div><span>{label}</span><strong>{money.format(Number(amount))} MAD</strong></div><span className="analytics-horizontal-track"><i style={{ width: `${Math.max(0, Number(amount)) / Math.max(1, tax, expectedTax ?? 0) * 100}%`, backgroundColor: String(color) }} /></span></div>)}</div>
        </ChartCard>
        <ChartCard title="How much rent Savings covers" description={coverage !== null ? `${money.format(savings)} MAD in Savings ÷ ${money.format(rent)} MAD per Rent payment.` : 'A fixed Rent rule is needed to calculate coverage.'} headers={['Savings (MAD)', 'Rent per payment (MAD)', 'Rent payments covered']} rows={coverage !== null ? [[moneyCell(savings), moneyCell(rent), coverage.toFixed(2)]] : []} unavailable={coverage === null ? 'Set a fixed Rent rule to see this comparison.' : undefined}>
          <div className="analytics-coverage"><strong>{coverage?.toFixed(1)} <small>rent payments</small></strong><div>{Array.from({ length: 3 }, (_, index) => <span key={index}><i style={{ width: `${Math.max(0, Math.min(1, (coverage ?? 0) - index)) * 100}%` }} /></span>)}</div><p>Each segment represents one Rent payment. Other living costs are not included.</p></div>
        </ChartCard>
      </div>
    </>}
  </div>
}

function ChartLegend() {
  return <div className="analytics-legend">{walletOrder.map(type => <span key={type}><i style={{ backgroundColor: chartColor(type) }} />{envelopeMeta[type].name}</span>)}</div>
}
