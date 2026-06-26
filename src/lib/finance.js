import { monthKey, addMonths, monthShort } from './format'

// =====================================================================
//  MOTOR DE CÁLCULO
//  Funções puras que derivam saldos, resumos, gráficos e previsão a
//  partir da lista de transações. Sem efeitos colaterais.
// =====================================================================

// Sinal da transação para uma conta específica (entra +, sai -)
const signFor = (t, accountId) => {
  if (t.type === 'income') return t.accountId === accountId ? 1 : 0
  if (t.type === 'expense' || t.type === 'investment')
    return t.accountId === accountId ? -1 : 0
  if (t.type === 'transfer') {
    if (t.accountId === accountId) return -1
    if (t.toAccountId === accountId) return 1
  }
  return 0
}

// Saldo realizado de uma conta = saldo inicial + transações PAGAS
export function accountBalance(account, transactions) {
  const moved = transactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + signFor(t, account.id) * t.amount, 0)
  return (account.initialBalance || 0) + moved
}

export function totalBalance(accounts, transactions) {
  return accounts.reduce((s, a) => s + accountBalance(a, transactions), 0)
}

// Quanto está alocado em investimentos (pagos)
export function totalInvested(transactions) {
  return transactions
    .filter((t) => t.type === 'investment' && t.status === 'paid')
    .reduce((s, t) => s + t.amount, 0)
}

// Resumo de um mês (apenas transações PAGAS daquele mês)
export function monthSummary(transactions, key) {
  const inMonth = transactions.filter((t) => monthKey(t.date) === key)
  const income = inMonth
    .filter((t) => t.type === 'income' && t.status === 'paid')
    .reduce((s, t) => s + t.amount, 0)
  const expense = inMonth
    .filter((t) => t.type === 'expense' && t.status === 'paid')
    .reduce((s, t) => s + t.amount, 0)
  const pending = inMonth
    .filter((t) => t.status === 'pending')
    .reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense, pending }
}

// Gastos por categoria no mês — alimenta o gráfico de pizza
export function categoryBreakdown(transactions, categories, key) {
  const inMonth = transactions.filter(
    (t) => monthKey(t.date) === key && t.type === 'expense' && t.status === 'paid'
  )
  const map = {}
  for (const t of inMonth) {
    const id = t.categoryId || 'none'
    map[id] = (map[id] || 0) + t.amount
  }
  return Object.entries(map)
    .map(([id, value]) => {
      const cat = categories.find((c) => c.id === id)
      return {
        id,
        name: cat?.name || 'Sem categoria',
        color: cat?.color || '#9CA3AF',
        value,
      }
    })
    .sort((a, b) => b.value - a.value)
}

// Histórico dos últimos N meses — gráfico de barras receitas x despesas
export function monthlyHistory(transactions, key, months = 6) {
  const out = []
  for (let i = months - 1; i >= 0; i--) {
    const k = addMonths(key, -i)
    const s = monthSummary(transactions, k)
    out.push({
      key: k,
      label: monthShort(k).replace('.', ''),
      receitas: s.income,
      despesas: s.expense,
      balanco: s.balance,
    })
  }
  return out
}

// Previsão do próximo mês (substitui a planilha de "previsão"):
//  + receitas recorrentes
//  - despesas recorrentes
//  - parcelas/contas já agendadas para o mês seguinte (pendentes ou não)
export function forecast(transactions, currentKey) {
  const nextKey = addMonths(currentKey, 1)

  const recurringIncome = transactions
    .filter((t) => t.recurring && t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const recurringExpense = transactions
    .filter((t) => t.recurring && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  // lançamentos já agendados para o próximo mês que NÃO são recorrentes
  // (parcelas futuras, contas pendentes pontuais)
  const scheduled = transactions.filter(
    (t) => monthKey(t.date) === nextKey && !t.recurring
  )
  const scheduledIncome = scheduled
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const scheduledExpense = scheduled
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const income = recurringIncome + scheduledIncome
  const expense = recurringExpense + scheduledExpense
  return { key: nextKey, income, expense, balance: income - expense }
}

// Progresso dos orçamentos no mês corrente
export function budgetProgress(budgets, transactions, categories, key) {
  return budgets.map((b) => {
    const spent = transactions
      .filter(
        (t) =>
          t.categoryId === b.categoryId &&
          t.type === 'expense' &&
          t.status === 'paid' &&
          monthKey(t.date) === key
      )
      .reduce((s, t) => s + t.amount, 0)
    const cat = categories.find((c) => c.id === b.categoryId)
    const ratio = b.limit > 0 ? spent / b.limit : 0
    return {
      ...b,
      category: cat,
      spent,
      ratio,
      remaining: b.limit - spent,
      over: spent > b.limit,
    }
  })
}

// Rendimento projetado de um investimento (juros compostos simples até o vencimento)
export function investmentProjection(t) {
  if (!t.investment?.maturity || !t.investment?.rate) return null
  const start = new Date(t.date)
  const end = new Date(t.investment.maturity)
  const months = Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth())
  )
  const annual = t.investment.rate / 100
  const monthly = Math.pow(1 + annual, 1 / 12) - 1
  const future = t.amount * Math.pow(1 + monthly, months)
  return { months, future, yield: future - t.amount }
}
