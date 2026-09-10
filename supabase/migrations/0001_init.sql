-- Tamboleco Mini Entulho - initial schema
-- Run this in the Supabase SQL editor (or via supabase CLI migrations).

create extension if not exists "pgcrypto";

-- ============ CLIENTES ============
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  tipo_pessoa text not null check (tipo_pessoa in ('fisica','juridica')) default 'fisica',
  nome text not null,
  telefone text,
  cpf_cnpj text,
  endereco text,
  email text,
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clientes_nome on clientes (nome);
create index if not exists idx_clientes_cpf_cnpj on clientes (cpf_cnpj);

-- ============ LATOES ============
create table if not exists latoes (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  status text not null check (status in ('disponivel','em_obra','manutencao')) default 'disponivel',
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_latoes_status on latoes (status);

-- ============ ALUGUEIS ============
create table if not exists alugueis (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  endereco_obra text not null,
  data_entrega date not null,
  quantidade_latoes int not null default 1,
  valor_unitario numeric(10,2),
  valor_total numeric(10,2),
  forma_pagamento text,
  status text not null check (status in ('ativo','recolhido','atrasado')) default 'ativo',
  data_prevista_recolhimento date,
  data_efetiva_recolhimento date,
  observacoes text,
  recibo_pdf_path text,
  created_at timestamptz not null default now()
);

create index if not exists idx_alugueis_cliente_id on alugueis (cliente_id);
create index if not exists idx_alugueis_status on alugueis (status);
create index if not exists idx_alugueis_data_entrega on alugueis (data_entrega);
create index if not exists idx_alugueis_data_prevista on alugueis (data_prevista_recolhimento);

-- ============ ALUGUEL_LATOES (join table) ============
create table if not exists aluguel_latoes (
  id uuid primary key default gen_random_uuid(),
  aluguel_id uuid references alugueis(id) on delete cascade,
  latao_id uuid references latoes(id)
);

create index if not exists idx_aluguel_latoes_aluguel_id on aluguel_latoes (aluguel_id);
create index if not exists idx_aluguel_latoes_latao_id on aluguel_latoes (latao_id);

-- ============ FINANCEIRO ============
create table if not exists financeiro (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  descricao text not null,
  categoria text not null check (categoria in (
    'aluguel_latao','recolhimento','outros_servicos','combustivel',
    'descarte','manutencao','funcionarios','outras_despesas'
  )),
  tipo text not null check (tipo in ('entrada','saida')),
  valor numeric(10,2) not null,
  forma_pagamento text,
  status text not null check (status in ('pago','pendente','atrasado')) default 'pendente',
  cliente_id uuid references clientes(id),
  aluguel_id uuid references alugueis(id),
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_financeiro_cliente_id on financeiro (cliente_id);
create index if not exists idx_financeiro_aluguel_id on financeiro (aluguel_id);
create index if not exists idx_financeiro_status on financeiro (status);
create index if not exists idx_financeiro_data on financeiro (data);
create index if not exists idx_financeiro_tipo on financeiro (tipo);

-- ============ ROW LEVEL SECURITY ============
-- Single-tenant internal tool: any authenticated user has full access.

alter table clientes enable row level security;
alter table latoes enable row level security;
alter table alugueis enable row level security;
alter table aluguel_latoes enable row level security;
alter table financeiro enable row level security;

create policy "authenticated_full_access_clientes" on clientes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access_latoes" on latoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access_alugueis" on alugueis
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access_aluguel_latoes" on aluguel_latoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access_financeiro" on financeiro
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============ STORAGE: recibos bucket ============
insert into storage.buckets (id, name, public)
values ('recibos', 'recibos', false)
on conflict (id) do nothing;

create policy "authenticated_read_recibos" on storage.objects
  for select using (bucket_id = 'recibos' and auth.role() = 'authenticated');

create policy "authenticated_insert_recibos" on storage.objects
  for insert with check (bucket_id = 'recibos' and auth.role() = 'authenticated');

create policy "authenticated_update_recibos" on storage.objects
  for update using (bucket_id = 'recibos' and auth.role() = 'authenticated');

create policy "authenticated_delete_recibos" on storage.objects
  for delete using (bucket_id = 'recibos' and auth.role() = 'authenticated');
