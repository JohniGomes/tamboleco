"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAluguel } from "@/app/(app)/alugueis/actions";

export function AluguelDeleteButton({ aluguelId, endereco }: { aluguelId: string; endereco: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Excluir o aluguel em "${endereco}"? O lançamento financeiro vinculado também será removido.`
          )
        )
          return;
        startTransition(async () => {
          await deleteAluguel(aluguelId);
          router.push("/alugueis");
        });
      }}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Excluindo..." : "Excluir Aluguel"}
    </button>
  );
}
