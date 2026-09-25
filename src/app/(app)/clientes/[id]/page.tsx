import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "@/components/ClienteForm";
import { updateCliente } from "@/app/(app)/clientes/actions";
import { deleteAluguel } from "@/app/(app)/alugueis/actions";
import { deleteLancamento } from "@/app/(app)/financeiro/actions";
import { Card, StatCard } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { AluguelStatusBadge, FinanceiroStatusBadge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { LancamentoStatusSelect } from "@/components/LancamentoStatusSelect";
import { formatBRL, formatDate } from "@/lib/format";
import type { AluguelComCliente, Cliente, Financeiro } from "@/lib/types";

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
      .select("*, financeiro(id, status, tipo, categoria)")
      .eq("cliente_id", id)
      .order("data_entrega", { ascending: false }),
    supabase
      .from("financeiro")
      .select("*")
      .eq("cliente_id", id)
      .order("data", { ascending: false }),
  ]);

  if (!cliente) return notFound();

  const alugueisList = (alugueis as AluguelComCliente[] | null) ?? [];
  const lancamentosList = (lancamentos as Financeiro[] | null) ?? [];

  const totalLatoes = alugueisList.reduce((acc, a) => acc + (a.quantidade_latoes ?? 0), 0);
  const entradas = lancamentosList.filter((f) => f.tipo === "entrada");
  const totalPago = entradas.filter((f) => f.status === "pago").reduce((acc, f) => acc + Number(f.valor), 0);
  const totalPendente = entradas.filter((f) => f.status === "pendente").reduce((acc, f) => acc + Number(f.valor), 0);
  const totalAtrasado = entradas.filter((f) => f.status === "atrasado").reduce((acc, f) => acc + Number(f.valor), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-tamboleco-950">{(cliente as Cliente).nome}</h1>
        <p className="text-sm text-gray-500">Cadastrado em {formatDate((cliente as Cliente).created_at)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total de Latões Alugados" value={totalLatoes} />
        <StatCard label="Total Pago" value={formatBRL(totalPago)} accent="text-status-ativo" />
        <StatCard label="Total Pendente" value={formatBRL(totalPendente)} accent="text-status-pendente" />
        <StatCard label="Total Atrasado" value={formatBRL(totalAtrasado)} accent="text-status-atrasado" />
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
              <Th>Pagamento</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {alugueisList.map((a) => {
              const pagamento = a.financeiro?.find(
                (f) => f.tipo === "entrada" && f.categoria === "aluguel_latao"
              );
              return (
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
                    {pagamento ? (
                      <div className="flex items-center gap-2">
                        <FinanceiroStatusBadge status={pagamento.status} />
                        <LancamentoStatusSelect id={pagamento.id} status={pagamento.status} />
                      </div>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    <DeleteButton
                      onDelete={deleteAluguel.bind(null, a.id)}
                      confirmMessage={`Excluir o aluguel em "${a.endereco_obra}"? O lançamento financeiro vinculado também será removido.`}
                    />
                  </Td>
                </Tr>
              );
            })}
            {!alugueisList.length && (
              <Tr>
                <Td colSpan={7} className="text-center text-gray-400">
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
            {lancamentosList.map((f) => (
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
            {!lancamentosList.length && (
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
