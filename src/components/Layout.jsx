import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'
import { Money } from './ui/primitives'

const nav = [
  { to: '/', label: 'Painel', end: true },
  { to: '/movimentacoes', label: 'Movimentações' },
  { to: '/fatura', label: 'Fatura' },
  { to: '/contas', label: 'Contas & Parcelas' },
  { to: '/metas', label: 'Metas' },
  { to: '/ajustes', label: 'Ajustes' },
]

export default function Layout() {
  const { signOut, user } = useAuth()
  const { profile } = useFinance()
  const navigate = useNavigate()

  const onSignOut = async () => { await signOut(); navigate('/entrar') }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* sidebar */}
      <aside className="lg:w-64 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-line bg-paper2/60 backdrop-blur flex lg:flex-col">
        <div className="p-5 lg:p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-2xl text-currency tracking-tight">MoneyBox</span>
          </div>
          <p className="hidden lg:block text-[11px] uppercase tracking-[0.2em] text-ink/50 mb-6">
            livro-caixa pessoal
          </p>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-2 rounded-sm text-sm transition-colors ${
                    isActive
                      ? 'bg-currency text-paper2'
                      : 'text-ink/70 hover:bg-paper2 hover:text-ink'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:block mt-auto pt-6">
            <div className="rule pb-3 mb-3" />
            <p className="text-xs text-ink/50">Saldo atual</p>
            <Money value={profile?.balance} className="text-lg" />
            <p className="mt-3 text-xs text-ink/60 truncate">{user?.email}</p>
            <button onClick={onSignOut} className="mt-2 text-xs text-oxblood hover:underline">
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-6xl w-full mx-auto">
        <Outlet />
        <button
          onClick={onSignOut}
          className="lg:hidden mt-8 text-xs text-oxblood hover:underline"
        >
          Sair da conta
        </button>
      </main>
    </div>
  )
}
