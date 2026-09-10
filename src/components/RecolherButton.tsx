"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { marcarRecolhido } from "@/app/(app)/alugueis/actions";

export function RecolherButton({ aluguelId }: { aluguelId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => marcarRecolhido(aluguelId))}
    >
      {pending ? "Atualizando..." : "Marcar como Recolhido"}
    </Button>
  );
}
