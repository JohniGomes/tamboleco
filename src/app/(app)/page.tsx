import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { formatBRL, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = todayISO();

  const [
    latoesAtivosRes,
    paraRecolherRes,
    recolhidosHojeRes,
    clientesRes,
    aReceberRes,
    recebidoHojeRes,
    despesasHojeRes,
    saldoEntradasRes,
    saldoSaidasRes,
  ] = await Promise.all([
    supabase.from("alugueis").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabase
      .from("alugueis")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativo")
      .lte("data_prevista_recolhimento", today),
    supabase
      .from("alugueis")
      .select("id", { count: "exact", head: true })
      .eq("status", "recolhido")
      .eq("data_efetiva_recolhimento", today),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase.from("financeiro").select("valor").eq("tipo", "entrada").eq("status", "pendente"),
    supabase
      .from("financeiro")
      .select("valor")
      .eq("tipo", "entrada")
      .eq("status", "pago")
      .eq("data", today),
    supabase.from("financeiro").select("valor").eq("tipo", "saida").eq("data", today),
    supabase.from("financeiro").select("valor").eq("tipo", "entrada").eq("status", "pago"),
    supabase.from("financeiro").select("valor").eq("tipo", "saida"),
  ]);

  const sum = (rows: { valor: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.valor ?? 0), 0);

  const aReceber = sum(aReceberRes.data as { valor: number }[] | null);
  const recebidoHoje = sum(recebidoHojeRes.data as { valor: number }[] | null);
  const despesasHoje = sum(despesasHojeRes.data as { valor: number }[] | null);
  const totalEntradas = sum(saldoEntradasRes.data as { valor: number }[] | null);
  const totalSaidas = sum(saldoSaidasRes.data as { valor: number }[] | null);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-tamboleco-950">TAMBOLECO MINI ENTULHO</h1>
        <p className="text-sm text-gray-500">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Latões ativos" value={latoesAtivosRes.count ?? 0} accent="text-status-ativo" />
        <StatCard
          label="Para recolher"
          value={paraRecolherRes.count ?? 0}
          accent="text-status-atrasado"
          hint="Aluguéis com recolhimento previsto até hoje"
        />
        <StatCard
          label="Recolhidos hoje"
          value={recolhidosHojeRes.count ?? 0}
          accent="text-status-recolhido"
        />
        <StatCard label="Clientes cadastrados" value={clientesRes.count ?? 0} />

        <StatCard label="A receber" value={formatBRL(aReceber)} accent="text-status-pendente" />
        <StatCard label="Recebido hoje" value={formatBRL(recebidoHoje)} accent="text-status-ativo" />
        <StatCard label="Despesas hoje" value={formatBRL(despesasHoje)} accent="text-status-atrasado" />
        <StatCard
          label="Saldo (total)"
          value={formatBRL(saldo)}
          accent={saldo >= 0 ? "text-status-ativo" : "text-status-atrasado"}
        />
      </div>
    </div>
  );
}
