"use client";

import { useTransition } from "react";
import { updateLancamentoStatus } from "@/app/(app)/financeiro/actions";

const OPTIONS = [
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
];

export function LancamentoStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateLancamentoStatus(id, e.target.value))}
      className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-tamboleco-500 focus:outline-none"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
