import { create } from 'zustand'

// Preferência de tema (claro/escuro). Fica em localStorage, separada da conta,
// porque é uma preferência do dispositivo. A classe `.dark` no <html> é o que
// realmente troca as cores (via variáveis CSS em index.css).

const KEY = 'caixa-theme'

const apply = (theme) => {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  // Atualiza a cor da barra do navegador no mobile
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1411' : '#f1f3f0')
}

export const useTheme = create((set, get) => ({
  theme: 'light',

  // Sincroniza o estado com o que o script anti-flash já aplicou no <html>
  init: () => {
    const isDark = document.documentElement.classList.contains('dark')
    set({ theme: isDark ? 'dark' : 'light' })
  },

  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(KEY, next)
    } catch {}
    apply(next)
    set({ theme: next })
  },
}))
