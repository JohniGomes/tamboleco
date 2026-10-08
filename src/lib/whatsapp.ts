import { formatBRL, formatDate } from "@/lib/format";
import type { AluguelComCliente } from "@/lib/types";

// Placeholder rental terms - customize with the client's actual policy.
export const REGRAS = [
  "1. O latão deverá permanecer em local de fácil acesso para retirada, sem obstrução por veículos ou materiais.",
  "2. É de responsabilidade do cliente o descarte de resíduos permitidos, sendo vedado o descarte de materiais tóxicos, químicos ou perigosos.",
  "3. O recolhimento será agendado em até 2 (dois) dias úteis após solicitação, salvo prazo previamente combinado.",
  "4. Em caso de dano, extravio ou uso indevido do equipamento, será cobrada taxa de reposição/reparo conforme avaliação técnica.",
  "5. A permanência do latão além do prazo contratado poderá gerar cobrança adicional por dia excedente.",
  "6. O pagamento deverá ser realizado conforme forma e prazo acordados no ato da contratação.",
];

function normalizePhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12) return digits;
  return null;
}

function formatPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone?.trim() || "-";
}

function quantidadeTexto(qtd: number) {
  return `${qtd} ${qtd === 1 ? "latão" : "latões"}`;
}

export function whatsappLink(text: string, phone?: string | null): string {
  const target = normalizePhone(phone);
  return `https://wa.me/${target ?? ""}?text=${encodeURIComponent(text)}`;
}

export function clientePhoneValido(aluguel: AluguelComCliente): boolean {
  return normalizePhone(aluguel.clientes?.telefone) !== null;
}

export function mensagemCliente(aluguel: AluguelComCliente): string {
  const linhas = [
    "*Tamboleco Mini Entulho*",
    `Olá, ${aluguel.clientes?.nome ?? "tudo bem"}! Seguem os dados da sua locação:`,
    "",
    `*Local da obra:* ${aluguel.endereco_obra}`,
    `*Entrega:* ${formatDate(aluguel.data_entrega)}`,
  ];
  if (aluguel.data_prevista_recolhimento) {
    linhas.push(`*Recolhimento previsto:* ${formatDate(aluguel.data_prevista_recolhimento)}`);
  }
  linhas.push(`*Quantidade:* ${quantidadeTexto(aluguel.quantidade_latoes)}`);
  if (aluguel.valor_unitario != null) {
    linhas.push(`*Valor unitário:* ${formatBRL(aluguel.valor_unitario)}`);
  }
  if (aluguel.valor_total != null) {
    linhas.push(`*Valor total:* ${formatBRL(aluguel.valor_total)}`);
  }
  if (aluguel.forma_pagamento) {
    linhas.push(`*Forma de pagamento:* ${aluguel.forma_pagamento}`);
  }
  linhas.push("", "*Regras da locação:*", ...REGRAS, "", "Qualquer dúvida, é só chamar. Obrigado!");
  return linhas.join("\n");
}

export function mensagemEquipe(aluguel: AluguelComCliente): string {
  const linhas = [
    "*Ficha de Locação — Tamboleco*",
    "",
    `*Cliente:* ${aluguel.clientes?.nome ?? "-"}`,
    `*Contato:* ${formatPhone(aluguel.clientes?.telefone)}`,
    `*Quantidade:* ${quantidadeTexto(aluguel.quantidade_latoes)}`,
    `*Entrega:* ${formatDate(aluguel.data_entrega)}`,
  ];
  if (aluguel.data_prevista_recolhimento) {
    linhas.push(`*Recolhimento previsto:* ${formatDate(aluguel.data_prevista_recolhimento)}`);
  }
  linhas.push("", "*Local:*", `${aluguel.endereco_obra}`);
  if (aluguel.observacoes) {
    linhas.push("", `*Obs.:* ${aluguel.observacoes}`);
  }
  return linhas.join("\n");
}
