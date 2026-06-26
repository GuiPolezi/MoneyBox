import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import { useUI } from './ui'
import { monthLabel, addMonths } from './lib/format'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target,
  PiggyBank, TrendingUp, Settings, Plus, ChevronLeft,
  ChevronRight, LogOut, Menu, X,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/contas', label: 'Contas', icon: Wallet },
  { to: '/orcamentos', label: 'Orçamentos', icon: Target },
  { to: '/metas', label: 'Metas', icon: PiggyBank },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/config', label: 'Configurações', icon: Settings },
]

const titles = {
  '/': 'Dashboard',
  '/transacoes': 'Transações',
  '/contas': 'Contas e carteiras',
  '/orcamentos': 'Orçamentos',
  '/metas': 'Metas de economia',
  '/investimentos': 'Investimentos',
  '/config': 'Configurações',
}

// Conteúdo do menu compartilhado entre a sidebar (desktop) e o drawer (mobile).
// onNavigate é passado só no mobile, para fechar o drawer ao tocar num item.
function SidebarContent({ profile, logout, onNavigate }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2.5 px-6 h-16 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">
            <Wallet size={16} />
          </div>
          <span className="font-display text-base font-semibold tracking-tight">Caixa</span>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="lg:hidden grid h-9 w-9 -mr-2 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-positive/40"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand/[0.06] text-brand'
                  : 'text-muted hover:bg-ink/[0.03] hover:text-ink'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-line">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-positive/10 text-positive text-sm font-semibold">
            {(profile?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.name}</p>
          </div>
          <button
            onClick={logout}
            className="text-muted hover:text-negative transition"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

export default function Layout({ children }) {
  const { profile, logout } = useStore()
  const { month, setMonth, openNew } = useUI()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Fecha o drawer sempre que a rota muda
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Enquanto aberto: trava o scroll do fundo e fecha com Esc
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar — desktop (fixa na altura da viewport para o rodapé não sair da tela) */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:self-start lg:h-screen flex-col border-r border-line bg-card">
        <SidebarContent profile={profile} logout={logout} />
      </aside>

      {/* Backdrop — mobile */}
      <div
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer — mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col bg-card shadow-card transition-transform duration-300 ease-out lg:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <SidebarContent
          profile={profile}
          logout={logout}
          onNavigate={() => setMenuOpen(false)}
        />
      </aside>

      {/* Conteúdo */}
      <div className="flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-surface/80 backdrop-blur px-3 sm:px-5 lg:px-8 h-16">
          <div className="flex items-center gap-1 min-w-0">
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink hover:bg-ink/5 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-positive/40"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <Menu size={20} />
            </button>
            <h1 className="font-display text-base sm:text-lg font-semibold tracking-tight truncate">
              {titles[pathname] || 'Caixa'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Seletor de mês */}
            <div className="flex items-center rounded-xl border border-line bg-white">
              <button
                className="grid h-9 w-8 sm:w-9 place-items-center text-muted hover:text-ink transition"
                onClick={() => setMonth(addMonths(month, -1))}
                aria-label="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[84px] sm:min-w-[120px] whitespace-nowrap text-center text-xs sm:text-sm font-medium capitalize">
                {monthLabel(month)}
              </span>
              <button
                className="grid h-9 w-8 sm:w-9 place-items-center text-muted hover:text-ink transition"
                onClick={() => setMonth(addMonths(month, 1))}
                aria-label="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button className="btn-primary px-3 sm:px-4" onClick={() => openNew()}>
              <Plus size={16} />
              <span className="hidden sm:inline">Nova movimentação</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-8">{children}</main>
      </div>
    </div>
  )
}