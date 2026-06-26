import { useState } from 'react'
import { useStore } from '../lib/store'
import { Plus, Trash2, RotateCcw, Database } from 'lucide-react'

const COLORS = ['#0E7C5A', '#C2410C', '#D97706', '#DB2777', '#0891B2', '#4F46E5', '#7C3AED']

export default function Settings() {
  const { categories, addCategory, removeCategory, resetData, clearAll } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [color, setColor] = useState(COLORS[0])

  const add = () => {
    if (!name.trim()) return
    addCategory({ name: name.trim(), type, color })
    setName('')
  }

  const income = categories.filter((c) => c.type === 'income')
  const expense = categories.filter((c) => c.type === 'expense')

  return (
    <div className="space-y-6 w-full">
      {/* Categorias */}
      <section className="card p-5">
        <h2 className="font-display font-semibold">Categorias</h2>
        <p className="text-sm text-muted">Usadas no formulário e nos gráficos.</p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="label">Nome</label>
            <input className="input" placeholder="Ex.: Educação" value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input w-32" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-1.5 h-[42px] items-center">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={add}><Plus size={16} /> Adicionar</button>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          <CategoryList title="Receitas" items={income} onRemove={removeCategory} />
          <CategoryList title="Despesas" items={expense} onRemove={removeCategory} />
        </div>
      </section>

      {/* Dados */}
      <section className="card p-5">
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Database size={16} /> Dados
        </h2>
        <p className="text-sm text-muted">
          Tudo é salvo localmente neste navegador. Para sincronizar entre
          dispositivos e ter login real, conecte o Supabase (veja o README).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-outline"
            onClick={() => confirm('Restaurar os dados de exemplo? Isso substitui o que existe hoje.') && resetData()}>
            <RotateCcw size={15} /> Restaurar exemplo
          </button>
          <button className="btn-ghost text-negative"
            onClick={() => confirm('Apagar TODOS os dados? Não dá para desfazer.') && clearAll()}>
            <Trash2 size={15} /> Apagar tudo
          </button>
        </div>
      </section>
    </div>
  )
}

function CategoryList({ title, items, onRemove }) {
  return (
    <div>
      <p className="label">{title}</p>
      <ul className="space-y-1.5">
        {items.length === 0 && <li className="text-sm text-muted">Nenhuma.</li>}
        {items.map((c) => (
          <li key={c.id} className="group flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
            <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
            <span className="flex-1 text-sm">{c.name}</span>
            <button onClick={() => onRemove(c.id)}
              className="text-muted hover:text-negative opacity-0 group-hover:opacity-100 transition">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
