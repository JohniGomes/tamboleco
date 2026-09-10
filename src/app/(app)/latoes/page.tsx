import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { LataoStatusBadge } from "@/components/ui/Badge";
import { LataoStatusSelect } from "@/components/LataoStatusSelect";
import { NovoLataoForm } from "@/components/NovoLataoForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteLatao } from "./actions";
import type { Latao } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LatoesPage() {
  const supabase = await createClient();
  const { data: latoes } = await supabase.from("latoes").select("*").order("numero");

  const list = (latoes as Latao[] | null) ?? [];
  const total = list.length;
  const disponivel = list.filter((l) => l.status === "disponivel").length;
  const emObra = list.filter((l) => l.status === "em_obra").length;
  const manutencao = list.filter((l) => l.status === "manutencao").length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-tamboleco-950">Latões</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={total} />
        <StatCard label="Disponíveis" value={disponivel} accent="text-status-ativo" />
        <StatCard label="Em Obra" value={emObra} accent="text-status-recolhido" />
        <StatCard label="Manutenção" value={manutencao} accent="text-status-pendente" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <NovoLataoForm />
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Número</Th>
            <Th>Status</Th>
            <Th>Observações</Th>
            <Th>Alterar Status</Th>
            <Th></Th>
          </tr>
        </Thead>
        <tbody>
          {list.map((l) => (
            <Tr key={l.id}>
              <Td className="font-medium text-tamboleco-950">{l.numero}</Td>
              <Td>
                <LataoStatusBadge status={l.status} />
              </Td>
              <Td>{l.observacoes ?? "-"}</Td>
              <Td>
                <LataoStatusSelect id={l.id} status={l.status} />
              </Td>
              <Td>
                <DeleteButton
                  onDelete={deleteLatao.bind(null, l.id)}
                  confirmMessage={`Excluir o latão "${l.numero}"?`}
                />
              </Td>
            </Tr>
          ))}
          {!list.length && (
            <Tr>
              <Td colSpan={5} className="text-center text-gray-400">
                Nenhum latão cadastrado.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
