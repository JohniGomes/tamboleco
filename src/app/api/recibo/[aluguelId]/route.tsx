import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import type { AluguelComCliente } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#001B43",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #056CF2",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#001B43",
  },
  subtitle: {
    fontSize: 10,
    color: "#03258C",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 6,
    color: "#022873",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 160,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  rules: {
    marginTop: 4,
    lineHeight: 1.5,
  },
  ruleItem: {
    marginBottom: 4,
  },
  signatureBlock: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    width: "45%",
    borderTop: "1 solid #001B43",
    paddingTop: 4,
    textAlign: "center",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
  },
});

// NOTE: Placeholder rental terms - customize with the client's actual policy.
// This receipt is a rendered PDF only; it is not a legally binding e-signature.
// A future iteration could integrate a real e-signature provider (e.g. DocuSign, Clicksign).
const REGRAS = [
  "1. O latão deverá permanecer em local de fácil acesso para retirada, sem obstrução por veículos ou materiais.",
  "2. É de responsabilidade do cliente o descarte de resíduos permitidos, sendo vedado o descarte de materiais tóxicos, químicos ou perigosos.",
  "3. O recolhimento será agendado em até 2 (dois) dias úteis após solicitação, salvo prazo previamente combinado.",
  "4. Em caso de dano, extravio ou uso indevido do equipamento, será cobrada taxa de reposição/reparo conforme avaliação técnica.",
  "5. A permanência do latão além do prazo contratado poderá gerar cobrança adicional por dia excedente.",
  "6. O pagamento deverá ser realizado conforme forma e prazo acordados no ato da contratação.",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ aluguelId: string }> }
) {
  const { aluguelId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alugueis")
    .select("*, clientes(id, nome, telefone, cpf_cnpj, endereco)")
    .eq("id", aluguelId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Aluguel não encontrado." }, { status: 404 });
  }

  const aluguel = data as AluguelComCliente;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Tamboleco Mini Entulho</Text>
          <Text style={styles.subtitle}>Recibo de Locação de Latão para Entulho</Text>
          <Text style={styles.subtitle}>Emitido em {formatDateTime(new Date().toISOString())}</Text>
        </View>

        <Text style={styles.sectionTitle}>Dados do Cliente</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nome / Razão Social:</Text>
          <Text style={styles.value}>{aluguel.clientes?.nome ?? "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CPF/CNPJ:</Text>
          <Text style={styles.value}>{aluguel.clientes?.cpf_cnpj ?? "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Telefone:</Text>
          <Text style={styles.value}>{aluguel.clientes?.telefone ?? "-"}</Text>
        </View>

        <Text style={styles.sectionTitle}>Dados da Locação</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Endereço da Obra:</Text>
          <Text style={styles.value}>{aluguel.endereco_obra}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Data e Hora de Entrega:</Text>
          <Text style={styles.value}>{formatDate(aluguel.data_entrega)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Quantidade de Latões:</Text>
          <Text style={styles.value}>{aluguel.quantidade_latoes}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Recolhimento Previsto:</Text>
          <Text style={styles.value}>{formatDate(aluguel.data_prevista_recolhimento)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Valor do Serviço:</Text>
          <Text style={styles.value}>{formatBRL(aluguel.valor_total)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Forma de Pagamento:</Text>
          <Text style={styles.value}>{aluguel.forma_pagamento ?? "-"}</Text>
        </View>

        <Text style={styles.sectionTitle}>Regras da Locação</Text>
        <View style={styles.rules}>
          {REGRAS.map((r) => (
            <Text key={r} style={styles.ruleItem}>
              {r}
            </Text>
          ))}
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>Assinatura do Cliente</Text>
          <Text style={styles.signatureLine}>Assinatura do Responsável - Tamboleco</Text>
        </View>

        <Text style={styles.footer}>Tamboleco Mini Entulho</Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${aluguelId}.pdf"`,
    },
  });
}
