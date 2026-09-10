"use client";

import { useActionState, useRef, useEffect } from "react";
import { createLatao, type LataoFormState } from "@/app/(app)/latoes/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function NovoLataoForm() {
  const [state, formAction, pending] = useActionState<LataoFormState, FormData>(createLatao, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Número do Latão</label>
        <Input name="numero" required placeholder="Ex: 001" className="w-32" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Observações</label>
        <Input name="observacoes" placeholder="Opcional" className="w-64" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "+ Novo Latão"}
      </Button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
