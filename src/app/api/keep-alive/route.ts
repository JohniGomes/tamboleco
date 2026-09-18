import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Chamada automaticamente 1x por dia (ver vercel.json) só para gerar
// atividade real no projeto Supabase e evitar o pause automático do
// plano gratuito por inatividade (~7 dias sem requisições).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.from("clientes").select("id").limit(1);

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
    supabaseReachable: !error,
  });
}
