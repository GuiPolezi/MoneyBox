import { useState } from 'react'
import { useStore } from './lib/store'
import { Wallet, ArrowRight } from 'lucide-react'

export default function Login() {
  const login = useStore((s) => s.login)
  const [name, setName] = useState('')

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Painel da marca */}
      <div className="hidden lg:flex flex-col justify-between bg-brand text-white p-12">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
            <Wallet size={18} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Caixa</span>
        </div>
        <div>
          <p className="font-display text-5xl leading-[1.05] font-semibold tracking-tight">
            Suas finanças
            <br />
            <span className="text-positive/90">em um número só.</span>
          </p>
          <p className="mt-5 max-w-md text-white/70 leading-relaxed">
            Pare de caçar células na planilha. Lance uma vez, veja o saldo, o
            balanço do mês e a previsão do próximo — tudo no mesmo lugar.
          </p>
        </div>
        <p className="text-xs text-white/40">
          Versão local · seus dados ficam neste navegador
        </p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
              <Wallet size={18} />
            </div>
            <span className="font-display text-lg font-semibold">Caixa</span>
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1.5 text-sm text-muted">
            Use seu nome para começar. Para login real com banco isolado por
            usuário, troque esta tela por Supabase Auth (veja o README).
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <label className="label" htmlFor="name">Seu nome</label>
              <input
                id="name"
                className="input"
                placeholder="Ex.: Maria"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login(name)}
                autoFocus
              />
            </div>
            <button className="btn-primary w-full" onClick={() => login(name)}>
              Entrar no painel <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
