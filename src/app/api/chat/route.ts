import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, type Content } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { toolDeclarations, executeTool } from "@/lib/gemini/tools";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

const SYSTEM_INSTRUCTION = `Você é a IA do Tamboleco Mini Entulho, assistente virtual dentro do sistema de gestão da empresa (aluguel de latões/caçambas de entulho).

Você pode:
1. Responder perguntas sobre o negócio consultando os dados reais (latões, aluguéis, clientes, financeiro) usando as ferramentas disponíveis.
2. Ajudar a cadastrar um novo aluguel a partir de uma descrição em texto (ex: "aluga 2 latões pro Carlos na Rua X amanhã, R$150 cada"), sempre montando um RASCUNHO com a ferramenta criar_rascunho_aluguel e pedindo confirmação — nunca diga que já salvou algo que não foi de fato confirmado.
3. Gerar resumos do dia/mês com base nos dados reais.
4. Sugerir mensagens de cobrança para clientes inadimplentes (use listar_inadimplentes para pegar dados reais antes de escrever a mensagem).
5. Tirar dúvidas sobre como usar o sistema (cadastro de clientes, aluguéis, latões, controle de caixa, pagamentos, geração de recibo em PDF, relatórios e busca/histórico — tudo fica no menu lateral).

Regras importantes:
- SEMPRE use as ferramentas para obter dados reais antes de responder perguntas sobre números, clientes ou aluguéis. Nunca invente valores.
- Formate valores em reais (R$) e datas como dd/mm/aaaa.
- Seja direto, objetivo e cordial. Respostas curtas, em português do Brasil.
- NUNCA use formatação markdown (nada de **negrito**, *itálico*, listas com "-" ou "#", etc). O chat exibe apenas texto puro. Para listas, use emojis ou "•" seguido de espaço, cada item em uma linha.
- A data de hoje é ${todayISO()}.
- Você está apenas conversando; quem efetivamente salva um novo aluguel no banco é a interface do sistema, depois que o usuário confirmar o rascunho que você preparar.`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { history, message } = (await req.json()) as { history: ChatMessage[]; message: string };

  const ai = new GoogleGenAI({ apiKey });

  const contents: Content[] = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  let draftAluguel: Record<string, unknown> | null = null;

  for (let turn = 0; turn < 5; turn++) {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const functionCalls = parts.filter((p) => p.functionCall).map((p) => p.functionCall!);

    if (!functionCalls.length) {
      const text = response.text ?? "Desculpe, não consegui gerar uma resposta agora.";
      return NextResponse.json({ reply: text, draftAluguel });
    }

    contents.push({ role: "model", parts });

    const functionResponseParts = [];
    for (const call of functionCalls) {
      const args = (call.args ?? {}) as Record<string, unknown>;
      const result = await executeTool(call.name!, args);
      if (call.name === "criar_rascunho_aluguel" && (result as { status?: string }).status === "rascunho_pronto") {
        draftAluguel = (result as { rascunho: Record<string, unknown> }).rascunho;
      }
      functionResponseParts.push({
        functionResponse: { name: call.name!, response: result as Record<string, unknown> },
      });
    }
    contents.push({ role: "user", parts: functionResponseParts });
  }

  return NextResponse.json({
    reply: "Consegui buscar as informações, mas tive dificuldade para montar a resposta final. Pode reformular a pergunta?",
    draftAluguel,
  });
}
