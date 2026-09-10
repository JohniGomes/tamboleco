"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayISO } from "@/lib/format";

export interface AluguelFormState {
  error?: string;
}

function getStr(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function getNum(formData: FormData, key: string): number | null {
  const v = getStr(formData, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export async function createAluguel(_prev: AluguelFormState, formData: FormData): Promise<AluguelFormState> {
  const endereco_obra = getStr(formData, "endereco_obra");
  const data_entrega = getStr(formData, "data_entrega");
  const cliente_id = getStr(formData, "cliente_id");

  if (!endereco_obra) return { error: "Endereço da obra é obrigatório." };
  if (!data_entrega) return { error: "Data de entrega é obrigatória." };
  if (!cliente_id) return { error: "Selecione um cliente." };

  const quantidade_latoes = getNum(formData, "quantidade_latoes") ?? 1;
  const valor_unitario = getNum(formData, "valor_unitario");
  const valor_total = getNum(formData, "valor_total") ?? (valor_unitario ? valor_unitario * quantidade_latoes : null);
  const forma_pagamento = getStr(formData, "forma_pagamento");
  const data_prevista_recolhimento = getStr(formData, "data_prevista_recolhimento");
  const observacoes = getStr(formData, "observacoes");

  const supabase = await createClient();

  const { data: aluguel, error } = await supabase
    .from("alugueis")
    .insert({
      cliente_id,
      endereco_obra,
      data_entrega,
      quantidade_latoes,
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
    return { error: error?.message ?? "Erro ao criar aluguel." };
  }

  const { error: finError } = await supabase.from("financeiro").insert({
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

  if (finError) {
    // aluguel was created, but financeiro entry failed - surface but don't block
    console.error("Erro ao criar lançamento financeiro:", finError.message);
  }

  revalidatePath("/alugueis");
  revalidatePath("/financeiro");
  revalidatePath("/");
  redirect(`/alugueis/${aluguel.id}`);
}

export async function marcarRecolhido(aluguelId: string) {
  const supabase = await createClient();
  await supabase
    .from("alugueis")
    .update({ status: "recolhido", data_efetiva_recolhimento: todayISO() })
    .eq("id", aluguelId);

  revalidatePath("/alugueis");
  revalidatePath(`/alugueis/${aluguelId}`);
  revalidatePath("/");
}

export async function updateAluguel(id: string, _prev: AluguelFormState, formData: FormData): Promise<AluguelFormState> {
  const endereco_obra = getStr(formData, "endereco_obra");
  if (!endereco_obra) return { error: "Endereço da obra é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("alugueis")
    .update({
      endereco_obra,
      data_entrega: getStr(formData, "data_entrega"),
      quantidade_latoes: getNum(formData, "quantidade_latoes") ?? 1,
      valor_unitario: getNum(formData, "valor_unitario"),
      valor_total: getNum(formData, "valor_total"),
      forma_pagamento: getStr(formData, "forma_pagamento"),
      data_prevista_recolhimento: getStr(formData, "data_prevista_recolhimento"),
      observacoes: getStr(formData, "observacoes"),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/alugueis");
  revalidatePath(`/alugueis/${id}`);
  return {};
}

export async function deleteAluguel(id: string) {
  const supabase = await createClient();
  await supabase.from("financeiro").delete().eq("aluguel_id", id);
  await supabase.from("alugueis").delete().eq("id", id);
  revalidatePath("/alugueis");
  revalidatePath("/financeiro");
  revalidatePath("/pagamentos");
  revalidatePath("/");
}

export async function salvarReciboPath(aluguelId: string, path: string) {
  const supabase = await createClient();
  await supabase.from("alugueis").update({ recibo_pdf_path: path }).eq("id", aluguelId);
  revalidatePath(`/alugueis/${aluguelId}`);
}
