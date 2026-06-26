import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from './supabase'
import { uid, addMonths, monthKey } from './format'
import { buildSeed } from './seed'

// =====================================================================
//  CAMADA ÚNICA DE DADOS  (agora ligada ao Supabase)
//
//  - Auth real: registro, login e logout via Supabase Auth.
//  - Cada registro vira um documento { id, user_id, data } numa tabela.
//    O RLS no banco garante o isolamento por usuário.
//  - As AÇÕES mantêm os mesmos nomes/assinaturas de antes, então as
//    telas continuam iguais. Internamente elas fazem update otimista no
//    estado local e persistem no banco em segundo plano.
// =====================================================================

const TABLES = ['accounts', 'categories', 'transactions', 'budgets', 'goals']

const profileFrom = (user) => ({
  id: user.id,
  email: user.email,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'Você',
})

let listenerBound = false

export const useStore = create((set, get) => {
  // ---- helpers de persistência (documento JSON por linha) ----
  const userId = () => get().session?.user?.id

  const insertRows = (table, objs) => {
    const uidv = userId()
    if (!uidv || !objs.length) return
    supabase
      .from(table)
      .insert(objs.map((o) => ({ id: o.id, user_id: uidv, data: o })))
      .then(({ error }) => error && console.error(`insert ${table}`, error.message))
  }
  const updateRow = (table, id, obj) => {
    supabase
      .from(table)
      .update({ data: obj })
      .eq('id', id)
      .then(({ error }) => error && console.error(`update ${table}`, error.message))
  }
  const deleteRows = (table, ids) => {
    if (!ids.length) return
    supabase
      .from(table)
      .delete()
      .in('id', ids)
      .then(({ error }) => error && console.error(`delete ${table}`, error.message))
  }

  // patch local + persiste o objeto resultante
  const patchOne = (key, id, patch, table) => {
    let merged = null
    set((s) => ({
      [key]: s[key].map((it) => {
        if (it.id === id) {
          merged = { ...it, ...patch }
          return merged
        }
        return it
      }),
    }))
    if (merged) updateRow(table, id, merged)
    return merged
  }

  return {
    // ----------------------- sessão -----------------------
    session: null,
    profile: null,
    booting: true, // verificando sessão ao abrir o app
    ready: false, // dados do usuário já carregados
    loading: false,

    // chamado uma vez no App: assina mudanças de auth
    init: () => {
      if (!isSupabaseConfigured) {
        set({ booting: false })
        return
      }
      if (listenerBound) return
      listenerBound = true
      supabase.auth.onAuthStateChange((event, session) => {
        get().handleAuth(event, session)
      })
    },

    handleAuth: (_event, session) => {
      if (!session?.user) {
        set({
          session: null,
          profile: null,
          booting: false,
          ready: false,
          accounts: [],
          categories: [],
          transactions: [],
          budgets: [],
          goals: [],
        })
        return
      }
      const sameUser = get().session?.user?.id === session.user.id
      set({ session, profile: profileFrom(session.user), booting: false })
      if (!sameUser || !get().ready) {
        set({ ready: false })
        // adiar evita reentrância dentro do callback de auth
        setTimeout(() => get().bootstrap(), 0)
      }
    },

    signUp: async ({ name, email, password }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) return { error: error.message }
      if (!data.session) return { needsConfirmation: true }
      return { ok: true }
    },

    signIn: async ({ email, password }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { ok: true }
    },

    // mantém o nome usado pelo Layout (botão Sair)
    logout: async () => {
      await supabase.auth.signOut()
    },

    // ----------------------- carga inicial -----------------------
    bootstrap: async () => {
      set({ loading: true })
      try {
        const results = await Promise.all(
          TABLES.map((t) => supabase.from(t).select('id,data'))
        )
        const [accounts, categories, transactions, budgets, goals] = results.map(
          (r) => (r.data || []).map((row) => ({ ...row.data, id: row.id }))
        )
        const err = results.find((r) => r.error)
        if (err?.error) console.error('bootstrap', err.error.message)
        set({ accounts, categories, transactions, budgets, goals, ready: true, loading: false })
      } catch (e) {
        console.error(e)
        set({ ready: true, loading: false })
      }
    },

    // estado de dados (vazio até o bootstrap)
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    goals: [],

    // ---------------- TRANSAÇÕES ----------------
    addTransaction: (data) => {
      const rows = buildTransactions(data)
      set((s) => ({ transactions: [...rows, ...s.transactions] }))
      insertRows('transactions', rows)
    },

    updateTransaction: (id, patch) => patchOne('transactions', id, patch, 'transactions'),

    removeTransaction: (id) => {
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
      deleteRows('transactions', [id])
    },

    removeInstallmentGroup: (groupId) => {
      const ids = get()
        .transactions.filter((t) => t.installment?.groupId === groupId)
        .map((t) => t.id)
      set((s) => ({
        transactions: s.transactions.filter((t) => t.installment?.groupId !== groupId),
      }))
      deleteRows('transactions', ids)
    },

    togglePaid: (id) => {
      const current = get().transactions.find((t) => t.id === id)
      if (!current) return
      patchOne('transactions', id, { status: current.status === 'paid' ? 'pending' : 'paid' }, 'transactions')
    },

    // ---------------- CONTAS ----------------
    addAccount: (data) => {
      const obj = { id: uid(), ...data }
      set((s) => ({ accounts: [...s.accounts, obj] }))
      insertRows('accounts', [obj])
    },
    updateAccount: (id, patch) => patchOne('accounts', id, patch, 'accounts'),
    removeAccount: (id) => {
      set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }))
      deleteRows('accounts', [id])
    },

    // ---------------- CATEGORIAS ----------------
    addCategory: (data) => {
      const obj = { id: uid(), ...data }
      set((s) => ({ categories: [...s.categories, obj] }))
      insertRows('categories', [obj])
    },
    removeCategory: (id) => {
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
      deleteRows('categories', [id])
    },

    // ---------------- ORÇAMENTOS ----------------
    addBudget: (data) => {
      const obj = { id: uid(), ...data }
      set((s) => ({ budgets: [...s.budgets, obj] }))
      insertRows('budgets', [obj])
    },
    updateBudget: (id, patch) => patchOne('budgets', id, patch, 'budgets'),
    removeBudget: (id) => {
      set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }))
      deleteRows('budgets', [id])
    },

    // ---------------- METAS ----------------
    addGoal: (data) => {
      const obj = { id: uid(), saved: 0, ...data }
      set((s) => ({ goals: [...s.goals, obj] }))
      insertRows('goals', [obj])
    },
    updateGoal: (id, patch) => patchOne('goals', id, patch, 'goals'),
    depositGoal: (id, amount) => {
      const current = get().goals.find((g) => g.id === id)
      if (!current) return
      patchOne('goals', id, { saved: Math.max(0, current.saved + amount) }, 'goals')
    },
    removeGoal: (id) => {
      set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
      deleteRows('goals', [id])
    },

    // ---------------- UTIL ----------------
    // "Restaurar exemplo": limpa tudo do usuário e insere os dados de demo
    resetData: async () => {
      await get().clearAll()
      const seed = buildSeed()
      set({ ...seed })
      insertRows('accounts', seed.accounts)
      insertRows('categories', seed.categories)
      insertRows('transactions', seed.transactions)
      insertRows('budgets', seed.budgets)
      insertRows('goals', seed.goals)
    },

    // "Apagar tudo": remove todas as linhas do usuário no banco
    clearAll: async () => {
      set({ accounts: [], categories: [], transactions: [], budgets: [], goals: [] })
      const uidv = userId()
      if (!uidv) return
      await Promise.all(
        TABLES.map((t) => supabase.from(t).delete().eq('user_id', uidv))
      )
    },
  }
})

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
    investment:
      form.type === 'investment'
        ? { rate: Number(form.rate) || 0, maturity: form.maturity || null }
        : null,
    createdAt: new Date().toISOString(),
  }

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
        status: i === 0 ? form.status || 'paid' : 'pending',
        installment: { current: i + 1, total, groupId },
      }
    })
  }

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
