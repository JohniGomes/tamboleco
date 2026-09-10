import { ClienteForm } from "@/components/ClienteForm";
import { createCliente } from "@/app/(app)/clientes/actions";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-tamboleco-950">Novo Cliente</h1>
      <ClienteForm action={createCliente} submitLabel="Salvar Cliente" />
    </div>
  );
}
