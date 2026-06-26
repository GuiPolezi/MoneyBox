import { useState } from 'react'
import { useStore } from './lib/store'
import { Wallet, ArrowRight, Loader2, MailCheck } from 'lucide-react'

// Traduz as mensagens de erro mais comuns do Supabase
const translate = (msg = '') => {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este e-mail já está cadastrado. Tente entrar.'
  if (m.includes('password should be at least'))
    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'E-mail inválido.'
  if (m.includes('email not confirmed'))
    return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.'
  return msg || 'Algo deu errado. Tente novamente.'
}

export default function Login() {
  const { signIn, signUp } = useStore()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isRegister = mode === 'register'

  const canSubmit =
    email.trim() &&
    password.length >= 6 &&
    (!isRegister || name.trim())

  const submit = async () => {
    if (!canSubmit || loading) return
    setError('')
    setInfo('')
    setLoading(true)
    const res = isRegister
      ? await signUp({ name: name.trim(), email: email.trim(), password })
      : await signIn({ email: email.trim(), password })
    setLoading(false)
    if (res?.error) setError(translate(res.error))
    else if (res?.needsConfirmation)
      setInfo('Enviamos um link de confirmação para o seu e-mail. Confirme para entrar.')
    // Em caso de sucesso, o listener de auth troca de tela automaticamente.
  }

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError('')
    setInfo('')
  }

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
          Seus dados ficam isolados por usuário, protegidos no Supabase.
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

          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {isRegister ? 'Criar conta' : 'Entrar'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {isRegister
              ? 'Leva menos de um minuto. Comece a organizar suas finanças.'
              : 'Bem-vindo de volta. Acesse seu painel.'}
          </p>

          <div className="mt-7 space-y-4">
            {isRegister && (
              <div>
                <label className="label" htmlFor="name">Nome</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Ex.: Maria"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  autoFocus
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                autoFocus={!isRegister}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-negative/10 px-3.5 py-2.5 text-sm text-negative">
                {error}
              </p>
            )}
            {info && (
              <p className="flex items-start gap-2 rounded-xl bg-positive/10 px-3.5 py-2.5 text-sm text-positive">
                <MailCheck size={16} className="mt-0.5 shrink-0" /> {info}
              </p>
            )}

            <button className="btn-primary w-full" onClick={submit} disabled={!canSubmit || loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Criar conta' : 'Entrar no painel'} <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <button onClick={switchMode} className="font-medium text-brand hover:underline">
              {isRegister ? 'Entrar' : 'Criar agora'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
