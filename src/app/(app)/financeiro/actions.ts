"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { todayISO } from "@/lib/format";

export interface FinanceiroFormState {
  error?: string;
}

function getStr(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

export async function createLancamento(
  _prev: FinanceiroFormState,
  formData: FormData
): Promise<FinanceiroFormState> {
  const descricao = getStr(formData, "descricao");
  const categoria = getStr(formData, "categoria");
  const tipo = getStr(formData, "tipo");
  const valorStr = getStr(formData, "valor");

  if (!descricao) return { error: "Descrição é obrigatória." };
  if (!categoria) return { error: "Categoria é obrigatória." };
  if (!tipo) return { error: "Tipo é obrigatório." };
  if (!valorStr) return { error: "Valor é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("financeiro").insert({
    data: getStr(formData, "data") ?? todayISO(),
    descricao,
    categoria,
    tipo,
    valor: Number(valorStr),
    forma_pagamento: getStr(formData, "forma_pagamento"),
    status: getStr(formData, "status") ?? "pendente",
    cliente_id: getStr(formData, "cliente_id"),
    observacoes: getStr(formData, "observacoes"),
  });

  if (error) return { error: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/pagamentos");
  revalidatePath("/");
  return {};
}

export async function updateLancamentoStatus(id: string, status: string) {
  const supabase = await createClient();
  await supabase.from("financeiro").update({ status }).eq("id", id);
  revalidatePath("/financeiro");
  revalidatePath("/pagamentos");
  revalidatePath("/");
}
