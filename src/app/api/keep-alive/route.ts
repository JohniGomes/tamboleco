import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Chamada 1x/dia pelo Vercel Cron (ver vercel.json) para gerar atividade real
// no Supabase gratuito e evitar o pause por inatividade. Responde 503 quando o
// banco nao responde, para a falha aparecer nos logs de cron da Vercel.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const pingedAt = new Date().toISOString();

  const { data: lastPing, error: rpcError } = await supabase.rpc("keep_alive_ping");
  if (!rpcError) {
    return NextResponse.json({ ok: true, pingedAt, method: "rpc-write", lastPing });
  }

  // Funcao ainda nao criada (migration 0002): cai para uma leitura simples.
  const { error: selectError } = await supabase.from("clientes").select("id").limit(1);
  if (!selectError) {
    return NextResponse.json({
      ok: true,
      pingedAt,
      method: "select-fallback",
      warning: "Rode supabase/migrations/0002_keep_alive.sql para ativar o ping com escrita.",
    });
  }

  return NextResponse.json(
    { ok: false, pingedAt, error: rpcError.message, fallbackError: selectError.message },
    { status: 503 }
  );
}
