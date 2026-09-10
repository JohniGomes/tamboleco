import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/Button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { AluguelStatusBadge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteAluguel } from "./actions";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import type { AluguelComCliente } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AlugueisPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("alugueis")
    .select("*, clientes(id, nome, telefone)")
    .order("data_entrega", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: alugueis } = await query;
  const today = todayISO();

  const displayed = (alugueis as AluguelComCliente[] | null)?.map((a) => ({
    ...a,
    effectiveStatus:
      a.status === "ativo" && a.data_prevista_recolhimento && a.data_prevista_recolhimento < today
        ? "atrasado"
        : a.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-tamboleco-950">Aluguéis</h1>
        <LinkButton href="/alugueis/novo">+ Novo Aluguel</LinkButton>
      </div>

      <div className="flex gap-2 text-sm">
        {[
          { label: "Todos", value: "" },
          { label: "Ativos", value: "ativo" },
          { label: "Recolhidos", value: "recolhido" },
          { label: "Atrasados", value: "atrasado" },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/alugueis?status=${f.value}` : "/alugueis"}
            className={`rounded-full px-3 py-1 ${
              (status ?? "") === f.value
                ? "bg-tamboleco-500 text-white"
                : "bg-white border border-gray-300 text-gray-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Cliente</Th>
            <Th>Endereço da Obra</Th>
            <Th>Entrega</Th>
            <Th>Recolhimento Previsto</Th>
            <Th>Qtd.</Th>
            <Th>Valor</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </Thead>
        <tbody>
          {displayed?.map((a) => (
            <Tr key={a.id}>
              <Td>
                {a.clientes ? (
                  <Link href={`/clientes/${a.clientes.id}`} className="text-tamboleco-500 hover:underline">
                    {a.clientes.nome}
                  </Link>
                ) : (
                  "-"
                )}
              </Td>
              <Td>
                <Link href={`/alugueis/${a.id}`} className="hover:underline">
                  {a.endereco_obra}
                </Link>
              </Td>
              <Td>{formatDate(a.data_entrega)}</Td>
              <Td>{formatDate(a.data_prevista_recolhimento)}</Td>
              <Td>{a.quantidade_latoes}</Td>
              <Td>{formatBRL(a.valor_total)}</Td>
              <Td>
                <AluguelStatusBadge status={a.effectiveStatus} />
              </Td>
              <Td>
                <DeleteButton
                  onDelete={deleteAluguel.bind(null, a.id)}
                  confirmMessage={`Excluir o aluguel em "${a.endereco_obra}"? O lançamento financeiro vinculado também será removido.`}
                />
              </Td>
            </Tr>
          ))}
          {!displayed?.length && (
            <Tr>
              <Td colSpan={8} className="text-center text-gray-400">
                Nenhum aluguel encontrado.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
