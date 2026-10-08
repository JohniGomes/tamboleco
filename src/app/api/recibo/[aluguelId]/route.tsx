import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import { REGRAS } from "@/lib/whatsapp";
import type { AluguelComCliente } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#001B43",
  },
  via: {
    height: 385,
  },
  header: {
    marginBottom: 8,
    borderBottom: "1.5 solid #056CF2",
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#001B43",
  },
  subtitle: {
    fontSize: 8,
    color: "#03258C",
    marginTop: 1,
  },
  viaLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#056CF2",
    border: "1 solid #056CF2",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 3,
    color: "#022873",
  },
  row: {
    flexDirection: "row",
    marginBottom: 2,
  },
  label: {
    width: 130,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  rules: {
    marginTop: 2,
    lineHeight: 1.3,
    fontSize: 7,
    color: "#374151",
  },
  ruleItem: {
    marginBottom: 1,
  },
  signatureBlock: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    width: "45%",
    borderTop: "1 solid #001B43",
    paddingTop: 3,
    textAlign: "center",
    fontSize: 8,
  },
  cutLine: {
    borderTop: "1 dashed #9ca3af",
    marginVertical: 10,
    position: "relative",
  },
  cutLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: -6,
  },
});

function Via({ aluguel, label }: { aluguel: AluguelComCliente; label: string }) {
  return (
    <View style={styles.via}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tamboleco Mini Entulho</Text>
          <Text style={styles.subtitle}>Recibo / Comprovante de Entrega de Latão</Text>
          <Text style={styles.subtitle}>Emitido em {formatDateTime(new Date().toISOString())}</Text>
        </View>
        <Text style={styles.viaLabel}>{label}</Text>
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
        <Text style={styles.label}>Data de Entrega:</Text>
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
    </View>
  );
}

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
        <Via aluguel={aluguel} label="1ª VIA — CLIENTE" />

        <View style={styles.cutLine} />
        <Text style={styles.cutLabel}>✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>

        <Via aluguel={aluguel} label="2ª VIA — TAMBOLECO" />
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
