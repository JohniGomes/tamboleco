import { Type, type FunctionDeclaration } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { CATEGORIA_LABELS, type FinanceiroCategoria } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "resumo_dashboard",
    description:
      "Retorna o resumo geral do negócio hoje: latões ativos, para recolher, recolhidos hoje, total de clientes, valores a receber, recebido hoje, despesas hoje e saldo total do caixa.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "buscar_cliente",
    description:
      "Busca clientes cadastrados pelo nome, telefone, e-mail ou CPF/CNPJ (busca parcial). Retorna dados do cliente e o saldo pendente/atrasado dele.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        termo: { type: Type.STRING, description: "Nome, telefone, e-mail ou CPF/CNPJ (ou parte) do cliente." },
      },
      required: ["termo"],
    },
  },
  {
    name: "listar_alugueis",
    description: "Lista os aluguéis de latões filtrados por status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: ["ativo", "recolhido", "atrasado", "todos"],
          description: "Status do aluguel a filtrar. 'atrasado' = ativo com recolhimento previsto já vencido.",
        },
      },
      required: ["status"],
    },
  },
  {
    name: "listar_financeiro",
    description: "Lista lançamentos do caixa (entradas e saídas), opcionalmente filtrando por status e/ou tipo.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["pago", "pendente", "atrasado", "todos"] },
        tipo: { type: Type.STRING, enum: ["entrada", "saida", "todos"] },
      },
      required: ["status", "tipo"],
    },
  },
  {
    name: "listar_inadimplentes",
    description:
      "Lista clientes com pagamentos pendentes ou em atraso, com o valor total que cada um deve. Útil para gerar mensagens de cobrança.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "criar_rascunho_aluguel",
    description:
      "Monta um RASCUNHO de um novo aluguel de latão a partir dos dados informados pelo usuário no chat, para o usuário revisar e confirmar antes de salvar de verdade. NUNCA salva direto no banco — apenas prepara os dados. Use quando o usuário pedir para cadastrar/alugar/registrar um aluguel pelo chat.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        cliente_nome: { type: Type.STRING, description: "Nome (ou parte do nome) do cliente já cadastrado." },
        endereco_obra: { type: Type.STRING, description: "Endereço da obra onde o(s) latão(ões) será(ão) entregue(s)." },
        quantidade_latoes: { type: Type.NUMBER, description: "Quantidade de latões, padrão 1." },
        valor_unitario: { type: Type.NUMBER, description: "Valor unitário do aluguel, em reais." },
        data_entrega: { type: Type.STRING, description: "Data de entrega no formato YYYY-MM-DD. Se o usuário disser 'hoje' ou 'amanhã', calcule a data real." },
        data_prevista_recolhimento: { type: Type.STRING, description: "Data prevista de recolhimento no formato YYYY-MM-DD, se informada." },
        forma_pagamento: { type: Type.STRING, description: "Forma de pagamento, se informada (Pix, Dinheiro, Cartão, etc)." },
        observacoes: { type: Type.STRING },
      },
      required: ["cliente_nome", "endereco_obra"],
    },
  },
];

function money(rows: { valor: number }[] | null) {
  return (rows ?? []).reduce((acc, r) => acc + Number(r.valor ?? 0), 0);
}

export async function executeTool(name: string, args: Record<string, unknown>) {
  const supabase = await createClient();

  switch (name) {
    case "resumo_dashboard":
      return resumoDashboard(supabase);
    case "buscar_cliente":
      return buscarCliente(supabase, String(args.termo ?? ""));
    case "listar_alugueis":
      return listarAlugueis(supabase, String(args.status ?? "todos"));
    case "listar_financeiro":
      return listarFinanceiro(supabase, String(args.status ?? "todos"), String(args.tipo ?? "todos"));
    case "listar_inadimplentes":
      return listarInadimplentes(supabase);
    case "criar_rascunho_aluguel":
      return criarRascunhoAluguel(supabase, args);
    default:
      return { erro: `Ferramenta desconhecida: ${name}` };
  }
}

async function resumoDashboard(supabase: Supabase) {
  const today = todayISO();
  const [
    latoesAtivos,
    paraRecolher,
    recolhidosHoje,
    clientes,
    aReceber,
    recebidoHoje,
    despesasHoje,
    totalEntradas,
    totalSaidas,
  ] = await Promise.all([
    supabase.from("alugueis").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("alugueis").select("id", { count: "exact", head: true }).eq("status", "ativo").lte("data_prevista_recolhimento", today),
    supabase.from("alugueis").select("id", { count: "exact", head: true }).eq("status", "recolhido").eq("data_efetiva_recolhimento", today),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase.from("financeiro").select("valor").eq("tipo", "entrada").eq("status", "pendente"),
    supabase.from("financeiro").select("valor").eq("tipo", "entrada").eq("status", "pago").eq("data", today),
    supabase.from("financeiro").select("valor").eq("tipo", "saida").eq("data", today),
    supabase.from("financeiro").select("valor").eq("tipo", "entrada").eq("status", "pago"),
    supabase.from("financeiro").select("valor").eq("tipo", "saida"),
  ]);

  return {
    latoes_ativos: latoesAtivos.count ?? 0,
    para_recolher_hoje: paraRecolher.count ?? 0,
    recolhidos_hoje: recolhidosHoje.count ?? 0,
    clientes_cadastrados: clientes.count ?? 0,
    a_receber: money(aReceber.data as { valor: number }[] | null),
    recebido_hoje: money(recebidoHoje.data as { valor: number }[] | null),
    despesas_hoje: money(despesasHoje.data as { valor: number }[] | null),
    saldo_total: money(totalEntradas.data as { valor: number }[] | null) - money(totalSaidas.data as { valor: number }[] | null),
  };
}

