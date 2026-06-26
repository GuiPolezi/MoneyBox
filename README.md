# Caixa — Sistema de Finanças Pessoais

Substitui a planilha do Excel por um painel web com **big numbers**, gráficos,
previsão automática do próximo mês e um **formulário único e dinâmico** para
lançar receitas, despesas, transferências e investimentos.

Feito com **React + Vite + Tailwind**.

## Rodando localmente

Pré-requisito: Node.js 18+.

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (geralmente http://localhost:5173).
Para gerar a versão de produção: `npm run build` e depois `npm run preview`.

## O que já funciona

- **Dashboard** com big numbers (Saldo, Receitas, Despesas, Balanço), gráfico
  de pizza por categoria, histórico de 6 meses, card de **previsão** do mês
  seguinte e progresso dos orçamentos.
- **Formulário dinâmico**: ao escolher o tipo (Receita / Despesa /
  Transferência / Investimento) os campos mudam. Flags de **Recorrente**,
  **Pendente** e **Parcelado** (gera as parcelas futuras automaticamente).
- **Transações**: busca, filtros por tipo/status, edição, exclusão, estorno
  (marcar pago/pendente).
- **Contas e carteiras** com saldo individual.
- **Orçamentos** com teto por categoria e barra de progresso.
- **Metas** (caixinhas) com depósito/retirada.
- **Investimentos** com taxa, vencimento e rendimento projetado.
- Seletor de mês global na barra superior.

Os dados são salvos no **localStorage** do navegador. O login é local (apenas
um nome) — **ainda não é autenticação real**.

## Estrutura

```
src/
  lib/
    store.js      ← ÚNICA camada de dados (zustand + persist)
    finance.js    ← cálculos puros (saldos, resumos, previsão)
    format.js     ← moeda BRL, datas, helpers de mês
    seed.js       ← dados de exemplo
  components/
    common.jsx    ← BigNumber, Progress, Empty, TxRow
  pages/          ← Dashboard, Transactions, Accounts, Budgets, Goals, Investments, Settings
  TransactionModal.jsx  ← formulário dinâmico
  Layout.jsx / Login.jsx / App.jsx / ui.jsx
```

## Próximo passo: multiusuário com banco isolado (Supabase)

O requisito de "cada usuário vê só os próprios dados" se resolve com
**Supabase** (Auth + Postgres com Row Level Security). O código já isola TODO
acesso a dados em `src/lib/store.js`, então a migração não toca nas telas:

1. Crie um projeto no Supabase e ative o Auth (email/senha).
2. Crie as tabelas (`accounts`, `categories`, `transactions`, `budgets`,
   `goals`) com uma coluna `user_id uuid` e uma policy RLS:
   `user_id = auth.uid()`. Isso garante o isolamento por usuário no banco.
3. `npm install @supabase/supabase-js` e crie um client com as variáveis
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (arquivo `.env`).
4. Em `store.js`, troque as ações (`addTransaction`, etc.) por chamadas ao
   Supabase e substitua a tela `Login.jsx` por `supabase.auth.signInWithPassword`.

## Ideias de evolução

- Exportar/importar CSV para migrar a planilha atual.
- Recorrência com data-fim e geração real dos lançamentos futuros.
- Notificações de contas a vencer.
- Modo escuro (os tokens de cor já estão centralizados no Tailwind).
```
