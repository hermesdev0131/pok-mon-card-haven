"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PricePoint } from '@/types';

interface PriceChartProps {
  data: PricePoint[];
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">Sem dados de preço disponíveis para esta carta.</p>
      </div>
    );
  }

  const hasRaw = data.some(d => d.raw != null);
  const hasPsa9 = data.some(d => d.psa9 != null);
  const hasPsa10 = data.some(d => d.psa10 != null);
  const hasBgs95 = data.some(d => d.bgs95 != null);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: '12px',
          }}
          formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
        />
        <Legend />
        {hasRaw && <Line type="monotone" dataKey="raw" name="Raw" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} />}
        {hasPsa9 && <Line type="monotone" dataKey="psa9" name="PSA 9" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />}
        {hasPsa10 && <Line type="monotone" dataKey="psa10" name="PSA 10" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />}
        {hasBgs95 && <Line type="monotone" dataKey="bgs95" name="BGS 9.5" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}
