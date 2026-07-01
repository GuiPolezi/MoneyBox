import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  AreaChart, Area, LineChart, Line, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { Card, Money, Pill } from '../components/ui/primitives'
import { Guilloche } from '../components/Ornament'
import {
  BRL, monthLabel, firstOfThisMonth, projectNextBalance, projectionSeries,
} from '../lib/finance'

const axis = { fontFamily: 'IBM Plex Mono', fontSize: 11, fill: '#1C262099' }
const compact = (n) => 'R$' + Math.round(n / 1).toLocaleString('pt-BR')

export default function Dashboard() {
  const {
    profile, openInvoiceBalance, obligations, snapshots, invoice,
  } = useFinance()

  const balance = Number(profile?.balance ?? 0)
  const salary = Number(profile?.salary ?? 0)

  // saldo entre os meses (+ / −)
  const balanceSeries = useMemo(
    () => snapshots.map((s) => ({
      label: monthLabel(s.reference_month),
      saldo: Number(s.balance_end),
    })),
    [snapshots]
  )

  // salário acumulado entre os meses
  const salarySeries = useMemo(() => {
    let acc = 0
    return snapshots.map((s) => {
      acc += Number(s.salary)
      return { label: monthLabel(s.reference_month), acumulado: acc, mes: Number(s.salary) }
    })
  }, [snapshots])

  // projeção
  const nextBalance = projectNextBalance({
    balance, salary, openInvoiceBalance, obligations: obligations.total,
  })
  const projSeries = useMemo(
    () => projectionSeries({
      startMonth: firstOfThisMonth(),
      balance, salary, openInvoiceBalance,
      interestRate: invoice?.interest_rate ?? 0.12,
      obligations: obligations.total,
    }),
    [balance, salary, openInvoiceBalance, obligations.total, invoice]
  )

  return (
    <div className="space-y-8">
      <header className="relative">
        <Guilloche className="absolute -top-6 right-0 w-72 hidden sm:block" opacity={0.12} />
        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Painel</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Olá, {profile?.display_name || 'por aqui'}.
        </h1>
        <p className="text-sm text-ink/60 mt-1">{monthLabel(firstOfThisMonth())} · resumo do mês</p>
      </header>

      {/* info cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Saldo atual" value={balance} tone={balance < 0 ? 'oxblood' : 'currency'} />
        <Stat label="Salário (fixo)" value={salary} tone="brass" />
        <Stat label="Fatura atual" value={openInvoiceBalance} tone="oxblood" hint="cartão · em aberto" />
        <Stat
          label="Projeção próx. mês"
          value={nextBalance}
          tone={nextBalance < 0 ? 'oxblood' : 'currency'}
          hint="saldo − fatura − contas"
        />
      </section>

      {/* obligations strip */}
      <Card className="p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-xs uppercase tracking-wider text-ink/50">Compromissos do mês</span>
        <span className="text-sm">Contas fixas <Money value={obligations.fixed} className="ml-1" /></span>
        <span className="text-sm">Parcelas <Money value={obligations.inst} className="ml-1" /></span>
        <span className="text-sm font-medium">Total <Money value={obligations.total} className="ml-1" /></span>
      </Card>

      {/* charts */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <ChartHead title="Saldo entre os meses" note="positivo ou negativo a cada mês" />
          {balanceSeries.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={balanceSeries} margin={{ left: -8 }}>
                <CartesianGrid stroke="#C8C0A8" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={64} />
                <Tooltip formatter={(v) => BRL(v)} />
                <ReferenceLine y={0} stroke="#1C2620" strokeWidth={1} />
                <Bar dataKey="saldo" radius={[2, 2, 0, 0]}>
                  {balanceSeries.map((d, i) => (
                    <Cell key={i} fill={d.saldo < 0 ? '#7E3030' : '#234A3C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </Card>

        <Card className="p-5">
          <ChartHead title="Salário acumulado" note="somado mês a mês ao longo do ano" />
          {salarySeries.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salarySeries} margin={{ left: -8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B0894A" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#B0894A" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#C8C0A8" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={64} />
                <Tooltip formatter={(v) => BRL(v)} />
                <Area type="monotone" dataKey="acumulado" stroke="#B0894A" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <ChartHead title="Projeção de saldo" note="6 meses à frente · fatura e contas descontadas no recebimento" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={projSeries} margin={{ left: -8 }}>
              <CartesianGrid stroke="#C8C0A8" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
              <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={64} />
              <Tooltip formatter={(v) => BRL(v)} />
              <ReferenceLine y={0} stroke="#7E3030" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="projected" name="saldo projetado"
                stroke="#234A3C" strokeWidth={2.5} dot={{ r: 3, fill: '#234A3C' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </section>
    </div>
  )
}

function Stat({ label, value, tone = 'currency', hint }) {
  const ring = {
    currency: 'before:bg-currency', brass: 'before:bg-brass', oxblood: 'before:bg-oxblood',
  }[tone]
  return (
    <Card className={`p-4 relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${ring}`}>
      <p className="text-[11px] uppercase tracking-wider text-ink/55">{label}</p>
      <Money value={value} className="text-xl sm:text-2xl block mt-1" />
      {hint && <p className="text-[11px] text-ink/45 mt-1">{hint}</p>}
    </Card>
  )
}

function ChartHead({ title, note }) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="text-xs text-ink/50">{note}</p>
    </div>
  )
}

function Empty() {
  return (
    <div className="h-[220px] flex items-center justify-center text-center">
      <p className="text-sm text-ink/45 max-w-[15rem]">
        Sem registros ainda. Faça uma movimentação ou ajuste seu saldo para começar a desenhar o gráfico.
      </p>
    </div>
  )
}
