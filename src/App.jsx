import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Movements from './pages/Movements'
import Invoice from './pages/Invoice'
import Bills from './pages/Bills'
import Goals from './pages/Goals'
import Settings from './pages/Settings'

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="font-display text-2xl text-currency animate-pulse">MoneyBox…</span>
    </div>
  )
}

function Guarded({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/entrar" replace />
  return <FinanceProvider>{children}</FinanceProvider>
}

function Entry() {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/" replace />
  return <Auth />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/entrar" element={<Entry />} />
          <Route element={<Guarded><Layout /></Guarded>}>
            <Route index element={<Dashboard />} />
            <Route path="movimentacoes" element={<Movements />} />
            <Route path="fatura" element={<Invoice />} />
            <Route path="contas" element={<Bills />} />
            <Route path="metas" element={<Goals />} />
            <Route path="ajustes" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
