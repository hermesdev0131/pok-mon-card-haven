import type { CardLanguageGroup } from '@/types';

// Portuguese display labels for each card catalog language group.
export const LANGUAGE_GROUP_LABELS: Record<CardLanguageGroup, string> = {
  INT: 'Internacional',
  JP: 'Japonês',
  ZH: 'Chinês',
  KR: 'Coreano',
};

// Language groups that currently have cards in the catalog and should be
// offered to buyers. Korean is deferred (no image source yet) — add 'KR'
// here once Korean cards are imported and nothing else needs to change.
export const ACTIVE_LANGUAGE_GROUPS: CardLanguageGroup[] = ['INT', 'JP', 'ZH'];

export function languageGroupLabel(group: CardLanguageGroup): string {
  return LANGUAGE_GROUP_LABELS[group] ?? group;
}
