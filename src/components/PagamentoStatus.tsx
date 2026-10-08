import { FinanceiroStatusBadge } from "@/components/ui/Badge";
import { LancamentoStatusSelect } from "@/components/LancamentoStatusSelect";

export function PagamentoStatus({ id, status }: { id: string; status: string }) {
  return (
    <div className="grid w-52 grid-cols-[5.5rem_1fr] items-center gap-2">
      <FinanceiroStatusBadge status={status} className="w-full justify-center" />
      <LancamentoStatusSelect id={id} status={status} className="w-full" />
    </div>
  );
}
