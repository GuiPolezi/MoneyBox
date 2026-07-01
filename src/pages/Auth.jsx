import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Guilloche } from '../components/Ornament'
import { Button, Field, Input } from '../components/ui/primitives'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('in') // 'in' | 'up'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const err = mode === 'in'
      ? await signIn(email, password)
      : await signUp(email, password, name)
    setBusy(false)
    if (err) { setMsg(err.message); return }
    if (mode === 'up') setMsg('Conta criada. Confirme o e-mail se for solicitado, depois entre.')
    else navigate('/')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left — the note */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-currency text-paper2 relative overflow-hidden">
        <Guilloche className="absolute -top-10 -right-10 w-[520px]" color="#E9E3D2" opacity={0.18} />
        <Guilloche className="absolute bottom-0 -left-20 w-[520px]" color="#C9A24B" opacity={0.16} />
        <div className="relative">
          <span className="font-display text-3xl">MoneyBox</span>
          <p className="text-sm text-paper2/70 mt-1 uppercase tracking-[0.25em]">livro-caixa pessoal</p>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl leading-tight">
            Onde cada real<br />tem seu registro.
          </h1>
          <p className="mt-4 text-paper2/75 max-w-sm">
            Salário, saldo, fatura, parcelas e metas — lançados como num livro-caixa,
            com a projeção do mês que vem sempre à vista.
          </p>
        </div>
        <p className="relative text-xs text-paper2/50 figure">SÉRIE A · 2026 · UM EXEMPLAR POR PESSOA</p>
      </div>

      {/* right — the form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-3xl text-ink mb-1">
            {mode === 'in' ? 'Entrar' : 'Criar conta'}
          </h2>
          <p className="text-sm text-ink/60 mb-6">
            {mode === 'in' ? 'Acesse seu livro-caixa.' : 'Comece seu próprio livro-caixa.'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'up' && (
              <Field label="Nome">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como te chamamos" />
              </Field>
            )}
            <Field label="E-mail">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
            </Field>
            <Field label="Senha">
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
            </Field>

            {msg && <p className="text-sm text-oxblood">{msg}</p>}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Aguarde…' : mode === 'in' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <button
            onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null) }}
            className="mt-5 text-sm text-currency hover:underline"
          >
            {mode === 'in' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
