import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatBRL(value: number | null | undefined): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = value.length === 10 ? parseISO(`${value}T00:00:00`) : parseISO(value);
  if (!isValid(date)) return "-";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = parseISO(value);
  if (!isValid(date)) return "-";
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
