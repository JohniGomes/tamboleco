import Image from "next/image";
import { SidebarNav } from "@/components/SidebarNav";
import { LogoutButton } from "@/components/LogoutButton";
import { ChatWidget } from "@/components/ChatWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 flex-col bg-tamboleco-950 md:flex">
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-9 w-9 items-center justify-center">
            <Image
              src="/mascote-tamboleco.png"
              alt="Mascote Tamboleco"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Tamboleco</p>
            <p className="text-xs text-gray-400">Mini Entulho</p>
          </div>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-tamboleco-950 px-4 py-3">
          <span className="text-sm font-semibold text-white">Sistema de Gestão</span>
          <LogoutButton />
        </header>
        <main className="flex-1 bg-background p-4 md:p-8">{children}</main>
      </div>

      <ChatWidget />
    </div>
  );
}
