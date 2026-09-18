"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatBRL, formatDate } from "@/lib/format";

const CAPACIDADES = [
  "Consultar dados (latões, aluguéis, clientes, financeiro)",
  "Cadastrar um aluguel a partir de uma descrição em texto",
  "Gerar um resumo do dia ou do mês",
  "Sugerir mensagens de cobrança para inadimplentes",
  "Tirar dúvidas sobre como usar o sistema",
];

const SAUDACAO = `Oi! Eu sou a IA do Tamboleco 👋 O que você deseja hoje? Eu posso:\n\n${CAPACIDADES.map(
  (c) => `• ${c}`
).join("\n")}\n\nÉ só me perguntar, por exemplo: "quantos latões estão atrasados?" ou "aluga 2 latões pro João na Rua das Flores amanhã, R$150 cada".`;

function limparMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^-\s+/gm, "• ");
}

interface AluguelDraft {
  cliente_id: string;
  cliente_nome: string;
  endereco_obra: string;
  quantidade_latoes: number;
  valor_unitario: number | null;
  valor_total: number | null;
  data_entrega: string;
  data_prevista_recolhimento: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
}

interface Message {
  role: "user" | "model";
  text: string;
  draft?: AluguelDraft;
  draftHandled?: boolean;
}

export function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "model", text: SAUDACAO }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newMessages.slice(0, -1).map((m) => ({ role: m.role, text: m.text })),
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "model", text: data.error ?? "Erro ao falar com a IA." }]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "model", text: limparMarkdown(data.reply), draft: data.draftAluguel ?? undefined },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "model", text: "Não consegui me conectar. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmarRascunho(index: number, draft: AluguelDraft) {
    setLoading(true);
    try {
      const res = await fetch("/api/aluguel-quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, draftHandled: true } : m))
      );
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "model", text: `Não consegui salvar: ${data.error}` }]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `Pronto! Aluguel criado para ${draft.cliente_nome}. ✅` },
      ]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function cancelarRascunho(index: number) {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, draftHandled: true } : m)));
    setMessages((prev) => [...prev, { role: "model", text: "Sem problemas, não salvei nada." }]);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-tamboleco-500 text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Abrir chat com a IA do Tamboleco"
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/mascote-tamboleco.png" alt="" className="h-9 w-9 object-contain" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[32rem] w-[22rem] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 bg-tamboleco-950 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mascote-tamboleco.png" alt="" className="h-7 w-7 object-contain" />
            <div>
              <p className="text-sm font-bold text-white">Chat Tamboleco</p>
              <p className="text-xs text-gray-300">Assistente com IA</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-tamboleco-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.text}
                  {m.draft && !m.draftHandled && (
                    <div className="mt-3 space-y-1 rounded-xl border border-tamboleco-500/30 bg-white p-3 text-xs text-gray-700">
                      <p><span className="font-semibold">Cliente:</span> {m.draft.cliente_nome}</p>
                      <p><span className="font-semibold">Endereço:</span> {m.draft.endereco_obra}</p>
                      <p><span className="font-semibold">Qtd. latões:</span> {m.draft.quantidade_latoes}</p>
                      {m.draft.valor_total != null && (
                        <p><span className="font-semibold">Valor total:</span> {formatBRL(m.draft.valor_total)}</p>
                      )}
                      <p><span className="font-semibold">Entrega:</span> {formatDate(m.draft.data_entrega)}</p>
                      {m.draft.data_prevista_recolhimento && (
                        <p><span className="font-semibold">Recolhimento previsto:</span> {formatDate(m.draft.data_prevista_recolhimento)}</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button
                          disabled={loading}
                          onClick={() => confirmarRascunho(i, m.draft!)}
                          className="rounded-lg bg-tamboleco-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-tamboleco-800 disabled:opacity-50"
                        >
                          Confirmar e salvar
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => cancelarRascunho(i)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-400">Digitando...</div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-200 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo..."
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tamboleco-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-tamboleco-500 px-3 py-2 text-sm font-medium text-white hover:bg-tamboleco-800 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
}
