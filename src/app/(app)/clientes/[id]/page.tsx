import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/ClienteForm";
import { updateCliente } from "@/app/(app)/clientes/actions";
import { deleteAluguel } from "@/app/(app)/alugueis/actions";
import { deleteLancamento } from "@/app/(app)/financeiro/actions";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { AluguelStatusBadge, FinanceiroStatusBadge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { formatBRL, formatDate } from "@/lib/format";
import type { Aluguel, Cliente, Financeiro } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cliente }, { data: alugueis }, { data: lancamentos }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).single(),
    supabase
      .from("alugueis")
      .select("*")
      .eq("cliente_id", id)
      .order("data_entrega", { ascending: false }),
    supabase
      .from("financeiro")
      .select("*")
      .eq("cliente_id", id)
      .order("data", { ascending: false }),
  ]);

  if (!cliente) return notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-tamboleco-950">{(cliente as Cliente).nome}</h1>
        <p className="text-sm text-gray-500">Cadastrado em {formatDate((cliente as Cliente).created_at)}</p>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Dados do Cliente
        </h2>
        <ClienteForm cliente={cliente as Cliente} action={updateCliente.bind(null, id)} submitLabel="Salvar Alterações" />
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tamboleco-950">Aluguéis</h2>
        <Table>
          <Thead>
            <tr>
              <Th>Endereço da Obra</Th>
              <Th>Entrega</Th>
              <Th>Qtd.</Th>
              <Th>Valor</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {(alugueis as Aluguel[] | null)?.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <Link href={`/alugueis/${a.id}`} className="text-tamboleco-500 hover:underline">
                    {a.endereco_obra}
                  </Link>
                </Td>
                <Td>{formatDate(a.data_entrega)}</Td>
                <Td>{a.quantidade_latoes}</Td>
                <Td>{formatBRL(a.valor_total)}</Td>
                <Td>
                  <AluguelStatusBadge status={a.status} />
                </Td>
                <Td>
                  <DeleteButton
                    onDelete={deleteAluguel.bind(null, a.id)}
                    confirmMessage={`Excluir o aluguel em "${a.endereco_obra}"? O lançamento financeiro vinculado também será removido.`}
                  />
                </Td>
              </Tr>
            ))}
            {!alugueis?.length && (
              <Tr>
                <Td colSpan={6} className="text-center text-gray-400">
                  Nenhum aluguel registrado.
                </Td>
              </Tr>
            )}
          </tbody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tamboleco-950">Financeiro / Pagamentos</h2>
        <Table>
          <Thead>
            <tr>
              <Th>Data</Th>
              <Th>Descrição</Th>
              <Th>Tipo</Th>
              <Th>Valor</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {(lancamentos as Financeiro[] | null)?.map((f) => (
              <Tr key={f.id}>
                <Td>{formatDate(f.data)}</Td>
                <Td>{f.descricao}</Td>
                <Td className={f.tipo === "entrada" ? "text-status-ativo" : "text-status-atrasado"}>
                  {f.tipo === "entrada" ? "Entrada" : "Saída"}
                </Td>
                <Td>{formatBRL(f.valor)}</Td>
                <Td>
                  <FinanceiroStatusBadge status={f.status} />
                </Td>
                <Td>
                  <DeleteButton
                    onDelete={deleteLancamento.bind(null, f.id)}
                    confirmMessage={`Excluir o lançamento "${f.descricao}"?`}
                  />
                </Td>
              </Tr>
            ))}
            {!lancamentos?.length && (
              <Tr>
                <Td colSpan={6} className="text-center text-gray-400">
                  Nenhum lançamento financeiro.
                </Td>
              </Tr>
            )}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
