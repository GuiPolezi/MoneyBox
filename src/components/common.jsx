import { brl, formatDate } from '../lib/format'
import { useStore } from '../lib/store'
import { useUI } from '../ui'
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, TrendingUp,
  Repeat, Clock, Inbox, Pencil, Trash2, CheckCircle2,
} from 'lucide-react'

export function BigNumber({ label, value, tone = 'neutral', hint, sub }) {
  const toneClass = {
    neutral: 'text-ink',
    positive: 'text-positive',
    negative: 'text-negative',
    invest: 'text-invest',
  }[tone]
  const bar = {
    neutral: 'bg-ink/20',
    positive: 'bg-positive',
    negative: 'bg-negative',
    invest: 'bg-invest',
  }[tone]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="label mb-0">{label}</p>
        {hint}
      </div>
      <p className={`mt-3 font-display text-3xl font-semibold tracking-tight tnum ${toneClass}`}>
        {brl(value)}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className={`h-1 w-10 rounded-full ${bar}`} />
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
    </div>
  )
}

export function Progress({ ratio, over }) {
  const pct = Math.min(100, Math.round(ratio * 100))
  return (
    <div className="h-2 w-full rounded-full bg-line overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${over ? 'bg-negative' : 'bg-positive'}`}
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  )
}

export function Empty({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-ink/[0.04] text-muted">
        <Icon size={22} />
      </div>
      <p className="mt-4 font-medium">{title}</p>
      {children && <p className="mt-1 text-sm text-muted max-w-xs">{children}</p>}
    </div>
  )
}

const typeMeta = {
  income: { icon: ArrowDownLeft, color: 'text-positive', bg: 'bg-positive/10', sign: '+' },
  expense: { icon: ArrowUpRight, color: 'text-negative', bg: 'bg-negative/10', sign: '−' },
  transfer: { icon: ArrowLeftRight, color: 'text-transfer', bg: 'bg-transfer/10', sign: '' },
  investment: { icon: TrendingUp, color: 'text-invest', bg: 'bg-invest/10', sign: '−' },
}

export function TxRow({ tx, showActions = true }) {
  const { categories, accounts, removeTransaction, togglePaid, removeInstallmentGroup } = useStore()
  const { openEdit } = useUI()
  const meta = typeMeta[tx.type]
  const cat = categories.find((c) => c.id === tx.categoryId)
  const acc = accounts.find((a) => a.id === tx.accountId)
  const toAcc = accounts.find((a) => a.id === tx.toAccountId)

  const handleDelete = () => {
    if (tx.installment?.groupId) {
      const all = confirm('Excluir TODAS as parcelas deste lançamento? Clique em Cancelar para excluir só esta.')
      if (all) return removeInstallmentGroup(tx.installment.groupId)
    }
    removeTransaction(tx.id)
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-ink/[0.015] transition">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.bg} ${meta.color}`}>
        <meta.icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{tx.description}</p>
          {tx.recurring && <Repeat size={13} className="text-muted shrink-0" title="Recorrente" />}
          {tx.installment && (
            <span className="chip bg-ink/[0.05] text-muted">
              {tx.installment.current}/{tx.installment.total}
            </span>
          )}
          {tx.status === 'pending' && (
            <span className="chip bg-amber-100 text-amber-700">
              <Clock size={11} /> Pendente
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted">
          {formatDate(tx.date)}
          {' · '}
          {tx.type === 'transfer' ? `${acc?.name} → ${toAcc?.name}` : acc?.name}
          {cat && ` · ${cat.name}`}
        </p>
      </div>

      <p className={`shrink-0 text-sm font-semibold tnum ${meta.color}`}>
        {meta.sign}{brl(tx.amount)}
      </p>

      {showActions && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          {tx.status === 'pending' && (
            <button
              onClick={() => togglePaid(tx.id)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-positive/10 hover:text-positive"
              title="Marcar como pago"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          <button
            onClick={() => openEdit(tx)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDelete}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-negative/10 hover:text-negative"
            title="Excluir"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
