"use client";

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FlagIcon } from '@/components/FlagIcon';
import { formatPrice } from '@/lib/utils';
import type { PricePoint, CardLanguage } from '@/types';

interface PriceChartProps {
  data: PricePoint[];
}

// Distinct colors for each series line
const COLORS = [
  'hsl(var(--accent))',         // green (accent)
  'hsl(199, 89%, 60%)',        // cyan
  'hsl(330, 80%, 60%)',        // pink
  'hsl(45, 90%, 55%)',         // gold
  'hsl(270, 70%, 60%)',        // purple
  'hsl(15, 85%, 55%)',         // orange
  'hsl(170, 70%, 50%)',        // teal
  'hsl(220, 70%, 60%)',        // blue
  'hsl(0, 70%, 55%)',          // red
  'hsl(var(--muted-foreground))', // gray (for NM)
];

const LANGUAGE_LABELS: Record<CardLanguage, string> = {
  PT: 'Português',
  EN: 'Inglês',
  JP: '日本語',
  ZH: '中文',
};

// 'BL' is the sentinel value for the Black Label / Pristine grade pill.
// Pristine series (CGC Pristine 10, BGS Black Label, etc.) are controlled by
// the BL toggle — separate from the regular numeric grade 10 toggle.
type GradeKey = number | 'BL';

function getSeriesKey(company: string, grade: number, pristine: boolean): string {
  if (company === 'NM') return 'NM';
  if (pristine) return `${company} Pristine ${grade}`;
  return `${company} ${grade}`;
}

