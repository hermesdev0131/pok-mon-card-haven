import type { GradeCompany } from '@/types/database';

// Brazilian grading companies
export const NACIONAL_COMPANIES: GradeCompany[] = ['ManaFix', 'GBA', 'Capy', 'Taverna'];

// International grading companies
export const INTERNACIONAL_COMPANIES: GradeCompany[] = ['PSA', 'CGC', 'TAG', 'ARS', 'Beckett', 'AGS', 'OTHER'];

export type GradingGroup = 'nacional' | 'internacional';

export function getCompaniesForGroup(group: GradingGroup): GradeCompany[] {
  return group === 'nacional' ? NACIONAL_COMPANIES : INTERNACIONAL_COMPANIES;
}

export function isNacionalCompany(company: GradeCompany): boolean {
  return NACIONAL_COMPANIES.includes(company);
}
