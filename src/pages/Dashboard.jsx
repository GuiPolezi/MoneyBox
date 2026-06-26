import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { useStore } from '../lib/store'
import { useTheme } from '../lib/theme'
import { useUI } from '../ui'
import { brl, monthLabel, addMonths } from '../lib/format'
import {
  totalBalance, totalInvested, monthSummary, categoryBreakdown,
  monthlyHistory, forecast, budgetProgress,
} from '../lib/finance'
import { BigNumber, Progress, Empty, TxRow } from '../components/common'
import { Wallet, Target, TrendingUp, Clock, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { accounts, transactions, categories, budgets } = useStore()
  const { month, openNew } = useUI()
  const dark = useTheme((s) => s.theme === 'dark')

  // Cores dos gráficos que precisam acompanhar o tema
  const chart = dark
    ? {
        grid: '#2A332D',
        axis: '#94A296',
        pos: '#34C795',
        neg: '#F08A60',
        tooltip: { background: '#1A211D', border: '1px solid #2A332D', borderRadius: 12, color: '#E6EAE6' },
      }
    : {
        grid: '#E4E7E2',
        axis: '#6B7280',
        pos: '#0E7C5A',
        neg: '#C2410C',
        tooltip: { background: '#FFFFFF', border: '1px solid #E4E7E2', borderRadius: 12, color: '#16201A' },
      }

  const summary = useMemo(() => monthSummary(transactions, month), [transactions, month])
  const balance = useMemo(() => totalBalance(accounts, transactions), [accounts, transactions])
  const invested = useMemo(() => totalInvested(transactions), [transactions])
  const pie = useMemo(() => categoryBreakdown(transactions, categories, month), [transactions, categories, month])
  const history = useMemo(() => monthlyHistory(transactions, month, 6), [transactions, month])
  const fc = useMemo(() => forecast(transactions, month), [transactions, month])
  const budgetRows = useMemo(
    () => budgetProgress(budgets, transactions, categories, month),
    [budgets, transactions, categories, month]
  )

  const recent = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7),
    [transactions]
  )

  return (
    <div className="space-y-6 w-full">
      {/* Big numbers */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigNumber label="Saldo atual" value={balance} tone="neutral" sub="todas as contas"
          hint={<Wallet size={16} className="text-muted" />} />
        <BigNumber label="Receitas do mês" value={summary.income} tone="positive"
          hint={<span className="text-xs text-muted capitalize">{monthLabel(month).split(' ')[0]}</span>} />
        <BigNumber label="Despesas do mês" value={summary.expense} tone="negative"
          hint={<span className="text-xs text-muted capitalize">{monthLabel(month).split(' ')[0]}</span>} />
        <BigNumber label="Balanço do mês" value={summary.balance}
          tone={summary.balance >= 0 ? 'positive' : 'negative'}
          sub={summary.pending > 0 ? `${brl(summary.pending)} pendente` : 'sem pendências'} />
      </section>

      {/* Previsão + Investido */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 bg-brand text-white border-brand">
          <div className="flex items-center gap-2 text-white/70">
            <Clock size={15} />
            <p className="text-xs font-medium uppercase tracking-wide">
              Previsão · {monthLabel(fc.key)}
            </p>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold tnum">
            {brl(fc.balance)}
          </p>
          <p className="mt-1 text-sm text-white/70">
            Balanço estimado somando recorrentes, parcelas futuras e contas agendadas.
          </p>
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <p className="text-white/60">Entradas previstas</p>
              <p className="font-semibold tnum text-positive/90">{brl(fc.income)}</p>
            </div>
            <div>
              <p className="text-white/60">Saídas previstas</p>
              <p className="font-semibold tnum">{brl(fc.expense)}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="label mb-0">Total investido</p>
            <TrendingUp size={16} className="text-invest" />
          </div>
          <p className="font-display text-3xl font-semibold tracking-tight tnum text-invest">
            {brl(invested)}
          </p>
          <span className="h-1 w-10 rounded-full bg-invest" />
        </div>
      </section>

      {/* Gráficos */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-display font-semibold">Gastos por categoria</h2>
          <p className="text-xs text-muted">{monthLabel(month)}</p>
          {pie.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">Sem despesas neste mês.</p>
          ) : (
            <div className="mt-2 flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                      {pie.map((s) => <Cell key={s.id} fill={s.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => brl(v)} contentStyle={chart.tooltip} labelStyle={{ color: chart.tooltip.color }} itemStyle={{ color: chart.tooltip.color }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-2">
                {pie.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="tnum text-muted">{brl(s.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold">Histórico (6 meses)</h2>
          <p className="text-xs text-muted">Receitas x Despesas</p>
          <div className="mt-3 h-52">
            <ResponsiveContainer>
              <BarChart data={history} barGap={4}>
                <CartesianGrid vertical={false} stroke={chart.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false}
                  tick={{ fontSize: 12, fill: chart.axis }} />
                <Tooltip
                  formatter={(v, n) => [brl(v), n === 'receitas' ? 'Receitas' : 'Despesas']}
                  cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                  contentStyle={chart.tooltip}
                  labelStyle={{ color: chart.tooltip.color }}
                  itemStyle={{ color: chart.tooltip.color }}
                />
                <Bar dataKey="receitas" fill={chart.pos} radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill={chart.neg} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Transações recentes + Orçamentos */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="font-display font-semibold">Lançamentos recentes</h2>
          </div>
          {recent.length === 0 ? (
            <Empty title="Nada por aqui ainda" />
          ) : (
            <div className="divide-y divide-line">
              {recent.map((tx) => <TxRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-muted" />
            <h2 className="font-display font-semibold">Orçamentos do mês</h2>
          </div>
          {budgetRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">
              Defina tetos de gasto por categoria na aba Orçamentos.
            </p>
          ) : (
            <ul className="space-y-4">
              {budgetRows.map((b) => (
                <li key={b.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{b.category?.name}</span>
                    <span className="tnum text-muted">
                      {brl(b.spent)} <span className="text-muted/60">/ {brl(b.limit)}</span>
                    </span>
                  </div>
                  <Progress ratio={b.ratio} over={b.over} />
                  {b.over && (
                    <p className="mt-1 text-xs text-negative">
                      Ultrapassou em {brl(Math.abs(b.remaining))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
