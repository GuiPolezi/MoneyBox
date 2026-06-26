import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { useUI } from '../ui'
import { brl, formatDateLong } from '../lib/format'
import { investmentProjection, totalInvested } from '../lib/finance'
import { Empty } from '../components/common'
import { TrendingUp, Plus, Pencil, Trash2, CalendarClock } from 'lucide-react'

export default function Investments() {
  const { transactions, accounts, removeTransaction } = useStore()
  const { openNew, openEdit } = useUI()

  const invs = useMemo(
    () => transactions.filter((t) => t.type === 'investment')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions]
  )
  const invested = totalInvested(transactions)
  const projectedYield = invs.reduce((s, t) => {
    const p = investmentProjection(t)
    return s + (p?.yield || 0)
  }, 0)

  return (
    <div className="space-y-5 w-full">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="label mb-0">Total alocado</p>
            <TrendingUp size={16} className="text-invest" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold tnum text-invest">{brl(invested)}</p>
        </div>
        <div className="card p-5">
          <p className="label">Rendimento projetado (estimado)</p>
          <p className="mt-3 font-display text-3xl font-semibold tnum text-positive">+{brl(projectedYield)}</p>
          <p className="text-xs text-muted mt-1">até os respectivos vencimentos</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => openNew({ type: 'investment' })}>
          <Plus size={16} /> Novo investimento
        </button>
      </div>

      {invs.length === 0 ? (
        <Empty title="Nenhum investimento registrado" icon={TrendingUp}>
          Lance uma movimentação do tipo Investimento com taxa e vencimento.
        </Empty>
      ) : (
        <div className="space-y-3">
          {invs.map((t) => {
            const p = investmentProjection(t)
            const acc = accounts.find((a) => a.id === t.accountId)
            return (
              <div key={t.id} className="card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-invest/10 text-invest">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-xs text-muted">
                        {acc?.name}
                        {t.investment?.rate ? ` · ${t.investment.rate}% a.a.` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(t)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => removeTransaction(t.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-negative/10 hover:text-negative">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <Stat label="Aplicado" value={brl(t.amount)} />
                  {t.investment?.maturity && (
                    <Stat label="Vencimento"
                      value={<span className="flex items-center gap-1"><CalendarClock size={13} />{formatDateLong(t.investment.maturity)}</span>} />
                  )}
                  {p && <Stat label="Rendimento estimado" value={`+${brl(p.yield)}`} tone="positive" />}
                  {p && <Stat label="Valor no vencimento" value={brl(p.future)} tone="invest" />}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-muted">
        * Projeção por juros compostos sobre a taxa anual informada. Estimativa
        simplificada — não considera impostos, IOF ou taxas variáveis.
      </p>
    </div>
  )
}

function Stat({ label, value, tone = 'neutral' }) {
  const cls = { neutral: 'text-ink', positive: 'text-positive', invest: 'text-invest' }[tone]
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-medium tnum ${cls}`}>{value}</p>
    </div>
  )
}
