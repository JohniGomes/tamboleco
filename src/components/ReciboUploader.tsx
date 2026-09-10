"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { salvarReciboPath } from "@/app/(app)/alugueis/actions";

export function ReciboUploader({ aluguelId }: { aluguelId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const path = `${aluguelId}/${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("recibos").upload(path, file, {
        contentType: "application/pdf",
        upsert: true,
      });

      if (error) {
        setMessage(`Erro ao enviar: ${error.message}`);
        return;
      }

      await salvarReciboPath(aluguelId, path);
      setMessage("Recibo salvo com sucesso!");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button type="button" variant="secondary" disabled={loading} onClick={() => inputRef.current?.click()}>
        {loading ? "Enviando..." : "Salvar recibo assinado/escaneado"}
      </Button>
      {message && <p className="text-xs text-gray-500">{message}</p>}
    </div>
  );
}
