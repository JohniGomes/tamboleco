"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ClienteFormState {
  error?: string;
}

function getStr(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

export async function createCliente(_prev: ClienteFormState, formData: FormData): Promise<ClienteFormState> {
  const nome = getStr(formData, "nome");
  if (!nome) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome,
      tipo_pessoa: getStr(formData, "tipo_pessoa") ?? "fisica",
      telefone: getStr(formData, "telefone"),
      cpf_cnpj: getStr(formData, "cpf_cnpj"),
      endereco: getStr(formData, "endereco"),
      email: getStr(formData, "email"),
      observacoes: getStr(formData, "observacoes"),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Erro ao criar cliente." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateCliente(id: string, _prev: ClienteFormState, formData: FormData): Promise<ClienteFormState> {
  const nome = getStr(formData, "nome");
  if (!nome) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      nome,
      tipo_pessoa: getStr(formData, "tipo_pessoa") ?? "fisica",
      telefone: getStr(formData, "telefone"),
      cpf_cnpj: getStr(formData, "cpf_cnpj"),
      endereco: getStr(formData, "endereco"),
      email: getStr(formData, "email"),
      observacoes: getStr(formData, "observacoes"),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return {};
}

export async function deleteCliente(id: string) {
  const supabase = await createClient();

  const { data: alugueis } = await supabase.from("alugueis").select("id").eq("cliente_id", id);
  const aluguelIds = (alugueis ?? []).map((a) => a.id);

  await supabase.from("financeiro").delete().eq("cliente_id", id);
  if (aluguelIds.length) {
    await supabase.from("financeiro").delete().in("aluguel_id", aluguelIds);
  }
  await supabase.from("alugueis").delete().eq("cliente_id", id);
  await supabase.from("clientes").delete().eq("id", id);

  revalidatePath("/clientes");
  revalidatePath("/alugueis");
  revalidatePath("/financeiro");
  revalidatePath("/pagamentos");
  revalidatePath("/");
}
