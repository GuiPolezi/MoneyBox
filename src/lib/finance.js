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

// ---------------------------------------------------------------------
//  RECORRÊNCIAS (streams)
//
//  Um lançamento "recorrente" representa um valor fixo que se repete todo
//  mês (salário, aluguel, assinatura). O problema clássico: a MESMA conta
//  recorrente costuma existir como várias linhas no histórico (uma por mês
//  já lançado). Somar todas as linhas multiplica o valor mensal.
//
//  Aqui cada "coisa que repete" é contada UMA vez por mês. Agrupamos por
//  uma assinatura (tipo + descrição + conta) e ficamos com a ocorrência
//  mais recente — esse é o valor mensal vigente do stream.
//
//  Parcelas NUNCA entram aqui: uma parcela é um evento único de um mês
//  específico. Ela é projetada no mês em que cai (ver monthCommitments).
// ---------------------------------------------------------------------
export function recurringStreams(transactions) {
  const map = new Map()
  for (const t of transactions) {
    if (!t.recurring || t.installment) continue
    if (t.type !== 'income' && t.type !== 'expense') continue
    const sig = `${t.type}|${(t.description || '').trim().toLowerCase()}|${t.accountId}`
    const prev = map.get(sig)
    if (!prev || new Date(t.date) > new Date(prev.date)) map.set(sig, t)
  }
  const streams = [...map.values()].sort((a, b) => b.amount - a.amount)
  const income = streams
    .filter((s) => s.type === 'income')
    .reduce((a, s) => a + s.amount, 0)
  const expense = streams
    .filter((s) => s.type === 'expense')
    .reduce((a, s) => a + s.amount, 0)
  return { streams, income, expense }
}

// Tudo que ainda está PENDENTE num mês (recorrente ou não, parcela ou não).
// Usado no mês corrente: o que já foi pago está no saldo realizado; o que
// falta pagar/receber é o que ainda mexe no saldo até o fim do mês.
export function pendingInMonth(transactions, key) {
  const rows = transactions.filter(
    (t) => monthKey(t.date) === key && t.status === 'pending'
  )
  let income = 0
  let installments = 0
  let bills = 0
  for (const t of rows) {
    if (t.type === 'income') {
      income += t.amount
      continue
    }
    const out = t.type === 'expense' || t.type === 'investment' ? t.amount : 0
    if (t.installment) installments += out
    else bills += out
  }
  return { income, installments, bills, expense: installments + bills }
}

// Compromissos NÃO recorrentes de um mês específico, separados em
// parcelas e contas avulsas. Recorrentes são tratados pelos streams.
//  - onlyPending=true  → só o que ainda não foi pago (uso no mês corrente,
//    pois o que já foi pago já está no saldo realizado).
//  - onlyPending=false → tudo que está agendado para aquele mês futuro.
export function monthCommitments(transactions, key, { onlyPending = false } = {}) {
  const rows = transactions.filter(
    (t) => monthKey(t.date) === key && !t.recurring
  )
  let income = 0
  let installments = 0
  let bills = 0
  for (const t of rows) {
    if (onlyPending && t.status !== 'pending') continue
    if (t.type === 'income') {
      income += t.amount
      continue
    }
    const out = t.type === 'expense' || t.type === 'investment' ? t.amount : 0
    if (t.installment) installments += out
    else bills += out
  }
  return { income, installments, bills, expense: installments + bills }
}

// Previsão do PRÓXIMO mês (card do dashboard). Agora consistente:
//  entradas  = streams recorrentes de receita + receitas agendadas
//  saídas    = streams recorrentes de despesa + parcelas + contas agendadas
// Sem multiplicar valores por causa de linhas históricas ou parcelas.
export function forecast(transactions, currentKey) {
  const nextKey = addMonths(currentKey, 1)
  const rec = recurringStreams(transactions)
  const com = monthCommitments(transactions, nextKey, { onlyPending: false })
  const income = rec.income + com.income
  const expense = rec.expense + com.expense
  return { key: nextKey, income, expense, balance: income - expense }
}

// ---------------------------------------------------------------------
//  PROJEÇÃO DE FLUXO DE CAIXA  (o "saldo vivo" mês a mês)
//
//  Parte do saldo REALIZADO de hoje e rola N meses pra frente. Para cada
//  mês soma os streams recorrentes + parcelas + contas agendadas, e mantém
//  um SALDO CORRIDO. É isso que mostra quando o dinheiro acaba e você cai
//  no crédito — e quando volta a sobrar.
//
//  Mês corrente: usa apenas o que ainda está PENDENTE (o pago já está no
//  saldo de hoje). Meses futuros: streams recorrentes + agendados do mês.
// ---------------------------------------------------------------------
export function cashFlowProjection(accounts, transactions, currentKey, months = 6) {
  const opening = totalBalance(accounts, transactions)
  const rec = recurringStreams(transactions)

  const rows = []
  let running = opening

  // Passo 0 — o que ainda falta acontecer no mês corrente (tudo pendente,
  // inclusive recorrentes ainda não pagos deste mês).
  const cur = pendingInMonth(transactions, currentKey)
  const curNet = cur.income - cur.expense
  const curOpening = running
  running += curNet
  rows.push({
    key: currentKey,
    current: true,
    opening: curOpening,
    income: cur.income,
    recurringIncome: 0,
    scheduledIncome: cur.income,
    expense: cur.expense,
    recurringExpense: 0,
    installments: cur.installments,
    bills: cur.bills,
    net: curNet,
    closing: running,
    negative: running < 0,
  })

  // Meses futuros — recorrentes (sintetizados) + agendados do mês.
  for (let i = 1; i <= months; i++) {
    const key = addMonths(currentKey, i)
    const open = running
    const com = monthCommitments(transactions, key, { onlyPending: false })
    const income = rec.income + com.income
    const expense = rec.expense + com.expense
    const net = income - expense
    running += net
    rows.push({
      key,
      current: false,
      opening: open,
      income,
      recurringIncome: rec.income,
      scheduledIncome: com.income,
      expense,
      recurringExpense: rec.expense,
      installments: com.installments,
      bills: com.bills,
      net,
      closing: running,
      negative: running < 0,
    })
  }

  const firstNegative = rows.find((r) => r.negative) || null
  const lowest = rows.reduce((min, r) => (r.closing < min.closing ? r : min), rows[0])
  const totalInstallments = rows.reduce((s, r) => s + r.installments, 0)

  return {
    opening,
    rows,
    firstNegative,
    lowest,
    totalInstallments,
    recurringIncome: rec.income,
    recurringExpense: rec.expense,
    streams: rec.streams,
  }
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
