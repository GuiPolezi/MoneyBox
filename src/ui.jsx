import { createContext, useContext, useState } from 'react'
import { todayKey } from './lib/format'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [month, setMonth] = useState(todayKey())
  const [txModal, setTxModal] = useState(null) // null | {} (novo) | transação (editar)

  const openNew = (preset = {}) => setTxModal({ mode: 'new', preset })
  const openEdit = (tx) => setTxModal({ mode: 'edit', tx })
  const closeModal = () => setTxModal(null)

  return (
    <UIContext.Provider
      value={{ month, setMonth, txModal, openNew, openEdit, closeModal }}
    >
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
