# 💰 Caixa

> ### Suas finanças em um número só.

Um sistema web de finanças pessoais para **aposentar a planilha**: lance uma vez e veja saldo, balanço do mês e a previsão do próximo — tudo num painel visual com _big numbers_, gráficos e previsibilidade.

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white&style=for-the-badge)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-0B3D2E?style=flat-square)
![License](https://img.shields.io/badge/licen%C3%A7a-MIT-0B3D2E?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-bem--vindos-0E7C5A?style=flat-square)

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Capturas de tela](#capturas-de-tela)
- [Tecnologias](#tecnologias)
- [Começando](#começando)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Arquitetura](#arquitetura)
- [Roadmap](#roadmap)
- [Licença](#licença)

---

## Funcionalidades

O **Caixa** abandona o modelo de várias planilhas (gasto fixo, renda fixa, dívidas) e usa um **modelo de transação único** com formulário inteligente. Tudo é um lançamento — o que muda são as _flags_.

### 🔐 Autenticação e segurança

- Cadastro e login reais via **Supabase Auth**.
- Cada usuário tem seus dados **isolados no banco** por _Row Level Security_ — ninguém vê as finanças de ninguém.

### 📊 Dashboard estratégico

- **Big numbers**: Saldo atual, Receitas, Despesas e Balanço do mês.
- **Gráficos**: pizza de gastos por categoria e histórico de 6 meses (receitas × despesas).
- **Previsão automática** do mês seguinte, somando recorrentes, parcelas futuras e contas agendadas — sem planilha de projeção.

### ⚡ Lançamento único e dinâmico

- Botão sempre acessível para registrar uma movimentação em segundos.
- O formulário muda conforme o tipo: **Receita · Despesa · Transferência · Investimento**.
- Flags: **Recorrente** (repete todo mês), **Pendente** (não desconta do saldo até ser paga) e **Parcelado** (gera as parcelas futuras automaticamente, ex.: 1/12).
- Editar, excluir e estornar qualquer lançamento na listagem.

### 🗂️ Organização

- **Categorias** com cores para alimentar os gráficos.
- **Contas e carteiras** (Nubank, Itaú, dinheiro físico…) com saldo individual.
- **Orçamentos** com teto mensal por categoria e barra de progresso.
- **Metas / caixinhas** com valor-alvo e depósito/retirada.

### 📈 Investimentos

- Lançamentos com **taxa de rendimento** e **vencimento**, com projeção do valor futuro por juros compostos.

### 🎨 Experiência

- **Modo escuro** com troca instantânea e sem _flash_ ao carregar.
- **Responsivo**: sidebar no desktop e menu _hambúrguer_ com _drawer_ no mobile.
- Seletor de mês global e tipografia pensada para números (figuras tabulares).

---

## Capturas de tela

Salve suas imagens na pasta `docs/` e referencie-as aqui. Exemplo de duas telas lado a lado:

```markdown
| Tema claro | Tema escuro |
| :---: | :---: |
| ![Dashboard claro](docs/dashboard-light.png) | ![Dashboard escuro](docs/dashboard-dark.png) |
```

---

## Tecnologias

| Camada | Stack |
| --- | --- |
| **Front-end** | React 18 + Vite |
| **Estilo** | Tailwind CSS (tokens de cor via variáveis CSS) |
| **Estado** | Zustand |
| **Rotas** | React Router |
| **Gráficos** | Recharts |
| **Ícones** | Lucide |
| **Back-end** | Supabase (Auth + PostgreSQL + RLS) |

---

## Começando

### Pré-requisitos

- **Node.js 18+**
- Uma conta gratuita no [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/SEU-USUARIO/caixa.git
cd caixa
npm install
```

### 2. Configurar o Supabase

1. Crie um projeto novo no Supabase.
2. Em **SQL Editor**, cole e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). Isso cria as tabelas já com **Row Level Security**.
3. Em **Project Settings → API**, copie a _Project URL_ e a _anon public key_.
4. _(Recomendado em dev)_ Em **Authentication → Email**, desligue **"Confirm email"** para entrar direto após o cadastro.

### 3. Variáveis de ambiente

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-public-key
```

### 4. Rodar

```bash
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produção
npm run preview   # pré-visualiza o build
```

Abra o endereço indicado pelo Vite, crie sua conta e comece a lançar. Uma conta nova começa vazia — em **Configurações → Restaurar exemplo** você popula com dados de demonstração.

---

## Estrutura do projeto

```
caixa/
├─ src/
│  ├─ lib/
│  │  ├─ supabase.js     # cliente Supabase (lê o .env)
│  │  ├─ store.js        # ÚNICA camada de dados: auth + acesso ao banco
│  │  ├─ finance.js      # cálculos puros (saldos, resumos, previsão)
│  │  ├─ theme.js        # preferência de tema (claro/escuro)
│  │  ├─ format.js       # moeda BRL, datas, helpers
│  │  └─ seed.js         # dados de exemplo
│  ├─ components/        # BigNumber, Progress, Empty, TxRow…
│  ├─ pages/             # Dashboard, Transações, Contas, Orçamentos, Metas, Investimentos, Config
│  ├─ TransactionModal.jsx   # formulário dinâmico
│  ├─ Layout.jsx · Login.jsx · App.jsx · ui.jsx
│  └─ index.css
├─ supabase/
│  └─ schema.sql         # tabelas + RLS
└─ index.html
```

---

## Arquitetura

Duas decisões mantêm o sistema simples de evoluir:

- **Documento JSON por linha.** Cada registro é guardado como `{ id, user_id, data }`, espelhando o objeto usado no app. Toda a lógica (saldos, previsões, gráficos) roda no cliente em `finance.js` — sem mapeamento de colunas e sem migração a cada campo novo.
- **Camada de dados única.** Todo acesso ao banco está concentrado em `store.js`. As telas chamam ações com nomes estáveis (`addTransaction`, `addBudget`…), então trocar a fonte de dados não toca na interface.

O **isolamento por usuário** acontece no banco: as _policies_ de RLS garantem `auth.uid() = user_id` em toda leitura e escrita.

---

## Roadmap

Próximos passos avaliados a partir de um _benchmark_ com Mobills, Organizze, Monarch, Copilot e YNAB:

- [ ] 📥 Importar / exportar **CSV** (migrar a planilha atual)
- [ ] 📈 **Patrimônio** (net worth) ao longo do tempo
- [ ] 💳 **Cartão de crédito / fatura** (competência × caixa)
- [ ] 🔔 **Lembretes** de contas + calendário de vencimentos
- [ ] 🏷️ **Tags** e subcategorias
- [ ] 🔁 Motor de **recorrência** com frequência e data-fim
- [ ] 📊 Seção de **Relatórios** e tendências
- [ ] 📱 **PWA** instalável com bloqueio por biometria
- [x] 🌙 **Modo escuro**
- [x] 🔐 Autenticação real com isolamento por usuário

---

## Licença

Distribuído sob a licença **MIT**. Sinta-se livre para usar, modificar e compartilhar. _(Lembre-se de adicionar um arquivo `LICENSE` ao repositório.)_

---

Feito com ☕ e um pouco de disciplina financeira. Se este projeto te ajudou, deixe uma ⭐ no repositório.