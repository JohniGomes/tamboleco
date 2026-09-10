"use client";

import { useTransition } from "react";
import { updateLataoStatus } from "@/app/(app)/latoes/actions";
import type { LataoStatus } from "@/lib/types";

const OPTIONS: { value: LataoStatus; label: string }[] = [
  { value: "disponivel", label: "Disponível" },
  { value: "em_obra", label: "Em Obra" },
  { value: "manutencao", label: "Manutenção" },
];

export function LataoStatusSelect({ id, status }: { id: string; status: LataoStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateLataoStatus(id, e.target.value))}
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
