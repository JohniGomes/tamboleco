"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  mes: string;
  entradas: number;
  saidas: number;
}

export function RelatorioChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) =>
            Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          }
        />
        <Legend />
        <Bar dataKey="entradas" name="Receita" fill="#056CF2" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saidas" name="Despesa" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
