import type { TranslationKey } from './generated/keys';

export type TranslateFn = {
  (key: TranslationKey): string;
  (key: TranslationKey, params: Record<string, string | number>): string;
};

export type TranslationMap = Record<string, string>;
