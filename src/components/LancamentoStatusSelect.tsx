"use client";

import { useTransition } from "react";
import clsx from "clsx";
import { updateLancamentoStatus } from "@/app/(app)/financeiro/actions";

const OPTIONS = [
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
];

const TONES: Record<string, string> = {
  pago: "border-green-300 bg-green-100 text-green-700",
  pendente: "border-yellow-300 bg-yellow-100 text-yellow-800",
  atrasado: "border-red-300 bg-red-100 text-red-700",
};

export function LancamentoStatusSelect({
  id,
  status,
  className,
}: {
  id: string;
  status: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateLancamentoStatus(id, e.target.value))}
      className={clsx(
        "rounded-lg border px-2 py-1 text-xs font-semibold focus:border-tamboleco-500 focus:outline-none",
        TONES[status] ?? "border-gray-300 bg-white text-gray-700",
        className
      )}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
