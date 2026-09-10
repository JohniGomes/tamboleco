"use client";

import { useActionState, useRef, useEffect } from "react";
import { createLancamento, type FinanceiroFormState } from "@/app/(app)/financeiro/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CATEGORIA_LABELS, FORMAS_PAGAMENTO } from "@/lib/types";
import type { Cliente } from "@/lib/types";
import { todayISO } from "@/lib/format";

export function LancamentoForm({ clientes }: { clientes: Pick<Cliente, "id" | "nome">[] }) {
  const [state, formAction, pending] = useActionState<FinanceiroFormState, FormData>(
    createLancamento,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Descrição" required>
        <Input name="descricao" required />
      </Field>
      <Field label="Categoria" required>
        <Select name="categoria" required defaultValue="">
          <option value="" disabled>
            Selecione
          </option>
          {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tipo" required>
        <Select name="tipo" required defaultValue="entrada">
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </Select>
      </Field>
      <Field label="Valor (R$)" required>
        <Input type="number" step="0.01" min={0} name="valor" required />
      </Field>
      <Field label="Data">
        <Input type="date" name="data" defaultValue={todayISO()} />
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue="pendente">
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </Select>
      </Field>
      <Field label="Forma de Pagamento">
        <Select name="forma_pagamento" defaultValue="">
          <option value="">Selecione</option>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Cliente (opcional)">
        <Select name="cliente_id" defaultValue="">
          <option value="">Nenhum</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2 lg:col-span-3">
        <Field label="Observações">
          <Textarea name="observacoes" rows={2} />
        </Field>
      </div>

      {state.error && (
        <p className="sm:col-span-2 lg:col-span-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "+ Novo Lançamento"}
        </Button>
      </div>
    </form>
  );
}
