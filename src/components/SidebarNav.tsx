"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/alugueis", label: "Aluguéis" },
  { href: "/latoes", label: "Latões" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/pagamentos", label: "Pagamentos" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/busca", label: "Busca / Histórico" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-tamboleco-500 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
