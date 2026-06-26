import { Routes, Route } from 'react-router-dom'
import { useStore } from './lib/store'
import { UIProvider } from './ui'
import Login from './Login'
import Layout from './Layout'
import TransactionModal from './TransactionModal'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Investments from './pages/Investments'
import Settings from './pages/Settings'

export default function App() {
  const profile = useStore((s) => s.profile)

  if (!profile) return <Login />

  return (
    <UIProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transacoes" element={<Transactions />} />
          <Route path="/contas" element={<Accounts />} />
          <Route path="/orcamentos" element={<Budgets />} />
          <Route path="/metas" element={<Goals />} />
          <Route path="/investimentos" element={<Investments />} />
          <Route path="/config" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
      <TransactionModal />
    </UIProvider>
  )
}
