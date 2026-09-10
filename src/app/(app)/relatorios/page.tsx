import { createClient } from "@/lib/supabase/server";
import { Card, StatCard } from "@/components/ui/Card";
import { RelatorioChart } from "@/components/RelatorioChart";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { formatBRL } from "@/lib/format";
import type { Financeiro, Latao } from "@/lib/types";

export const dynamic = "force-dynamic";

function monthLabel(dateStr: string) {
  const [y, m] = dateStr.split("-");
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${meses[Number(m) - 1]}/${y.slice(2)}`;
}

export default async function RelatoriosPage() {
  const supabase = await createClient();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  const fromDate = twelveMonthsAgo.toISOString().slice(0, 10);

  const [{ data: financeiro }, { data: latoes }, { data: alugueis }] = await Promise.all([
    supabase.from("financeiro").select("*").gte("data", fromDate).order("data"),
    supabase.from("latoes").select("*"),
    supabase.from("alugueis").select("cliente_id, valor_total, clientes(id, nome)"),
  ]);

  const financeiroList = (financeiro as Financeiro[] | null) ?? [];
  const monthlyMap = new Map<string, { mes: string; entradas: number; saidas: number }>();
  for (const f of financeiroList) {
    const key = f.data.slice(0, 7);
    if (!monthlyMap.has(key)) monthlyMap.set(key, { mes: monthLabel(f.data), entradas: 0, saidas: 0 });
    const entry = monthlyMap.get(key)!;
    if (f.tipo === "entrada") entry.entradas += Number(f.valor);
    else entry.saidas += Number(f.valor);
  }
  const chartData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const latoesList = (latoes as Latao[] | null) ?? [];
  const totalLatoes = latoesList.length;
  const emUso = latoesList.filter((l) => l.status === "em_obra").length;
  const utilizacao = totalLatoes ? Math.round((emUso / totalLatoes) * 100) : 0;

  type ClienteAgg = { nome: string; total: number };
  const clienteMap = new Map<string, ClienteAgg>();
  for (const a of (alugueis as unknown as { cliente_id: string | null; valor_total: number | null; clientes: { id: string; nome: string } | null }[]) ?? []) {
    if (!a.clientes) continue;
    const existing = clienteMap.get(a.clientes.id) ?? { nome: a.clientes.nome, total: 0 };
    existing.total += Number(a.valor_total ?? 0);
    clienteMap.set(a.clientes.id, existing);
  }
  const topClientes = Array.from(clienteMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-tamboleco-950">Relatórios</h1>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Receita vs Despesa (últimos 12 meses)
        </h2>
        {chartData.length ? (
          <RelatorioChart data={chartData} />
        ) : (
          <p className="text-sm text-gray-400">Sem dados suficientes para exibir o gráfico.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Latões Totais" value={totalLatoes} />
        <StatCard label="Latões em Uso" value={emUso} accent="text-status-recolhido" />
        <StatCard label="Taxa de Utilização" value={`${utilizacao}%`} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tamboleco-950">Top Clientes por Receita</h2>
        <Table>
          <Thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Total em Aluguéis</Th>
            </tr>
          </Thead>
          <tbody>
            {topClientes.map((c) => (
              <Tr key={c.nome}>
                <Td>{c.nome}</Td>
                <Td>{formatBRL(c.total)}</Td>
              </Tr>
            ))}
            {!topClientes.length && (
              <Tr>
                <Td colSpan={2} className="text-center text-gray-400">
                  Sem dados.
                </Td>
              </Tr>
            )}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
