import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { useUI } from '../ui'
import { monthKey, monthLabel } from '../lib/format'
import { TxRow, Empty } from '../components/common'
import { Search, Plus, Filter } from 'lucide-react'

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'income', label: 'Receitas' },
  { id: 'expense', label: 'Despesas' },
  { id: 'transfer', label: 'Transferências' },
  { id: 'investment', label: 'Investimentos' },
  { id: 'pending', label: 'Pendentes' },
]

export default function Transactions() {
  const { transactions } = useStore()
  const { month, openNew } = useUI()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [allMonths, setAllMonths] = useState(false)

  const list = useMemo(() => {
    return transactions
      .filter((t) => (allMonths ? true : monthKey(t.date) === month))
      .filter((t) => {
        if (filter === 'all') return true
        if (filter === 'pending') return t.status === 'pending'
        return t.type === filter
      })
      .filter((t) =>
        search ? t.description.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, month, filter, search, allMonths])

  return (
    <div className="space-y-5 w-full">
      {/* Controles */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9"
              placeholder="Buscar por descrição…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setAllMonths((v) => !v)}
            className={`btn-outline ${allMonths ? 'ring-2 ring-positive/30' : ''}`}
          >
            <Filter size={15} />
            {allMonths ? 'Todos os meses' : `Só ${monthLabel(month).split(' ')[0]}`}
          </button>
          <button className="btn-primary" onClick={() => openNew()}>
            <Plus size={16} /> Nova
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`chip border transition ${
                filter === f.id
                  ? 'border-brand bg-brand/[0.06] text-brand'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <Empty title="Nenhuma transação encontrada" icon={Search}>
          Ajuste os filtros ou adicione uma nova movimentação.
        </Empty>
      ) : (
        <div className="card overflow-hidden divide-y divide-line">
          {list.map((tx) => <TxRow key={tx.id} tx={tx} />)}
        </div>
      )}
    </div>
  )
}
