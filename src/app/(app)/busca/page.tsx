import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import type { Cliente, Aluguel } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let clientes: Cliente[] = [];
  let alugueis: Aluguel[] = [];

  if (q && q.trim()) {
    const term = q.trim();
    const [{ data: clientesData }, { data: alugueisData }] = await Promise.all([
      supabase
        .from("clientes")
        .select("*")
        .or(`nome.ilike.%${term}%,telefone.ilike.%${term}%,cpf_cnpj.ilike.%${term}%,endereco.ilike.%${term}%`)
        .limit(20),
      supabase
        .from("alugueis")
        .select("*")
        .or(`endereco_obra.ilike.%${term}%,id.eq.${/^[0-9a-fA-F-]{36}$/.test(term) ? term : "00000000-0000-0000-0000-000000000000"}`)
        .limit(20),
    ]);
    clientes = (clientesData as Cliente[] | null) ?? [];
    alugueis = (alugueisData as Aluguel[] | null) ?? [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-tamboleco-950">Busca / Histórico</h1>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar cliente (nome, telefone, CPF/CNPJ, endereço) ou aluguel (endereço, ID)..."
          className="max-w-xl"
        />
        <button className="rounded-lg bg-tamboleco-500 px-4 py-2 text-sm font-medium text-white hover:bg-tamboleco-800">
          Buscar
        </button>
      </form>

      {q && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Clientes ({clientes.length})
            </h2>
            <div className="space-y-2">
              {clientes.map((c) => (
                <Card key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="font-medium text-tamboleco-500 hover:underline">
                    {c.nome}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {c.telefone ?? "-"} · {c.cpf_cnpj ?? "-"} · {c.endereco ?? "-"}
                  </p>
                </Card>
              ))}
              {!clientes.length && <p className="text-sm text-gray-400">Nenhum cliente encontrado.</p>}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Aluguéis ({alugueis.length})
            </h2>
            <div className="space-y-2">
              {alugueis.map((a) => (
                <Card key={a.id}>
                  <Link href={`/alugueis/${a.id}`} className="font-medium text-tamboleco-500 hover:underline">
                    {a.endereco_obra}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Entrega: {formatDate(a.data_entrega)} · Status: {a.status}
                  </p>
                </Card>
              ))}
              {!alugueis.length && <p className="text-sm text-gray-400">Nenhum aluguel encontrado.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
