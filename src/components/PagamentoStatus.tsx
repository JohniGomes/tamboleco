import { LancamentoStatusSelect } from "@/components/LancamentoStatusSelect";

export function PagamentoStatus({ id, status }: { id: string; status: string }) {
  return <LancamentoStatusSelect id={id} status={status} className="w-28" />;
}
