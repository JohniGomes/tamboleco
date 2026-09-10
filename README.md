# Tamboleco Mini Entulho — Sistema de Gestão

Sistema de gestão interno para empresa de aluguel de "latões" (caçambas pequenas para entulho de construção). Controla clientes, aluguéis, o inventário físico dos latões, o financeiro (contas a pagar/receber) e emite recibos em PDF.

## Funcionalidades

- **Login** com Supabase Auth (e-mail/senha). Não há autocadastro — contas são criadas pelo administrador diretamente no painel do Supabase.
- **Dashboard**: latões ativos, latões a recolher, clientes cadastrados, valores a receber/recebidos/despesas e saldo.
- **Clientes**: cadastro (pessoa física/jurídica), busca, histórico completo de aluguéis e pagamentos por cliente.
- **Aluguéis**: criação com seleção de cliente, cálculo automático do valor total, geração automática de lançamento financeiro, marcação de recolhimento, geração de recibo em PDF e upload do recibo assinado/escaneado.
- **Latões**: inventário físico com status (disponível / em obra / manutenção).
- **Financeiro**: lançamentos de entrada/saída por categoria, com filtros e totalizadores.
- **Pagamentos**: visão de contas a receber/pagar agrupada por status (pago/pendente/atrasado).
- **Relatórios**: receita x despesa mensal (gráfico), utilização de latões, top clientes por receita.
- **Busca**: busca global por clientes e aluguéis.

## Stack técnica

- [Next.js 14+ (App Router)](https://nextjs.org/) com TypeScript
- [Tailwind CSS](https://tailwindcss.com/) (tema de cores customizado "tamboleco")
- [Supabase](https://supabase.com/) (Postgres + Auth + Storage) via `@supabase/ssr`
- [@react-pdf/renderer](https://react-pdf.org/) para geração de recibos em PDF
- [recharts](https://recharts.org/) para gráficos
- [date-fns](https://date-fns.org/), [zod](https://zod.dev/), [react-hook-form](https://react-hook-form.com/)

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/dashboard).
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/migrations/0001_init.sql`. Isso cria todas as tabelas (`clientes`, `latoes`, `alugueis`, `aluguel_latoes`, `financeiro`), os índices, as políticas de RLS (qualquer usuário autenticado tem acesso total — é uma ferramenta interna de tenant único) e o bucket de Storage `recibos` com suas políticas.
   - Caso o bucket não seja criado automaticamente pelo script (algumas contas restringem `insert` direto em `storage.buckets` via SQL Editor), crie manualmente em **Storage → New bucket**, nome `recibos`, marcado como **privado** (não público), e reaplique as políticas de RLS da tabela `storage.objects` presentes no final do arquivo de migração.
3. Vá em **Authentication → Users → Add user** e crie o primeiro usuário administrador manualmente (e-mail + senha). Não existe tela pública de cadastro neste sistema — todo acesso é provisionado pelo admin.
4. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

`.env.local` já está no `.gitignore` e nunca deve ser commitado.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Você será redirecionado para `/login` — use o usuário criado no passo 3 acima.

## Build de produção

```bash
npm run build
npm run start
```

## Deploy no Vercel

1. Suba o código para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com/), clique em **New Project** e importe o repositório.
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os mesmos valores do `.env.local`.
4. Clique em **Deploy**. A cada push na branch principal o Vercel fará um novo deploy automaticamente.

## Estrutura de pastas relevante

```
src/
  app/
    (app)/            # área autenticada: dashboard, clientes, aluguéis, latões, financeiro, pagamentos, relatórios, busca
    login/             # tela de login
    api/recibo/[aluguelId]/route.tsx  # geração do PDF do recibo
  components/          # componentes de UI e formulários
  components/ui/       # componentes base (Button, Card, Table, Input, Badge)
  lib/
    supabase/          # clients Supabase (browser, server, middleware)
    types.ts           # tipos das tabelas do banco
    format.ts          # formatação de moeda (BRL) e datas (dd/MM/yyyy)
  middleware.ts         # protege rotas autenticadas e redireciona /login
supabase/
  migrations/0001_init.sql  # schema completo do banco + RLS + bucket de storage
```

## Sobre o recibo em PDF

O botão **Gerar Recibo PDF** na página de um aluguel gera um PDF (via `@react-pdf/renderer`) com os dados do cliente, da obra, valores e regras padrão de locação (texto placeholder — ajuste conforme a política real da empresa em `src/app/api/recibo/[aluguelId]/route.tsx`). O PDF tem linhas de assinatura, mas **não é uma assinatura eletrônica certificada** — é apenas um documento para impressão/assinatura manual ou para anexar depois de assinado. Use o botão **Salvar recibo assinado/escaneado** para enviar o arquivo assinado (PDF) ao Storage do Supabase e vinculá-lo ao aluguel. No futuro, isso pode ser substituído por integração com um provedor de assinatura eletrônica real (ex.: Clicksign, DocuSign).
