import { uid, monthKey, addMonths, todayKey } from './format'

// Gera dados de exemplo para o usuário ver o sistema vivo no primeiro acesso.
// Tudo isso pode ser apagado em Configurações > Resetar dados.

const iso = (key, day) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, day).toISOString()
}

export function buildSeed() {
  const now = todayKey()
  const prev = addMonths(now, -1)
  const prev2 = addMonths(now, -2)
  const next = addMonths(now, 1)

  const accounts = [
    { id: 'acc-nubank', name: 'Nubank', type: 'Conta', color: '#7C3AED', initialBalance: 1200 },
    { id: 'acc-itau', name: 'Itaú', type: 'Conta', color: '#EA580C', initialBalance: 3400 },
    { id: 'acc-cash', name: 'Dinheiro físico', type: 'Carteira', color: '#0E7C5A', initialBalance: 250 },
  ]

  const categories = [
    { id: 'cat-salary', name: 'Salário', type: 'income', color: '#0E7C5A' },
    { id: 'cat-freela', name: 'Freelance', type: 'income', color: '#15803D' },
    { id: 'cat-home', name: 'Moradia', type: 'expense', color: '#C2410C' },
    { id: 'cat-food', name: 'Alimentação', type: 'expense', color: '#D97706' },
    { id: 'cat-fun', name: 'Lazer', type: 'expense', color: '#DB2777' },
    { id: 'cat-transport', name: 'Transporte', type: 'expense', color: '#0891B2' },
    { id: 'cat-health', name: 'Saúde', type: 'expense', color: '#4F46E5' },
  ]

  const groupParcela = uid()
  const transactions = [
    // Receitas recorrentes
    t({ type: 'income', amount: 6500, accountId: 'acc-itau', categoryId: 'cat-salary', description: 'Salário', date: iso(now, 5), recurring: true }),
    t({ type: 'income', amount: 1200, accountId: 'acc-nubank', categoryId: 'cat-freela', description: 'Projeto freelance', date: iso(now, 12) }),

    // Despesas recorrentes (fixas)
    t({ type: 'expense', amount: 1800, accountId: 'acc-itau', categoryId: 'cat-home', description: 'Aluguel', date: iso(now, 8), recurring: true }),
    t({ type: 'expense', amount: 320, accountId: 'acc-nubank', categoryId: 'cat-transport', description: 'Combustível', date: iso(now, 10) }),
    t({ type: 'expense', amount: 540, accountId: 'acc-nubank', categoryId: 'cat-food', description: 'Mercado', date: iso(now, 14) }),
    t({ type: 'expense', amount: 180, accountId: 'acc-cash', categoryId: 'cat-fun', description: 'Cinema e jantar', date: iso(now, 16) }),

    // Conta pendente (futuro, não desconta ainda)
    t({ type: 'expense', amount: 450, accountId: 'acc-itau', categoryId: 'cat-health', description: 'Plano odontológico', date: iso(now, 28), status: 'pending' }),

    // Parcelado 1/6 (notebook)
    ...installments({
      groupId: groupParcela, total: 6, perValue: 666.5, startKey: now, day: 20,
      accountId: 'acc-nubank', categoryId: 'cat-fun', description: 'Notebook',
    }),

    // Histórico — mês anterior
    t({ type: 'income', amount: 6500, accountId: 'acc-itau', categoryId: 'cat-salary', description: 'Salário', date: iso(prev, 5) }),
    t({ type: 'expense', amount: 1800, accountId: 'acc-itau', categoryId: 'cat-home', description: 'Aluguel', date: iso(prev, 8) }),
    t({ type: 'expense', amount: 610, accountId: 'acc-nubank', categoryId: 'cat-food', description: 'Mercado', date: iso(prev, 15) }),
    t({ type: 'expense', amount: 290, accountId: 'acc-nubank', categoryId: 'cat-fun', description: 'Show', date: iso(prev, 22) }),

    // Histórico — 2 meses atrás
    t({ type: 'income', amount: 6500, accountId: 'acc-itau', categoryId: 'cat-salary', description: 'Salário', date: iso(prev2, 5) }),
    t({ type: 'expense', amount: 1800, accountId: 'acc-itau', categoryId: 'cat-home', description: 'Aluguel', date: iso(prev2, 8) }),
    t({ type: 'expense', amount: 480, accountId: 'acc-nubank', categoryId: 'cat-food', description: 'Mercado', date: iso(prev2, 15) }),

    // Investimento
    t({ type: 'investment', amount: 2000, accountId: 'acc-itau', description: 'CDB Banco X', date: iso(now, 6), investment: { rate: 11.5, maturity: addMonths(now, 12) + '-01' } }),
  ]

  const budgets = [
    { id: uid(), categoryId: 'cat-food', limit: 800 },
    { id: uid(), categoryId: 'cat-fun', limit: 500 },
    { id: uid(), categoryId: 'cat-transport', limit: 400 },
  ]

  const goals = [
    { id: uid(), name: 'Trocar de carro', target: 20000, saved: 6500, color: '#0E7C5A' },
    { id: uid(), name: 'Reserva de emergência', target: 15000, saved: 9200, color: '#1D4ED8' },
  ]

  return { accounts, categories, transactions, budgets, goals }
}

function t(data) {
  return {
    id: uid(),
    status: 'paid',
    recurring: false,
    installment: null,
    investment: null,
    toAccountId: null,
    categoryId: null,
    createdAt: new Date().toISOString(),
    ...data,
  }
}

function installments({ groupId, total, perValue, startKey, day, accountId, categoryId, description }) {
  const out = []
  for (let i = 0; i < total; i++) {
    const key = addMonths(startKey, i)
    out.push(
      t({
        type: 'expense',
        amount: perValue,
        accountId,
        categoryId,
        description,
        date: iso(key, day),
        status: i === 0 ? 'paid' : 'pending',
        installment: { current: i + 1, total, groupId },
      })
    )
  }
  return out
}
