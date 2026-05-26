// Per-company grade scales. Each company has its own valid set of grades,
// half-grade increments, and Pristine availability. Used by:
// - /sell listing form: Grade dropdown shows only the selected company's options
// - /card/[id] Histórico de Vendas tab: Grade filter dynamically updates by company

// Canonical grade representation. All grades in the array are numeric.
// Pristine is tracked separately via `hasPristine` because the existing
// `listings.pristine` boolean already represents it in the database.
export interface CompanyGradeScale {
  grades: number[]; // ordered high-to-low for natural dropdown display
  hasPristine: boolean;
}

// Helpers to build common grade scales without repetitive arrays.
const wholeGrades1to10 = (): number[] => [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const halfGrades1to10 = (): number[] => {
  const out: number[] = [];
  for (let g = 10; g >= 1; g -= 0.5) out.push(g);
  return out;
};

// Per-company scales per Caique's spec (2026-05-17).
// Pristine is appended at the top of the dropdown when the company supports it.
export const GRADE_SCALES: Record<string, CompanyGradeScale> = {
  // PSA: whole numbers 1-10, no Pristine
  PSA: { grades: wholeGrades1to10(), hasPristine: false },

  // CGC: half-grade increments 1-10 + Pristine
  CGC: { grades: halfGrades1to10(), hasPristine: true },

  // Beckett: whole 1-10 + 9.5 + Pristine
  Beckett: {
    grades: [10, 9.5, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    hasPristine: true,
  },

  // TAG: half-grade increments 1-10 + Pristine
  TAG: { grades: halfGrades1to10(), hasPristine: true },

  // AGS: 1, 1.5, then whole 2-10 + Pristine
  AGS: {
    grades: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1.5, 1],
    hasPristine: true,
  },

  // ARS: whole 1-10 + Pristine
  ARS: { grades: wholeGrades1to10(), hasPristine: true },

  // ManaFix: half-grade increments 1-10 + Pristine
  ManaFix: { grades: halfGrades1to10(), hasPristine: true },

  // GBA: whole 1-10, no Pristine
  GBA: { grades: wholeGrades1to10(), hasPristine: false },

  // Capy: whole 1-10, no Pristine
  Capy: { grades: wholeGrades1to10(), hasPristine: false },

  // Taverna: half-grade increments 1-10, no Pristine
  Taverna: { grades: halfGrades1to10(), hasPristine: false },
};

// Fallback for any unrecognized/legacy company (e.g. OTHER).
const FALLBACK_SCALE: CompanyGradeScale = {
  grades: wholeGrades1to10(),
  hasPristine: false,
};

/** Get the grade scale for a given company code. Falls back to whole 1-10 if unknown. */
export function getGradeScale(company: string | null | undefined): CompanyGradeScale {
  if (!company) return FALLBACK_SCALE;
  return GRADE_SCALES[company] ?? FALLBACK_SCALE;
}

/** Format a numeric grade for display (e.g. 9.5 stays "9.5", 10 stays "10"). */
export function formatGrade(grade: number): string {
  return Number.isInteger(grade) ? String(grade) : grade.toString();
}

/** Format any grade value (numeric or 'pristine') with the company prefix for display. */
export function formatGradeBadge(company: string, grade: number, pristine: boolean): string {
  if (pristine) return `${company} Pristine`;
  return `${company} ${formatGrade(grade)}`;
}
