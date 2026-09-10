export type TipoPessoa = "fisica" | "juridica";

export interface Cliente {
  id: string;
  tipo_pessoa: TipoPessoa;
  nome: string;
  telefone: string | null;
  cpf_cnpj: string | null;
  endereco: string | null;
  email: string | null;
  observacoes: string | null;
  created_at: string;
}

export type LataoStatus = "disponivel" | "em_obra" | "manutencao";

export interface Latao {
  id: string;
  numero: string;
  status: LataoStatus;
  observacoes: string | null;
  created_at: string;
}

export type AluguelStatus = "ativo" | "recolhido" | "atrasado";

export interface Aluguel {
  id: string;
  cliente_id: string | null;
  endereco_obra: string;
  data_entrega: string;
  quantidade_latoes: number;
  valor_unitario: number | null;
  valor_total: number | null;
  forma_pagamento: string | null;
  status: AluguelStatus;
  data_prevista_recolhimento: string | null;
  data_efetiva_recolhimento: string | null;
  observacoes: string | null;
  recibo_pdf_path: string | null;
  created_at: string;
}

export interface AluguelComCliente extends Aluguel {
  clientes?: Pick<Cliente, "id" | "nome" | "telefone" | "cpf_cnpj" | "endereco"> | null;
}

export interface AluguelLatao {
  id: string;
  aluguel_id: string;
  latao_id: string;
}

export type FinanceiroCategoria =
  | "aluguel_latao"
  | "recolhimento"
  | "outros_servicos"
  | "combustivel"
  | "descarte"
  | "manutencao"
  | "funcionarios"
  | "outras_despesas";

export type FinanceiroTipo = "entrada" | "saida";
export type FinanceiroStatus = "pago" | "pendente" | "atrasado";

export interface Financeiro {
  id: string;
  data: string;
  descricao: string;
  categoria: FinanceiroCategoria;
  tipo: FinanceiroTipo;
  valor: number;
  forma_pagamento: string | null;
  status: FinanceiroStatus;
  cliente_id: string | null;
  aluguel_id: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface FinanceiroComRelacoes extends Financeiro {
  clientes?: Pick<Cliente, "id" | "nome"> | null;
}

export const CATEGORIA_LABELS: Record<FinanceiroCategoria, string> = {
  aluguel_latao: "Aluguel de Latão",
  recolhimento: "Recolhimento",
  outros_servicos: "Outros Serviços",
  combustivel: "Combustível",
  descarte: "Descarte",
  manutencao: "Manutenção",
  funcionarios: "Funcionários",
  outras_despesas: "Outras Despesas",
};

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Transferência",
  "Boleto",
];
