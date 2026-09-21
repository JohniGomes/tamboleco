import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { AluguelStatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { RecolherButton } from "@/components/RecolherButton";
import { ReciboUploader } from "@/components/ReciboUploader";
import { AluguelDeleteButton } from "@/components/AluguelDeleteButton";
import { AluguelForm } from "@/components/AluguelForm";
import { updateAluguel } from "@/app/(app)/alugueis/actions";
import { formatDate, todayISO } from "@/lib/format";
import type { AluguelComCliente } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AluguelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { data: clientes }] = await Promise.all([
    supabase
      .from("alugueis")
      .select("*, clientes(id, nome, telefone, cpf_cnpj, endereco)")
      .eq("id", id)
      .single(),
    supabase.from("clientes").select("id, nome, cpf_cnpj").order("nome"),
  ]);

  if (!data) return notFound();
  const aluguel = data as AluguelComCliente;

  const effectiveStatus =
    aluguel.status === "ativo" &&
    aluguel.data_prevista_recolhimento &&
    aluguel.data_prevista_recolhimento < todayISO()
      ? "atrasado"
      : aluguel.status;

  let reciboUrl: string | null = null;
  if (aluguel.recibo_pdf_path) {
    const { data: signed } = await supabase.storage
      .from("recibos")
      .createSignedUrl(aluguel.recibo_pdf_path, 60 * 60);
    reciboUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-tamboleco-950">{aluguel.endereco_obra}</h1>
          <p className="text-sm text-gray-500">
            Cliente:{" "}
            {aluguel.clientes ? (
              <Link href={`/clientes/${aluguel.clientes.id}`} className="text-tamboleco-500 hover:underline">
                {aluguel.clientes.nome}
              </Link>
            ) : (
              "-"
            )}
          </p>
        </div>
        <AluguelStatusBadge status={effectiveStatus} />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Dados do Aluguel
        </h2>
        <AluguelForm
          clientes={clientes ?? []}
          aluguel={aluguel}
          action={updateAluguel.bind(null, id)}
          submitLabel="Salvar Alterações"
        />
        {aluguel.data_efetiva_recolhimento && (
          <p className="mt-4 text-xs text-gray-500">
            Recolhimento efetivo em {formatDate(aluguel.data_efetiva_recolhimento)}.
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        {aluguel.status === "ativo" && <RecolherButton aluguelId={aluguel.id} />}
        <a
          href={`/api/recibo/${aluguel.id}`}
          target="_blank"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-tamboleco-500 px-4 py-2 text-sm font-medium text-white hover:bg-tamboleco-800"
        >
          Gerar Recibo PDF
        </a>
        <LinkButton href={`/alugueis`} variant="secondary">
          Voltar
        </LinkButton>
        <AluguelDeleteButton aluguelId={aluguel.id} endereco={aluguel.endereco_obra} />
      </div>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Recibo / Comprovante
        </h2>
        {reciboUrl ? (
          <a href={reciboUrl} target="_blank" className="text-sm text-tamboleco-500 hover:underline">
            Ver recibo salvo
          </a>
        ) : (
          <p className="text-sm text-gray-400">Nenhum recibo salvo ainda.</p>
        )}
        <ReciboUploader aluguelId={aluguel.id} />
      </Card>
    </div>
  );
}
