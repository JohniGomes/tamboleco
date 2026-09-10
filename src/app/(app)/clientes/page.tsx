import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import type { Cliente } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clientes").select("*").order("nome");
  if (q) {
    query = query.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%,cpf_cnpj.ilike.%${q}%`);
  }
  const { data: clientes } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-tamboleco-950">Clientes</h1>
        <LinkButton href="/clientes/novo">+ Novo Cliente</LinkButton>
      </div>

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tamboleco-500 focus:outline-none"
        />
        <button className="rounded-lg bg-tamboleco-500 px-4 py-2 text-sm font-medium text-white hover:bg-tamboleco-800">
          Buscar
        </button>
      </form>

      <Table>
        <Thead>
          <tr>
            <Th>Nome</Th>
            <Th>Tipo</Th>
            <Th>Telefone</Th>
            <Th>CPF/CNPJ</Th>
            <Th>E-mail</Th>
          </tr>
        </Thead>
        <tbody>
          {(clientes as Cliente[] | null)?.map((c) => (
            <Tr key={c.id}>
              <Td>
                <Link href={`/clientes/${c.id}`} className="font-medium text-tamboleco-500 hover:underline">
                  {c.nome}
                </Link>
              </Td>
              <Td>{c.tipo_pessoa === "fisica" ? "Física" : "Jurídica"}</Td>
              <Td>{c.telefone ?? "-"}</Td>
              <Td>{c.cpf_cnpj ?? "-"}</Td>
              <Td>{c.email ?? "-"}</Td>
            </Tr>
          ))}
          {!clientes?.length && (
            <Tr>
              <Td colSpan={5} className="text-center text-gray-400">
                Nenhum cliente encontrado.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