export function PriceChart({ data }: PriceChartProps) {
  // Discover available languages
  const availableLanguages = useMemo(() => {
    const set = new Set<CardLanguage>();
    data.forEach(d => set.add(d.language));
    const order: CardLanguage[] = ['PT', 'EN', 'JP'];
    return order.filter(lang => set.has(lang));
  }, [data]);

  const [selectedLanguage, setSelectedLanguage] = useState<CardLanguage>('PT');

  const filteredData = useMemo(() => {
    return data.filter(d => d.language === selectedLanguage);
  }, [data, selectedLanguage]);

  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach(d => set.add(d.company));
    return Array.from(set).sort((a, b) => {
      if (a === 'NM') return -1;
      if (b === 'NM') return 1;
      return a.localeCompare(b);
    });
  }, [filteredData]);

  // Numeric grades come only from non-pristine entries.
  // Pristine / Black Label entries are represented by the 'BL' sentinel.
  // This means grade 10 pill controls PSA 10 / CGC 10, while BL pill
  // controls CGC Pristine 10 / BGS Black Label, etc.
  // Only whole-integer grades are shown as filter pills (half-grades like 9.5
  // are filtered out of the visualization to keep the chart readable).
  const availableGrades = useMemo(() => {
    const numSet = new Set<number>();
    let hasPristine = false;
    filteredData.forEach(d => {
      if (d.grade > 0 && !d.pristine && Number.isInteger(d.grade)) numSet.add(d.grade);
      if (d.pristine) hasPristine = true;
    });
    const grades: GradeKey[] = Array.from(numSet).sort((a, b) => a - b);
    if (hasPristine) grades.push('BL');
    return grades;
  }, [filteredData]);

  const allSeries = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach(d => {
      // Exclude half-grade series from the chart entirely
      if (d.grade > 0 && !d.pristine && !Number.isInteger(d.grade)) return;
      set.add(getSeriesKey(d.company, d.grade, d.pristine));
    });
    return Array.from(set);
  }, [filteredData]);

  // Default state: only grade 10 selected (or the highest available grade if 10
  // isn't present), all companies enabled so users see all graders with sales
  // for that grade. Users can then add/remove grades to refine.
  const defaultGrades = useMemo<Set<GradeKey>>(() => {
    const numericGrades = availableGrades.filter((g): g is number => typeof g === 'number');
    if (numericGrades.includes(10)) return new Set<GradeKey>([10]);
    if (numericGrades.length > 0) return new Set<GradeKey>([Math.max(...numericGrades)]);
    if (availableGrades.includes('BL')) return new Set<GradeKey>(['BL']);
    return new Set<GradeKey>();
  }, [availableGrades]);

  const [enabledCompanies, setEnabledCompanies] = useState<Set<string>>(new Set(availableCompanies));
  const [enabledGrades, setEnabledGrades] = useState<Set<GradeKey>>(defaultGrades);

  const toggleCompany = (company: string) => {
    setEnabledCompanies(prev => {
      const next = new Set(prev);
      if (next.has(company)) next.delete(company);
      else next.add(company);
      return next;
    });
  };

  const toggleGrade = (grade: GradeKey) => {
    setEnabledGrades(prev => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const handleLanguageChange = (lang: CardLanguage) => {
    setSelectedLanguage(lang);
    const langData = data.filter(d => d.language === lang);
    const companies = new Set<string>();
    const wholeGrades: number[] = [];
    let hasPristine = false;
    langData.forEach(d => {
      companies.add(d.company);
      if (d.grade > 0 && !d.pristine && Number.isInteger(d.grade) && !wholeGrades.includes(d.grade)) {
        wholeGrades.push(d.grade);
      }
      if (d.pristine) hasPristine = true;
    });
    // Default to grade 10 only (or highest available whole grade if 10 is absent)
    const grades = new Set<GradeKey>();
    if (wholeGrades.includes(10)) grades.add(10);
    else if (wholeGrades.length > 0) grades.add(Math.max(...wholeGrades));
    else if (hasPristine) grades.add('BL');
    setEnabledCompanies(companies);
    setEnabledGrades(grades);
  };

  // Filter series based on toggles.
  // Pristine series (key contains 'Pristine') are gated by the 'BL' grade toggle.
  // All other graded series are gated by their numeric grade toggle.
  const activeSeries = useMemo(() => {
    return allSeries.filter(key => {
      if (key === 'NM') {
        return enabledCompanies.has('NM') && enabledGrades.has(0);
      }
      const parts = key.split(' ');
      const grade = Number(parts.pop());
      const isPristine = parts[parts.length - 1] === 'Pristine';
      if (isPristine) parts.pop();
      const company = parts.join(' ');
      return enabledCompanies.has(company) && enabledGrades.has(isPristine ? 'BL' : grade);
    });
  }, [allSeries, enabledCompanies, enabledGrades]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allSeries.forEach((key, i) => {
      if (key === 'NM') {
        map[key] = COLORS[COLORS.length - 1];
      } else {
        map[key] = COLORS[i % (COLORS.length - 1)];
      }
    });
    return map;
  }, [allSeries]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {};
    filteredData.forEach(d => {
      if (!byMonth[d.month]) byMonth[d.month] = {};
      const key = getSeriesKey(d.company, d.grade, d.pristine);
      byMonth[d.month][key] = d.avgPrice;
      byMonth[d.month][`${key}_count`] = d.salesCount;
    });
    const months = Array.from(new Set(filteredData.map(d => d.month)));
    return months.map(month => ({ month, ...byMonth[month] }));
  }, [filteredData]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">Sem dados de preço disponíveis para esta carta.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="space-y-2">
        {/* Language pills */}
        {availableLanguages.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider self-center mr-1">Idioma:</span>
            {availableLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                  selectedLanguage === lang
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-card border-border text-muted-foreground hover:text-muted-foreground/70'
                }`}
              >
                <FlagIcon code={lang} className="w-4 h-3" />
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        )}

        {/* Company pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider self-center mr-1">Grading:</span>
          {availableCompanies.map(company => (
            <button
              key={company}
              onClick={() => toggleCompany(company)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                enabledCompanies.has(company)
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {company}
            </button>
          ))}
        </div>

        {/* Grade pills — numeric grades + BL (Black Label / Pristine) */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider self-center mr-1">Nota:</span>
          {availableCompanies.includes('NM') && (
            <button
              onClick={() => toggleGrade(0)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                enabledGrades.has(0)
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              NM
            </button>
          )}
          {availableGrades.map(grade => (
            <button
              key={grade}
              onClick={() => toggleGrade(grade)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                enabledGrades.has(grade)
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {grade === 'BL' ? 'Black Label' : grade}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {activeSeries.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Selecione ao menos uma grading e nota para ver o gráfico.</p>
        </div>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis width={90} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$ ${formatPrice(v)}`} />
              <Tooltip
                contentStyle={{
                  background: 'hsla(220, 10%, 10%, 0.9)',
                  border: '1px solid hsla(0, 0%, 100%, 0.06)',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  backdropFilter: 'blur(12px)',
                  padding: '8px 12px',
                }}
                formatter={(value, name, props) => {
                  const count = props.payload[`${name}_count`];
                  const priceStr = `R$ ${formatPrice(Number(value))}`;
                  return [count != null ? `${priceStr} (${count} ${count === 1 ? 'venda' : 'vendas'})` : priceStr, name];
                }}
                itemStyle={{ padding: '2px 0' }}
              />
              {activeSeries.map(key => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={colorMap[key]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3">
            {activeSeries.map(key => (
              <span key={key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: colorMap[key] }} />
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
