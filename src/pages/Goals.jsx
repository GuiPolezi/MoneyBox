import { useState } from 'react'
import { useStore } from '../lib/store'
import { brl } from '../lib/format'
import { Progress, Empty } from '../components/common'
import { PiggyBank, Plus, Trash2, X, Minus } from 'lucide-react'

const COLORS = ['#0E7C5A', '#1D4ED8', '#DB2777', '#EA580C', '#7C3AED']

export default function Goals() {
  const { goals, addGoal, removeGoal, depositGoal } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Suas caixinhas e objetivos</p>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <Empty title="Nenhuma meta criada" icon={PiggyBank}>
          Crie objetivos com valor-alvo e vá guardando aos poucos.
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((g) => {
            const ratio = g.target > 0 ? g.saved / g.target : 0
            const done = g.saved >= g.target
            return (
              <div key={g.id} className="card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl text-white"
                      style={{ background: g.color }}>
                      <PiggyBank size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted">
                        {done ? 'Meta alcançada 🎉' : `Faltam ${brl(g.target - g.saved)}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeGoal(g.id)}
                    className="text-muted hover:text-negative opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="font-display text-xl font-semibold tnum">{brl(g.saved)}</span>
                    <span className="text-sm text-muted tnum">de {brl(g.target)}</span>
                  </div>
                  <Progress ratio={ratio} />
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => depositGoal(g.id, prompt2('Quanto guardar?'))}
                    className="btn-outline flex-1 py-2">
                    <Plus size={14} /> Guardar
                  </button>
                  <button onClick={() => depositGoal(g.id, -prompt2('Quanto retirar?'))}
                    className="btn-ghost flex-1 py-2">
                    <Minus size={14} /> Retirar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {open && <GoalModal onClose={() => setOpen(false)} onSave={addGoal} />}
    </div>
  )
}

const prompt2 = (msg) => {
  const v = window.prompt(msg)
  const n = Number((v || '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function GoalModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', target: '', saved: '', color: COLORS[0] })
  const save = () => {
    if (!form.name.trim() || !Number(form.target)) return
    onSave({ name: form.name, target: Number(form.target), saved: Number(form.saved) || 0, color: form.color })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center scrim backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold">Nova meta</h2>
          <button className="text-muted hover:text-ink" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Objetivo</label>
            <input className="input" placeholder="Ex.: Trocar de carro" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor-alvo</label>
              <input className="input tnum" type="number" step="0.01" placeholder="20000"
                value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </div>
            <div>
              <label className="label">Já guardado</label>
              <input className="input tnum" type="number" step="0.01" placeholder="0"
                value={form.saved} onChange={(e) => setForm({ ...form, saved: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1" onClick={save}>Criar meta</button>
        </div>
      </div>
    </div>
  )
}
