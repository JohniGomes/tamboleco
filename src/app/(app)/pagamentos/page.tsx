import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { FinanceiroStatusBadge } from "@/components/ui/Badge";
import { LancamentoStatusSelect } from "@/components/LancamentoStatusSelect";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import { CATEGORIA_LABELS } from "@/lib/types";
import type { FinanceiroComRelacoes } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const today = todayISO();
  const monthStart = today.slice(0, 7) + "-01";

  const [
    { data: allEntradas },
    { data: allSaidas },
    { data: filtered },
  ] = await Promise.all([
    supabase.from("financeiro").select("*").eq("tipo", "entrada"),
    supabase.from("financeiro").select("valor").eq("tipo", "saida"),
    (() => {
      let q = supabase
        .from("financeiro")
        .select("*, clientes(id, nome)")
        .order("data", { ascending: false });
      if (status) q = q.eq("status", status);
      return q;
    })(),
  ]);

  const entradas = (allEntradas as { valor: number; status: string; data: string }[] | null) ?? [];
  const saidas = (allSaidas as { valor: number }[] | null) ?? [];

  const recebidoHoje = entradas
    .filter((e) => e.status === "pago" && e.data === today)
    .reduce((acc, e) => acc + Number(e.valor), 0);
  const recebidoMes = entradas
    .filter((e) => e.status === "pago" && e.data >= monthStart)
    .reduce((acc, e) => acc + Number(e.valor), 0);
  const totalPendente = entradas
    .filter((e) => e.status === "pendente")
    .reduce((acc, e) => acc + Number(e.valor), 0);
  const totalAtraso = entradas
    .filter((e) => e.status === "pendente" && e.data < today)
    .reduce((acc, e) => acc + Number(e.valor), 0);
  const totalDespesas = saidas.reduce((acc, s) => acc + Number(s.valor), 0);
  const totalRecebido = entradas.filter((e) => e.status === "pago").reduce((acc, e) => acc + Number(e.valor), 0);
  const saldoCaixa = totalRecebido - totalDespesas;

  const list = (filtered as FinanceiroComRelacoes[] | null) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-tamboleco-950">Pagamentos</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Recebido Hoje" value={formatBRL(recebidoHoje)} accent="text-status-ativo" />
        <StatCard label="Recebido no Mês" value={formatBRL(recebidoMes)} accent="text-status-ativo" />
        <StatCard label="Total Pendente" value={formatBRL(totalPendente)} accent="text-status-pendente" />
        <StatCard label="Total em Atraso" value={formatBRL(totalAtraso)} accent="text-status-atrasado" />
        <StatCard label="Total Despesas" value={formatBRL(totalDespesas)} accent="text-status-atrasado" />
        <StatCard
          label="Saldo do Caixa"
          value={formatBRL(saldoCaixa)}
          accent={saldoCaixa >= 0 ? "text-status-ativo" : "text-status-atrasado"}
        />
      </div>

      <div className="flex gap-2 text-sm">
        {[
          { label: "Todos", value: "" },
          { label: "Pago", value: "pago" },
          { label: "Pendente", value: "pendente" },
          { label: "Atrasado", value: "atrasado" },
        ].map((f) => (
          <a
            key={f.value}
            href={f.value ? `/pagamentos?status=${f.value}` : "/pagamentos"}
            className={`rounded-full px-3 py-1 ${
              (status ?? "") === f.value
                ? "bg-tamboleco-500 text-white"
                : "bg-white border border-gray-300 text-gray-600"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Data</Th>
            <Th>Descrição</Th>
            <Th>Categoria</Th>
            <Th>Cliente</Th>
            <Th>Tipo</Th>
            <Th>Valor</Th>
            <Th>Status</Th>
          </tr>
        </Thead>
        <tbody>
          {list.map((f) => (
            <Tr key={f.id}>
              <Td>{formatDate(f.data)}</Td>
              <Td>{f.descricao}</Td>
              <Td>{CATEGORIA_LABELS[f.categoria]}</Td>
              <Td>{f.clientes?.nome ?? "-"}</Td>
              <Td>{f.tipo === "entrada" ? "Entrada" : "Saída"}</Td>
              <Td>{formatBRL(f.valor)}</Td>
              <Td className="flex items-center gap-2">
                <FinanceiroStatusBadge status={f.status} />
                <LancamentoStatusSelect id={f.id} status={f.status} />
              </Td>
            </Tr>
          ))}
          {!list.length && (
            <Tr>
              <Td colSpan={7} className="text-center text-gray-400">
                Nenhum lançamento encontrado.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