async function buscarCliente(supabase: Supabase, termo: string) {
  if (!termo.trim()) return { erro: "Informe um termo de busca." };

  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%,email.ilike.%${termo}%`)
    .limit(5);

  if (!clientes?.length) return { encontrados: 0, mensagem: "Nenhum cliente encontrado com esse termo." };

  const results = await Promise.all(
    clientes.map(async (c) => {
      const { data: financeiro } = await supabase
        .from("financeiro")
        .select("valor, status, tipo")
        .eq("cliente_id", c.id)
        .eq("tipo", "entrada");
      const pendente = money((financeiro ?? []).filter((f) => f.status === "pendente"));
      const atrasado = money((financeiro ?? []).filter((f) => f.status === "atrasado"));
      return {
        nome: c.nome,
        tipo_pessoa: c.tipo_pessoa,
        telefone: c.telefone,
        cpf_cnpj: c.cpf_cnpj,
        endereco: c.endereco,
        email: c.email,
        saldo_pendente: pendente,
        saldo_atrasado: atrasado,
      };
    })
  );

  return { encontrados: results.length, clientes: results };
}

async function listarAlugueis(supabase: Supabase, status: string) {
  const today = todayISO();
  let query = supabase
    .from("alugueis")
    .select("endereco_obra, data_entrega, data_prevista_recolhimento, quantidade_latoes, valor_total, status, clientes(nome)")
    .order("data_entrega", { ascending: false })
    .limit(20);

  if (status === "atrasado") {
    query = query.eq("status", "ativo").lte("data_prevista_recolhimento", today);
  } else if (status !== "todos") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return { total: data?.length ?? 0, alugueis: data ?? [] };
}

async function listarFinanceiro(supabase: Supabase, status: string, tipo: string) {
  const today = todayISO();
  let query = supabase
    .from("financeiro")
    .select("data, descricao, categoria, tipo, valor, status, clientes(nome)")
    .order("data", { ascending: false })
    .limit(20);

  if (status === "atrasado") {
    query = query.eq("status", "pendente").lt("data", today);
  } else if (status !== "todos") {
    query = query.eq("status", status);
  }
  if (tipo !== "todos") query = query.eq("tipo", tipo);

  const { data } = await query;
  const lancamentos = (data ?? []).map((f) => ({
    ...f,
    categoria: CATEGORIA_LABELS[f.categoria as FinanceiroCategoria] ?? f.categoria,
  }));
  return { total: lancamentos.length, lancamentos };
}

async function listarInadimplentes(supabase: Supabase) {
  const today = todayISO();
  const { data } = await supabase
    .from("financeiro")
    .select("valor, status, data, cliente_id, clientes(id, nome, telefone)")
    .eq("tipo", "entrada")
    .in("status", ["pendente", "atrasado"])
    .not("cliente_id", "is", null);

  const porCliente = new Map<string, { nome: string; telefone: string | null; total: number; atrasado: boolean }>();
  for (const f of data ?? []) {
    const cliente = f.clientes as unknown as { id: string; nome: string; telefone: string | null } | null;
    if (!cliente) continue;
    const atrasado = f.status === "atrasado" || (f.status === "pendente" && f.data < today);
    const atual = porCliente.get(cliente.id) ?? { nome: cliente.nome, telefone: cliente.telefone, total: 0, atrasado: false };
    atual.total += Number(f.valor ?? 0);
    atual.atrasado = atual.atrasado || atrasado;
    porCliente.set(cliente.id, atual);
  }

  return { inadimplentes: Array.from(porCliente.values()) };
}

async function criarRascunhoAluguel(supabase: Supabase, args: Record<string, unknown>) {
  const clienteNome = String(args.cliente_nome ?? "").trim();
  const { data: matches } = await supabase
    .from("clientes")
    .select("id, nome, telefone")
    .ilike("nome", `%${clienteNome}%`)
    .limit(5);

  if (!matches?.length) {
    return {
      status: "cliente_nao_encontrado",
      mensagem: `Não encontrei nenhum cliente chamado "${clienteNome}". Peça para o usuário cadastrar o cliente antes, ou confirme o nome correto.`,
    };
  }
  if (matches.length > 1) {
    return {
      status: "multiplos_clientes",
      mensagem: "Mais de um cliente encontrado com esse nome. Peça para o usuário especificar qual.",
      opcoes: matches.map((m) => ({ nome: m.nome, telefone: m.telefone })),
    };
  }

  const cliente = matches[0];
  const quantidade = Number(args.quantidade_latoes ?? 1) || 1;
  const valorUnitario = args.valor_unitario != null ? Number(args.valor_unitario) : null;
  const valorTotal = valorUnitario != null ? valorUnitario * quantidade : null;

  const draft = {
    cliente_id: cliente.id,
    cliente_nome: cliente.nome,
    endereco_obra: String(args.endereco_obra ?? ""),
    quantidade_latoes: quantidade,
    valor_unitario: valorUnitario,
    valor_total: valorTotal,
    data_entrega: String(args.data_entrega ?? todayISO()),
    data_prevista_recolhimento: args.data_prevista_recolhimento ? String(args.data_prevista_recolhimento) : null,
    forma_pagamento: args.forma_pagamento ? String(args.forma_pagamento) : null,
    observacoes: args.observacoes ? String(args.observacoes) : null,
  };

  return {
    status: "rascunho_pronto",
    mensagem: "Rascunho montado com sucesso. Mostre um resumo para o usuário e peça confirmação antes de salvar.",
    rascunho: draft,
  };
}
