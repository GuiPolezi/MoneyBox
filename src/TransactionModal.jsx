import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from './lib/store'
import { useUI } from './ui'
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, TrendingUp } from 'lucide-react'

const TYPES = [
  { id: 'income', label: 'Receita', icon: ArrowDownLeft, color: 'text-positive', ring: 'ring-positive/40 bg-positive/[0.06]' },
  { id: 'expense', label: 'Despesa', icon: ArrowUpRight, color: 'text-negative', ring: 'ring-negative/40 bg-negative/[0.06]' },
  { id: 'transfer', label: 'Transferência', icon: ArrowLeftRight, color: 'text-transfer', ring: 'ring-transfer/40 bg-transfer/[0.06]' },
  { id: 'investment', label: 'Investimento', icon: TrendingUp, color: 'text-invest', ring: 'ring-invest/40 bg-invest/[0.06]' },
]

const today = () => new Date().toISOString().slice(0, 10)

export default function TransactionModal() {
  const { txModal, closeModal } = useUI()
  const { accounts, categories, addTransaction, updateTransaction } = useStore()

  const editing = txModal?.mode === 'edit'
  const tx = txModal?.tx

  const [form, setForm] = useState(() => initial(txModal, accounts))

  useEffect(() => {
    setForm(initial(txModal, accounts))
  }, [txModal]) // eslint-disable-line

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const filteredCats = useMemo(
    () => categories.filter((c) => c.type === (form.type === 'income' ? 'income' : 'expense')),
    [categories, form.type]
  )

  if (!txModal) return null

  const isParcelado = form.type === 'expense' && Number(form.installmentTotal) > 1
  const canSave = Number(form.amount) > 0 && form.accountId &&
    (form.type !== 'transfer' || (form.toAccountId && form.toAccountId !== form.accountId))

  const submit = () => {
    if (!canSave) return
    const payload = {
      ...form,
      amount: Number(form.amount),
      date: form.date,
    }
    if (editing) {
      // edição afeta apenas o lançamento selecionado
      updateTransaction(tx.id, {
        type: form.type,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
        accountId: form.accountId,
        toAccountId: form.type === 'transfer' ? form.toAccountId : null,
        categoryId: ['income', 'expense'].includes(form.type) ? form.categoryId : null,
        description: form.description?.trim() || 'Sem descrição',
        status: form.status,
        recurring: form.type === 'transfer' ? false : !!form.recurring,
        investment: form.type === 'investment'
          ? { rate: Number(form.rate) || 0, maturity: form.maturity || null }
          : null,
      })
    } else {
      addTransaction(payload)
    }
    closeModal()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={closeModal}
    >
      <div
        className="card w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-card">
          <h2 className="font-display text-lg font-semibold">
            {editing ? 'Editar movimentação' : 'Nova movimentação'}
          </h2>
          <button className="text-muted hover:text-ink transition" onClick={closeModal}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map((tp) => {
              const active = form.type === tp.id
              return (
                <button
                  key={tp.id}
                  onClick={() => set({ type: tp.id, categoryId: null })}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border border-line py-3 text-xs font-medium transition ring-1 ring-transparent ${
                    active ? tp.ring : 'hover:bg-ink/[0.02]'
                  }`}
                >
                  <tp.icon size={18} className={active ? tp.color : 'text-muted'} />
                  <span className={active ? 'text-ink' : 'text-muted'}>{tp.label}</span>
                </button>
              )
            })}
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$)</label>
              <input
                className="input tnum text-lg"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => set({ amount: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Data</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder={form.type === 'investment' ? 'Ex.: CDB Banco X' : 'Ex.: Mercado do mês'}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>

          {/* Conta(s) */}
          <div className="grid grid-cols-2 gap-4">
            <div className={form.type === 'transfer' ? '' : 'col-span-2'}>
              <label className="label">{form.type === 'transfer' ? 'De' : 'Conta'}</label>
              <select
                className="input"
                value={form.accountId}
                onChange={(e) => set({ accountId: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {form.type === 'transfer' && (
              <div>
                <label className="label">Para</label>
                <select
                  className="input"
                  value={form.toAccountId}
                  onChange={(e) => set({ toAccountId: e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {accounts.filter((a) => a.id !== form.accountId).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Categoria (receita/despesa) */}
          {['income', 'expense'].includes(form.type) && (
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={form.categoryId || ''}
                onChange={(e) => set({ categoryId: e.target.value })}
              >
                <option value="">Sem categoria</option>
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Campos de investimento */}
          {form.type === 'investment' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Rendimento esperado (% a.a.)</label>
                <input
                  className="input tnum"
                  type="number"
                  step="0.1"
                  placeholder="11,5"
                  value={form.rate}
                  onChange={(e) => set({ rate: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Vencimento</label>
                <input
                  className="input"
                  type="date"
                  value={form.maturity}
                  onChange={(e) => set({ maturity: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Parcelamento (somente despesa, somente na criação) */}
          {form.type === 'expense' && !editing && (
            <div>
              <label className="label">Parcelas</label>
              <div className="flex items-center gap-3">
                <input
                  className="input tnum w-24"
                  type="number"
                  min="1"
                  value={form.installmentTotal}
                  onChange={(e) => set({ installmentTotal: e.target.value })}
                />
                <p className="text-sm text-muted">
                  {isParcelado
                    ? `${form.installmentTotal}× de ${(Number(form.amount || 0) / Number(form.installmentTotal)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — as futuras entram como pendentes`
                    : 'À vista (1 = sem parcelamento)'}
                </p>
              </div>
            </div>
          )}

          {/* Flags */}
          {form.type !== 'transfer' && (
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
              <Toggle
                label="Pendente (não desconta do saldo ainda)"
                checked={form.status === 'pending'}
                onChange={(v) => set({ status: v ? 'pending' : 'paid' })}
              />
              {!isParcelado && (
                <Toggle
                  label="Recorrente (repete todo mês)"
                  checked={form.recurring}
                  onChange={(v) => set({ recurring: v })}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-line sticky bottom-0 bg-card">
          <button className="btn-outline flex-1" onClick={closeModal}>Cancelar</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={!canSave}>
            {editing ? 'Salvar alterações' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm text-ink"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-brand' : 'bg-line'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span className="text-muted">{label}</span>
    </button>
  )
}

function initial(modal, accounts) {
  if (modal?.mode === 'edit' && modal.tx) {
    const t = modal.tx
    return {
      type: t.type,
      amount: String(t.amount),
      date: new Date(t.date).toISOString().slice(0, 10),
      description: t.description,
      accountId: t.accountId,
      toAccountId: t.toAccountId || '',
      categoryId: t.categoryId || '',
      status: t.status,
      recurring: !!t.recurring,
      rate: t.investment?.rate ? String(t.investment.rate) : '',
      maturity: t.investment?.maturity ? t.investment.maturity.slice(0, 10) : '',
      installmentTotal: '1',
    }
  }
  const preset = modal?.preset || {}
  return {
    type: 'expense',
    amount: '',
    date: today(),
    description: '',
    accountId: accounts[0]?.id || '',
    toAccountId: '',
    categoryId: '',
    status: 'paid',
    recurring: false,
    rate: '',
    maturity: '',
    installmentTotal: '1',
    ...preset,
  }
}
