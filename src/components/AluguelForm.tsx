"use client";

import { useActionState, useMemo, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FORMAS_PAGAMENTO } from "@/lib/types";
import type { Aluguel, Cliente } from "@/lib/types";

interface FormState {
  error?: string;
}

export function AluguelForm({
  clientes,
  aluguel,
  action,
  submitLabel,
}: {
  clientes: Pick<Cliente, "id" | "nome" | "cpf_cnpj">[];
  aluguel?: Aluguel;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [quantidade, setQuantidade] = useState(aluguel?.quantidade_latoes ?? 1);
  const [valorUnitario, setValorUnitario] = useState(aluguel?.valor_unitario ?? 0);
  const [valorTotal, setValorTotal] = useState(aluguel?.valor_total ?? 0);
  const [totalEditadoManualmente, setTotalEditadoManualmente] = useState(false);

  const clientesFiltrados = useMemo(() => {
    if (!clienteFiltro) return clientes;
    const termo = clienteFiltro.toLowerCase();
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(termo) || (c.cpf_cnpj ?? "").includes(termo)
    );
  }, [clientes, clienteFiltro]);

  function recalcTotal(qtd: number, unit: number) {
    if (!totalEditadoManualmente) setValorTotal(Number((qtd * unit).toFixed(2)));
  }

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <Field label="Cliente" required>
        <Input
          placeholder="Buscar cliente por nome ou CPF/CNPJ..."
          value={clienteFiltro}
          onChange={(e) => setClienteFiltro(e.target.value)}
          className="mb-2"
        />
        <Select name="cliente_id" required defaultValue={aluguel?.cliente_id ?? ""}>
          <option value="" disabled>
            Selecione um cliente
          </option>
          {clientesFiltrados.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} {c.cpf_cnpj ? `- ${c.cpf_cnpj}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Endereço da Obra" required>
        <Input name="endereco_obra" required defaultValue={aluguel?.endereco_obra} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data de Entrega" required>
          <Input type="date" name="data_entrega" required defaultValue={aluguel?.data_entrega} />
        </Field>
        <Field label="Data Prevista de Recolhimento">
          <Input
            type="date"
            name="data_prevista_recolhimento"
            defaultValue={aluguel?.data_prevista_recolhimento ?? ""}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Quantidade de Latões" required>
          <Input
            type="number"
            min={1}
            name="quantidade_latoes"
            required
            value={quantidade}
            onChange={(e) => {
              const qtd = Number(e.target.value) || 1;
              setQuantidade(qtd);
              recalcTotal(qtd, valorUnitario);
            }}
          />
        </Field>
        <Field label="Valor Unitário (R$)">
          <Input
            type="number"
            min={0}
            step="0.01"
            name="valor_unitario"
            value={valorUnitario}
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setValorUnitario(v);
              recalcTotal(quantidade, v);
            }}
          />
        </Field>
        <Field label="Valor Total (R$)">
          <Input
            type="number"
            min={0}
            step="0.01"
            name="valor_total"
            value={valorTotal}
            onChange={(e) => {
              setTotalEditadoManualmente(true);
              setValorTotal(Number(e.target.value) || 0);
            }}
          />
        </Field>
      </div>

      <Field label="Forma de Pagamento">
        <Select name="forma_pagamento" defaultValue={aluguel?.forma_pagamento ?? ""}>
          <option value="">Selecione</option>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Observações">
        <Textarea name="observacoes" rows={3} defaultValue={aluguel?.observacoes ?? ""} />
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
