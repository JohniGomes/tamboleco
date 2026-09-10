import clsx from "clsx";

type BadgeTone = "green" | "blue" | "yellow" | "red" | "gray";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-sky-100 text-sky-700",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-700",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[tone]
      )}
    >
      {children}
    </span>
  );
}

export function AluguelStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    ativo: { tone: "green", label: "Ativo" },
    recolhido: { tone: "blue", label: "Recolhido" },
    atrasado: { tone: "red", label: "Atrasado" },
  };
  const item = map[status] ?? { tone: "gray", label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function FinanceiroStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    pago: { tone: "green", label: "Pago" },
    pendente: { tone: "yellow", label: "Pendente" },
    atrasado: { tone: "red", label: "Atrasado" },
  };
  const item = map[status] ?? { tone: "gray", label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function LataoStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    disponivel: { tone: "green", label: "Disponível" },
    em_obra: { tone: "blue", label: "Em Obra" },
    manutencao: { tone: "yellow", label: "Manutenção" },
  };
  const item = map[status] ?? { tone: "gray", label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
