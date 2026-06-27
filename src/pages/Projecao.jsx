import { useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Dot,
} from 'recharts'
import { useStore } from '../lib/store'
import { useTheme } from '../lib/theme'
import { useUI } from '../ui'
import { brl, monthLabel, monthShort } from '../lib/format'
import { cashFlowProjection } from '../lib/finance'
import { Empty } from '../components/common'
import {
  TrendingUp, AlertTriangle, ShieldCheck, ArrowDownToLine,
  Repeat, CreditCard, Wallet, CalendarClock,
} from 'lucide-react'

const HORIZONS = [
  { id: 3, label: '3 meses' },
  { id: 6, label: '6 meses' },
  { id: 12, label: '12 meses' },
]

export default function Projecao() {
  const { accounts, transactions } = useStore()
  const { month, openNew } = useUI()
  const dark = useTheme((s) => s.theme === 'dark')
  const [months, setMonths] = useState(6)

  const proj = useMemo(
    () => cashFlowProjection(accounts, transactions, month, months),
    [accounts, transactions, month, months]
  )

  const chart = dark
    ? { grid: '#2A332D', axis: '#94A296', pos: '#34C795', neg: '#F08A60', zero: '#5B6B60',
        tooltip: { background: '#1A211D', border: '1px solid #2A332D', borderRadius: 12, color: '#E6EAE6' } }
    : { grid: '#E4E7E2', axis: '#6B7280', pos: '#0E7C5A', neg: '#C2410C', zero: '#9CA3AF',
        tooltip: { background: '#FFFFFF', border: '1px solid #E4E7E2', borderRadius: 12, color: '#16201A' } }

  const data = useMemo(
    () => proj.rows.map((r) => ({
      key: r.key,
      label: monthShort(r.key).replace('.', ''),
      saldo: Math.round(r.closing * 100) / 100,
      current: r.current,
    })),
    [proj]
  )

  // Offset do gradiente no ponto onde o saldo cruza o zero — pinta de
  // verde acima da linha e de vermelho abaixo (a "zona de crédito").
  const gradientOffset = useMemo(() => {
    const vals = data.map((d) => d.saldo)
    const max = Math.max(...vals, 0)
    const min = Math.min(...vals, 0)
    if (max <= 0) return 0
    if (min >= 0) return 1
    return max / (max - min)
  }, [data])

  const hasData = accounts.length > 0 && proj.rows.length > 0
  const allPositive = !proj.firstNegative

  if (!hasData) {
    return (
      <Empty title="Sem dados para projetar" icon={TrendingUp}>
        Cadastre suas contas e lançamentos recorrentes para ver para onde o seu
        saldo caminha nos próximos meses.
      </Empty>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Veredito + horizonte */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Verdict proj={proj} allPositive={allPositive} />
        <div className="flex shrink-0 items-center rounded-xl border border-line bg-card p-1 self-start">
          {HORIZONS.map((h) => (
            <button
              key={h.id}
              onClick={() => setMonths(h.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                months === h.id ? 'bg-brand text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>

      {/* Métricas-chave */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          icon={Wallet}
          label="Saldo hoje"
          value={brl(proj.opening)}
          tone={proj.opening >= 0 ? 'neutral' : 'negative'}
          sub="todas as contas, já realizado"
        />
        <Metric
          icon={ArrowDownToLine}
          label="Menor saldo previsto"
          value={brl(proj.lowest.closing)}
          tone={proj.lowest.closing < 0 ? 'negative' : 'positive'}
          sub={`em ${monthLabel(proj.lowest.key).split(' ')[0]}`}
        />
        <Metric
          icon={proj.firstNegative ? AlertTriangle : ShieldCheck}
          label="Entra no vermelho"
          value={proj.firstNegative ? capitalize(monthLabel(proj.firstNegative.key).split(' ')[0]) : 'Não previsto'}
          tone={proj.firstNegative ? 'negative' : 'positive'}
          sub={proj.firstNegative ? brl(proj.firstNegative.closing) : `nos próximos ${months} meses`}
        />
        <Metric
          icon={CreditCard}
          label="Parcelas no período"
          value={brl(proj.totalInstallments)}
          tone="neutral"
          sub={`${months} meses à frente`}
        />
      </section>

      {/* Gráfico de saldo corrido */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold">Saldo projetado mês a mês</h2>
            <p className="text-xs text-muted">
              Parte do saldo de hoje e soma recorrentes, parcelas e contas agendadas.
            </p>
          </div>
          <span className="hidden sm:flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: chart.pos }} /> positivo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: chart.neg }} /> no crédito
            </span>
          </span>
        </div>

        <div className="mt-4 h-64 sm:h-72">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor={chart.pos} stopOpacity={0.28} />
                  <stop offset={gradientOffset} stopColor={chart.neg} stopOpacity={0.28} />
                </linearGradient>
                <linearGradient id="saldoStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor={chart.pos} stopOpacity={1} />
                  <stop offset={gradientOffset} stopColor={chart.neg} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={chart.grid} />
              <XAxis dataKey="label" tickLine={false} axisLine={false}
                tick={{ fontSize: 12, fill: chart.axis }} />
              <YAxis
                tickLine={false} axisLine={false} width={64}
                tick={{ fontSize: 11, fill: chart.axis }}
                tickFormatter={(v) => compact(v)}
              />
              <ReferenceLine y={0} stroke={chart.zero} strokeDasharray="4 4" />
              <Tooltip
                cursor={{ stroke: chart.grid }}
                contentStyle={chart.tooltip}
                labelStyle={{ color: chart.tooltip.color, fontWeight: 600 }}
                itemStyle={{ color: chart.tooltip.color }}
                formatter={(v) => [brl(v), 'Saldo previsto']}
                labelFormatter={(l, p) => (p?.[0] ? capitalize(monthLabel(p[0].payload.key)) : l)}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="url(#saldoStroke)"
                strokeWidth={2.5}
                fill="url(#saldoFill)"
                dot={(props) => <SaldoDot {...props} pos={chart.pos} neg={chart.neg} />}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tabela detalhada + o que move a projeção */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="font-display font-semibold">Mês a mês</h2>
            <p className="text-xs text-muted">Como cada mês fecha — e por quê.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-line">
                  <th className="px-5 py-3 font-medium">Mês</th>
                  <th className="px-3 py-3 font-medium text-right">Entradas</th>
                  <th className="px-3 py-3 font-medium text-right">Parcelas</th>
                  <th className="px-3 py-3 font-medium text-right">Saídas</th>
                  <th className="px-5 py-3 font-medium text-right">Saldo final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {proj.rows.map((r) => (
                  <tr key={r.key} className={r.negative ? 'bg-negative/[0.04]' : ''}>
                    <td className="px-5 py-3">
                      <span className="capitalize font-medium">
                        {monthLabel(r.key).split(' ')[0]}
                      </span>
                      {r.current && (
                        <span className="ml-2 chip bg-ink/[0.05] text-muted">restante</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tnum text-positive">
                      {r.income ? brl(r.income) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tnum text-muted">
                      {r.installments ? brl(r.installments) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right tnum text-negative">
                      {r.expense ? brl(r.expense) : '—'}
                    </td>
                    <td className={`px-5 py-3 text-right tnum font-semibold ${
                      r.negative ? 'text-negative' : 'text-ink'
                    }`}>
                      {brl(r.closing)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Drivers proj={proj} />
      </section>
    </div>
  )
}

/* ----------------------------- Veredito ----------------------------- */
function Verdict({ proj, allPositive }) {
  if (allPositive) {
    return (
      <div className="card p-5 bg-brand text-white border-brand flex-1">
        <div className="flex items-center gap-2 text-white/70">
          <ShieldCheck size={15} />
          <p className="text-xs font-medium uppercase tracking-wide">Sua projeção</p>
        </div>
        <p className="mt-3 font-display text-2xl font-semibold leading-snug">
          Seu saldo se mantém positivo no período.
        </p>
        <p className="mt-1 text-sm text-white/70">
          O ponto mais baixo é {brl(proj.lowest.closing)} em{' '}
          <span className="capitalize">{monthLabel(proj.lowest.key).split(' ')[0]}</span>. Esse é o
          colchão que você pode direcionar para quitar parcelas ou guardar.
        </p>
      </div>
    )
  }
  const fn = proj.firstNegative
  return (
    <div className="card p-5 bg-negative text-white border-negative flex-1">
      <div className="flex items-center gap-2 text-white/80">
        <AlertTriangle size={15} />
        <p className="text-xs font-medium uppercase tracking-wide">Atenção ao fluxo</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold leading-snug">
        Seu saldo fica negativo em{' '}
        <span className="capitalize">{monthLabel(fn.key).split(' ')[0]}</span>.
      </p>
      <p className="mt-1 text-sm text-white/80">
        Projetado em {brl(fn.closing)} — é quando você seria empurrado de volta ao
        crédito. Antecipe receitas ou reduza saídas desse mês para evitar o rombo.
      </p>
    </div>
  )
}

/* ----------------------------- Métrica ----------------------------- */
function Metric({ icon: Icon, label, value, tone = 'neutral', sub }) {
  const toneClass = {
    neutral: 'text-ink',
    positive: 'text-positive',
    negative: 'text-negative',
  }[tone]
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="label mb-0">{label}</p>
        <Icon size={16} className="text-muted" />
      </div>
      <p className={`mt-3 font-display text-2xl font-semibold tracking-tight tnum ${toneClass}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

/* --------------------- O que move a projeção --------------------- */
function Drivers({ proj }) {
  const incomes = proj.streams.filter((s) => s.type === 'income')
  const expenses = proj.streams.filter((s) => s.type === 'expense')
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Repeat size={16} className="text-muted" />
        <h2 className="font-display font-semibold">O que se repete todo mês</h2>
      </div>
      <p className="text-xs text-muted mb-4">
        Base fixa da projeção. Cada item conta uma vez por mês.
      </p>

      {proj.streams.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Nenhum lançamento marcado como recorrente ainda.
        </p>
      ) : (
        <div className="space-y-4">
          {incomes.length > 0 && (
            <DriverGroup title="Entradas" rows={incomes} tone="positive" total={proj.recurringIncome} />
          )}
          {expenses.length > 0 && (
            <DriverGroup title="Saídas fixas" rows={expenses} tone="negative" total={proj.recurringExpense} />
          )}
          <div className="pt-3 border-t border-line flex items-center justify-between">
            <span className="text-sm text-muted flex items-center gap-1.5">
              <CalendarClock size={14} /> Sobra recorrente / mês
            </span>
            <span className={`tnum font-semibold ${
              proj.recurringIncome - proj.recurringExpense >= 0 ? 'text-positive' : 'text-negative'
            }`}>
              {brl(proj.recurringIncome - proj.recurringExpense)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function DriverGroup({ title, rows, tone, total }) {
  const color = tone === 'positive' ? 'text-positive' : 'text-negative'
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-muted">{title}</span>
        <span className={`tnum text-xs font-semibold ${color}`}>{brl(total)}</span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center justify-between text-sm">
            <span className="truncate text-ink">{s.description}</span>
            <span className={`tnum ${color}`}>{brl(s.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ----------------------------- helpers ----------------------------- */
function SaldoDot({ cx, cy, payload, pos, neg }) {
  if (cx == null || cy == null) return null
  const color = payload.saldo < 0 ? neg : pos
  return <Dot cx={cx} cy={cy} r={payload.current ? 4 : 3} fill={color} stroke="none" />
}

const compact = (v) => {
  const a = Math.abs(v)
  if (a >= 1000) return (v < 0 ? '-' : '') + (a / 1000).toFixed(a >= 10000 ? 0 : 1) + 'k'
  return String(v)
}
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
