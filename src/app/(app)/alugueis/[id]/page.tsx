import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { AluguelStatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { RecolherButton } from "@/components/RecolherButton";
import { ReciboUploader } from "@/components/ReciboUploader";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import type { AluguelComCliente } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AluguelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("alugueis")
    .select("*, clientes(id, nome, telefone, cpf_cnpj, endereco)")
    .eq("id", id)
    .single();

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

      <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Data de Entrega</p>
          <p className="font-medium">{formatDate(aluguel.data_entrega)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Recolhimento Previsto</p>
          <p className="font-medium">{formatDate(aluguel.data_prevista_recolhimento)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Recolhimento Efetivo</p>
          <p className="font-medium">{formatDate(aluguel.data_efetiva_recolhimento)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Quantidade de Latões</p>
          <p className="font-medium">{aluguel.quantidade_latoes}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Valor Unitário</p>
          <p className="font-medium">{formatBRL(aluguel.valor_unitario)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Valor Total</p>
          <p className="font-medium">{formatBRL(aluguel.valor_total)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Forma de Pagamento</p>
          <p className="font-medium">{aluguel.forma_pagamento ?? "-"}</p>
        </div>
        {aluguel.observacoes && (
          <div className="sm:col-span-3">
            <p className="text-xs text-gray-500">Observações</p>
            <p className="font-medium">{aluguel.observacoes}</p>
          </div>
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
