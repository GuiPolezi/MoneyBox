import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { useUI } from '../ui'
import { brl, monthLabel } from '../lib/format'
import { budgetProgress } from '../lib/finance'
import { Progress, Empty } from '../components/common'
import { Target, Plus, Trash2, X } from 'lucide-react'

export default function Budgets() {
  const { budgets, transactions, categories, addBudget, removeBudget } = useStore()
  const { month } = useUI()
  const [open, setOpen] = useState(false)

  const rows = useMemo(
    () => budgetProgress(budgets, transactions, categories, month),
    [budgets, transactions, categories, month]
  )
  const expenseCats = categories.filter((c) => c.type === 'expense')

  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted capitalize">{monthLabel(month)}</p>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Novo orçamento
        </button>
      </div>

      {rows.length === 0 ? (
        <Empty title="Nenhum teto de gasto definido" icon={Target}>
          Defina limites mensais por categoria e acompanhe a barra de progresso.
        </Empty>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="card p-5 group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full" style={{ background: b.category?.color }} />
                  <span className="font-medium">{b.category?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tnum text-muted">
                    {Math.round(b.ratio * 100)}%
                  </span>
                  <button onClick={() => removeBudget(b.id)}
                    className="text-muted hover:text-negative opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <Progress ratio={b.ratio} over={b.over} />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="tnum text-muted">{brl(b.spent)} gastos</span>
                <span className={`tnum ${b.over ? 'text-negative' : 'text-positive'}`}>
                  {b.over ? `${brl(Math.abs(b.remaining))} acima` : `${brl(b.remaining)} restante`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <BudgetModal
          cats={expenseCats}
          used={budgets.map((b) => b.categoryId)}
          onClose={() => setOpen(false)}
          onSave={addBudget}
        />
      )}
    </div>
  )
}

function BudgetModal({ cats, used, onClose, onSave }) {
  const available = cats.filter((c) => !used.includes(c.id))
  const [categoryId, setCategoryId] = useState(available[0]?.id || '')
  const [limit, setLimit] = useState('')

  const save = () => {
    if (!categoryId || !Number(limit)) return
    onSave({ categoryId, limit: Number(limit) })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold">Novo orçamento</h2>
          <button className="text-muted hover:text-ink" onClick={onClose}><X size={20} /></button>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">
            Todas as categorias de despesa já têm orçamento.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Teto mensal (R$)</label>
              <input className="input tnum" type="number" step="0.01" placeholder="500,00"
                value={limit} onChange={(e) => setLimit(e.target.value)} autoFocus />
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1" onClick={save} disabled={!available.length}>Criar</button>
        </div>
      </div>
    </div>
  )
}
