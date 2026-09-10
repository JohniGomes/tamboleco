import { createClient } from "@/lib/supabase/server";
import { AluguelForm } from "@/components/AluguelForm";
import { createAluguel } from "@/app/(app)/alugueis/actions";

export default async function NovoAluguelPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome, cpf_cnpj")
    .order("nome");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-tamboleco-950">Novo Aluguel</h1>
      <AluguelForm clientes={clientes ?? []} action={createAluguel} submitLabel="Salvar Aluguel" />
    </div>
  );
}
