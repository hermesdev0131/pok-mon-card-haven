import type { CardLanguage, CardLanguageGroup } from '@/types';

export const LANGUAGE_GROUP_LABELS: Record<CardLanguageGroup, string> = {
  INT: 'Internacional',
  JP: 'Japonês',
  ZH: 'Chinês',
  KR: 'Coreano',
};

export const CATALOG_LANGUAGE_LABELS: Record<CardLanguage, string> = {
  PT: 'Português',
  EN: 'Inglês',
  JP: 'Japonês',
  ZH: 'Chinês',
};

// Nacional: PT speakers are the primary audience, so PT comes first.
// Internacional/combined: EN is the dominant grading language, so EN comes first.
export const CATALOG_LANGUAGES_NACIONAL: CardLanguage[] = ['PT', 'EN', 'JP', 'ZH'];
export const CATALOG_LANGUAGES_INTERNACIONAL: CardLanguage[] = ['EN', 'JP', 'ZH', 'PT'];

export const ACTIVE_LANGUAGE_GROUPS: CardLanguageGroup[] = ['INT', 'JP', 'ZH'];

export function languageGroupLabel(group: CardLanguageGroup): string {
  return LANGUAGE_GROUP_LABELS[group] ?? group;
}
