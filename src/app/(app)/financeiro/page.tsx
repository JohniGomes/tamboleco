import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { FinanceiroStatusBadge } from "@/components/ui/Badge";
import { LancamentoStatusSelect } from "@/components/LancamentoStatusSelect";
import { LancamentoForm } from "@/components/LancamentoForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteLancamento } from "./actions";
import { formatBRL, formatDate } from "@/lib/format";
import { CATEGORIA_LABELS } from "@/lib/types";
import type { FinanceiroComRelacoes } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; status?: string; tipo?: string; de?: string; ate?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("financeiro")
    .select("*, clientes(id, nome)")
    .order("data", { ascending: false });

  if (sp.categoria) query = query.eq("categoria", sp.categoria);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.tipo) query = query.eq("tipo", sp.tipo);
  if (sp.de) query = query.gte("data", sp.de);
  if (sp.ate) query = query.lte("data", sp.ate);

  const [{ data: lancamentos }, { data: clientes }] = await Promise.all([
    query,
    supabase.from("clientes").select("id, nome").order("nome"),
  ]);

  const list = (lancamentos as FinanceiroComRelacoes[] | null) ?? [];
  const totalEntradas = list.filter((l) => l.tipo === "entrada").reduce((acc, l) => acc + Number(l.valor), 0);
  const totalSaidas = list.filter((l) => l.tipo === "saida").reduce((acc, l) => acc + Number(l.valor), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-tamboleco-950">Financeiro</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Entradas" value={formatBRL(totalEntradas)} accent="text-status-ativo" />
        <StatCard label="Total Saídas" value={formatBRL(totalSaidas)} accent="text-status-atrasado" />
        <StatCard
          label="Saldo (filtro atual)"
          value={formatBRL(totalEntradas - totalSaidas)}
          accent={totalEntradas - totalSaidas >= 0 ? "text-status-ativo" : "text-status-atrasado"}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <LancamentoForm clientes={clientes ?? []} />
      </div>

      <form className="flex flex-wrap gap-3 text-sm">
        <select name="tipo" defaultValue={sp.tipo ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5">
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5">
          <option value="">Todos os status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <select name="categoria" defaultValue={sp.categoria ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5">
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input type="date" name="de" defaultValue={sp.de ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5" />
        <input type="date" name="ate" defaultValue={sp.ate ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5" />
        <button className="rounded-lg bg-tamboleco-500 px-4 py-1.5 font-medium text-white hover:bg-tamboleco-800">
          Filtrar
        </button>
      </form>

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
            <Th></Th>
          </tr>
        </Thead>
        <tbody>
          {list.map((f) => (
            <Tr key={f.id}>
              <Td>{formatDate(f.data)}</Td>
              <Td>{f.descricao}</Td>
              <Td>{CATEGORIA_LABELS[f.categoria]}</Td>
              <Td>{f.clientes?.nome ?? "-"}</Td>
              <Td className={f.tipo === "entrada" ? "font-medium text-status-ativo" : "font-medium text-status-atrasado"}>
                {f.tipo === "entrada" ? "Entrada" : "Saída"}
              </Td>
              <Td>{formatBRL(f.valor)}</Td>
              <Td className="flex items-center gap-2">
                <FinanceiroStatusBadge status={f.status} />
                <LancamentoStatusSelect id={f.id} status={f.status} />
              </Td>
              <Td>
                <DeleteButton
                  onDelete={deleteLancamento.bind(null, f.id)}
                  confirmMessage={`Excluir o lançamento "${f.descricao}"?`}
                />
              </Td>
            </Tr>
          ))}
          {!list.length && (
            <Tr>
              <Td colSpan={8} className="text-center text-gray-400">
                Nenhum lançamento encontrado.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
