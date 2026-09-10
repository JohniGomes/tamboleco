"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Cliente } from "@/lib/types";
import type { ClienteFormState } from "@/app/(app)/clientes/actions";

export function ClienteForm({
  cliente,
  action,
  submitLabel,
}: {
  cliente?: Cliente;
  action: (prev: ClienteFormState, formData: FormData) => Promise<ClienteFormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <Field label="Tipo de Pessoa" required>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipo_pessoa"
              value="fisica"
              defaultChecked={!cliente || cliente.tipo_pessoa === "fisica"}
            />
            Física
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipo_pessoa"
              value="juridica"
              defaultChecked={cliente?.tipo_pessoa === "juridica"}
            />
            Jurídica
          </label>
        </div>
      </Field>

      <Field label="Nome / Razão Social" required>
        <Input name="nome" required defaultValue={cliente?.nome} placeholder="Nome completo ou razão social" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Telefone">
          <Input name="telefone" defaultValue={cliente?.telefone ?? ""} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="CPF/CNPJ">
          <Input name="cpf_cnpj" defaultValue={cliente?.cpf_cnpj ?? ""} placeholder="000.000.000-00" />
        </Field>
      </div>

      <Field label="E-mail">
        <Input type="email" name="email" defaultValue={cliente?.email ?? ""} placeholder="cliente@exemplo.com" />
      </Field>

      <Field label="Endereço">
        <Input name="endereco" defaultValue={cliente?.endereco ?? ""} placeholder="Rua, número, bairro, cidade" />
      </Field>

      <Field label="Observações">
        <Textarea name="observacoes" rows={3} defaultValue={cliente?.observacoes ?? ""} />
      </Field>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
