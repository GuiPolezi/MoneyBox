import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, addMonths, monthKey } from './format'
import { buildSeed } from './seed'

// =====================================================================
//  CAMADA ÚNICA DE DADOS
//  Toda leitura/escrita passa por aqui. Para migrar para Supabase no
//  futuro, basta reimplementar estas ações chamando a API — as telas
//  não precisam mudar. Hoje persistimos em localStorage.
// =====================================================================

const seed = buildSeed()

export const useStore = create(
  persist(
    (set, get) => ({
      // ---- sessão (mock local; trocar por Supabase Auth depois) ----
      profile: null,
      login: (name) => set({ profile: { name: name || 'Você' } }),
      logout: () => set({ profile: null }),

      // ---- dados ----
      accounts: seed.accounts,
      categories: seed.categories,
      transactions: seed.transactions,
      budgets: seed.budgets,
      goals: seed.goals,

      // ---------------- TRANSAÇÕES ----------------
      addTransaction: (data) => {
        const txs = buildTransactions(data)
        set((s) => ({ transactions: [...txs, ...s.transactions] }))
      },

      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t
          ),
        })),

      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      // remove todas as parcelas de um grupo
      removeInstallmentGroup: (groupId) =>
        set((s) => ({
          transactions: s.transactions.filter(
            (t) => t.installment?.groupId !== groupId
          ),
        })),

      // alterna pago <-> pendente (estorno simples)
      togglePaid: (id) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'paid' ? 'pending' : 'paid' }
              : t
          ),
        })),

      // ---------------- CONTAS ----------------
      addAccount: (data) =>
        set((s) => ({ accounts: [...s.accounts, { id: uid(), ...data }] })),
      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      // ---------------- CATEGORIAS ----------------
      addCategory: (data) =>
        set((s) => ({ categories: [...s.categories, { id: uid(), ...data }] })),
      removeCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      // ---------------- ORÇAMENTOS ----------------
      addBudget: (data) =>
        set((s) => ({ budgets: [...s.budgets, { id: uid(), ...data }] })),
      updateBudget: (id, patch) =>
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBudget: (id) =>
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      // ---------------- METAS ----------------
      addGoal: (data) =>
        set((s) => ({ goals: [...s.goals, { id: uid(), saved: 0, ...data }] })),
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      depositGoal: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g
          ),
        })),
      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      // ---------------- UTIL ----------------
      resetData: () => {
        const fresh = buildSeed()
        set({ ...fresh })
      },
      clearAll: () =>
        set({
          accounts: [],
          categories: [],
          transactions: [],
          budgets: [],
          goals: [],
        }),
    }),
    {
      name: 'caixa-financas-v1',
      partialize: (s) => ({
        profile: s.profile,
        accounts: s.accounts,
        categories: s.categories,
        transactions: s.transactions,
        budgets: s.budgets,
        goals: s.goals,
      }),
    }
  )
)

// ---------------------------------------------------------------------
// Constrói a(s) transação(ões) a partir do formulário.
// Se "Parcelado", gera N lançamentos futuros automaticamente.
// ---------------------------------------------------------------------
function buildTransactions(form) {
  const base = {
    type: form.type,
    accountId: form.accountId,
    toAccountId: form.toAccountId || null,
    categoryId: form.categoryId || null,
    description: form.description?.trim() || 'Sem descrição',
    recurring: !!form.recurring,
    investment: form.type === 'investment'
      ? { rate: Number(form.rate) || 0, maturity: form.maturity || null }
      : null,
    createdAt: new Date().toISOString(),
  }

  // Parcelado: divide o total e cria uma transação por mês
  if (form.installmentTotal && Number(form.installmentTotal) > 1) {
    const total = Number(form.installmentTotal)
    const per = Number(form.amount) / total
    const groupId = uid()
    const startKey = monthKey(form.date)
    const day = new Date(form.date).getDate()

    return Array.from({ length: total }, (_, i) => {
      const key = addMonths(startKey, i)
      const [y, m] = key.split('-').map(Number)
      const date = new Date(y, m - 1, day).toISOString()
      return {
        id: uid(),
        ...base,
        amount: round2(per),
        date,
        // primeira parcela usa o status escolhido; as demais ficam pendentes
        status: i === 0 ? form.status || 'paid' : 'pending',
        installment: { current: i + 1, total, groupId },
      }
    })
  }

  // Transação única
  return [
    {
      id: uid(),
      ...base,
      amount: Number(form.amount),
      date: new Date(form.date).toISOString(),
      status: form.status || 'paid',
      installment: null,
    },
  ]
}

const round2 = (n) => Math.round(n * 100) / 100
