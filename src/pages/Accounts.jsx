import { useState } from 'react'
import { useStore } from '../lib/store'
import { brl } from '../lib/format'
import { accountBalance, totalBalance } from '../lib/finance'
import { Empty } from '../components/common'
import { Wallet, Plus, Trash2, X } from 'lucide-react'

const COLORS = ['#7C3AED', '#EA580C', '#0E7C5A', '#1D4ED8', '#DB2777', '#0891B2', '#16201A']

export default function Accounts() {
  const { accounts, transactions, addAccount, removeAccount } = useStore()
  const [open, setOpen] = useState(false)

  const total = totalBalance(accounts, transactions)

  return (
    <div className="space-y-5 w-full">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="label mb-1">Patrimônio em contas</p>
          <p className="font-display text-3xl font-semibold tnum">{brl(total)}</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova conta
        </button>
      </div>

      {accounts.length === 0 ? (
        <Empty title="Nenhuma conta cadastrada" icon={Wallet}>
          Crie contas e carteiras para saber onde seu dinheiro está guardado.
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {accounts.map((a) => {
            const bal = accountBalance(a, transactions)
            return (
              <div key={a.id} className="card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl text-white"
                      style={{ background: a.color }}>
                      <Wallet size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted">{a.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAccount(a.id)}
                    className="text-muted hover:text-negative opacity-0 group-hover:opacity-100 transition"
                    title="Remover conta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className={`mt-4 font-display text-2xl font-semibold tnum ${bal < 0 ? 'text-negative' : 'text-ink'}`}>
                  {brl(bal)}
                </p>
                <p className="text-xs text-muted">saldo atual</p>
              </div>
            )
          })}
        </div>
      )}

      {open && <AccountModal onClose={() => setOpen(false)} onSave={addAccount} />}
    </div>
  )
}

function AccountModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', type: 'Conta', color: COLORS[0], initialBalance: '' })
  const save = () => {
    if (!form.name.trim()) return
    onSave({ ...form, initialBalance: Number(form.initialBalance) || 0 })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold">Nova conta</h2>
          <button className="text-muted hover:text-ink" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" placeholder="Ex.: Nubank" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Conta</option>
                <option>Carteira</option>
                <option>Poupança</option>
                <option>Cartão</option>
              </select>
            </div>
            <div>
              <label className="label">Saldo inicial</label>
              <input className="input tnum" type="number" step="0.01" placeholder="0,00"
                value={form.initialBalance}
                onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} />
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
          <button className="btn-primary flex-1" onClick={save}>Criar conta</button>
        </div>
      </div>
    </div>
  )
}
