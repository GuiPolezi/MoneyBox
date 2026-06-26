// Formatação centralizada — moeda BRL e datas pt-BR.

export const brl = (value) =>
  (value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

// Versão compacta para os big numbers (R$ 12,4 mil)
export const brlCompact = (value) => {
  const abs = Math.abs(value ?? 0)
  if (abs >= 1000) {
    return (value < 0 ? '-' : '') + 'R$ ' + (abs / 1000).toLocaleString('pt-BR', {
      minimumFractionDigits: abs >= 100000 ? 0 : 1,
      maximumFractionDigits: 1,
    }) + ' mil'
  }
  return brl(value)
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

export const formatDateLong = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

// Chave de mês "2025-06" usada para agrupar e filtrar
export const monthKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const monthLabel = (key) => {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export const monthShort = (key) => {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'short' })
}

// Adiciona meses a uma chave "2025-06" -> "2025-08"
export const addMonths = (key, n) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return monthKey(d)
}

export const todayKey = () => monthKey(new Date())

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
