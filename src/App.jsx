import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from './lib/store'
import { useTheme } from './lib/theme'
import { isSupabaseConfigured } from './lib/supabase'
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
import { Wallet, Loader2 } from 'lucide-react'

export default function App() {
  const init = useStore((s) => s.init)
  const themeInit = useTheme((s) => s.init)
  const booting = useStore((s) => s.booting)
  const ready = useStore((s) => s.ready)
  const session = useStore((s) => s.session)

  useEffect(() => {
    themeInit()
    init()
  }, [init, themeInit])

  if (!isSupabaseConfigured) return <ConfigNotice />
  if (booting) return <Splash label="Carregando…" />
  if (!session) return <Login />
  if (!ready) return <Splash label="Carregando seus dados…" />

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

function Splash({ label }) {
  return (
    <div className="min-h-screen grid place-items-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-white">
          <Wallet size={22} />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={15} className="animate-spin" /> {label}
        </div>
      </div>
    </div>
  )
}

function ConfigNotice() {
  return (
    <div className="min-h-screen grid place-items-center bg-surface p-6">
      <div className="card max-w-md p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-white">
          <Wallet size={22} />
        </div>
        <h1 className="mt-5 font-display text-xl font-semibold">Configure o Supabase</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Crie um arquivo <code className="rounded bg-ink/5 px-1.5 py-0.5">.env</code> na
          raiz do projeto (use o <code className="rounded bg-ink/5 px-1.5 py-0.5">.env.example</code> como
          base) com as variáveis <code className="rounded bg-ink/5 px-1.5 py-0.5">VITE_SUPABASE_URL</code> e{' '}
          <code className="rounded bg-ink/5 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code>, depois rode{' '}
          <code className="rounded bg-ink/5 px-1.5 py-0.5">npm run dev</code> novamente.
        </p>
        <p className="mt-3 text-xs text-muted">
          Não esqueça de rodar o <code className="rounded bg-ink/5 px-1.5 py-0.5">supabase/schema.sql</code> no
          SQL Editor do seu projeto.
        </p>
      </div>
    </div>
  )
}
