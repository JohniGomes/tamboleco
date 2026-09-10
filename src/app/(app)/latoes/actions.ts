"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface LataoFormState {
  error?: string;
}

export async function createLatao(_prev: LataoFormState, formData: FormData): Promise<LataoFormState> {
  const numero = String(formData.get("numero") ?? "").trim();
  if (!numero) return { error: "Número é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("latoes").insert({
    numero,
    observacoes: String(formData.get("observacoes") ?? "").trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/latoes");
  return {};
}

export async function updateLataoStatus(id: string, status: string) {
  const supabase = await createClient();
  await supabase.from("latoes").update({ status }).eq("id", id);
  revalidatePath("/latoes");
}

export async function deleteLatao(id: string) {
  const supabase = await createClient();
  await supabase.from("latoes").delete().eq("id", id);
  revalidatePath("/latoes");
}
