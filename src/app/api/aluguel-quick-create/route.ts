import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json();
  const {
    cliente_id,
    endereco_obra,
    quantidade_latoes,
    valor_unitario,
    valor_total,
    data_entrega,
    data_prevista_recolhimento,
    forma_pagamento,
    observacoes,
  } = body;

  if (!cliente_id || !endereco_obra || !data_entrega) {
    return NextResponse.json({ error: "Dados incompletos para criar o aluguel." }, { status: 400 });
  }

  const { data: aluguel, error } = await supabase
    .from("alugueis")
    .insert({
      cliente_id,
      endereco_obra,
      data_entrega,
      quantidade_latoes: quantidade_latoes ?? 1,
      valor_unitario,
      valor_total,
      forma_pagamento,
      data_prevista_recolhimento,
      observacoes,
      status: "ativo",
    })
    .select("id")
    .single();

  if (error || !aluguel) {
    return NextResponse.json({ error: error?.message ?? "Erro ao criar aluguel." }, { status: 500 });
  }

  await supabase.from("financeiro").insert({
    data: data_entrega,
    descricao: `Aluguel de latão(ões) - ${endereco_obra}`,
    categoria: "aluguel_latao",
    tipo: "entrada",
    valor: valor_total ?? 0,
    forma_pagamento,
    status: "pendente",
    cliente_id,
    aluguel_id: aluguel.id,
  });

  return NextResponse.json({ id: aluguel.id });
}
