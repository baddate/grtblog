import { describe, it, expect } from 'vitest';
import { createTranslateFn } from '$lib/i18n/server';
import type { TranslationMap } from '$lib/i18n/types';

const testMap: TranslationMap = {
  'common.save': '保存',
  'common.cancel': '取消',
  'web.test.interpolated': '你好 {name}，你有 {count} 条消息',
};

describe('createTranslateFn', () => {
  it('returns the translated string for a known key', () => {
    const t = createTranslateFn(testMap);
    expect(t('common.save')).toBe('保存');
  });

  it('interpolates params', () => {
    const t = createTranslateFn(testMap);
    expect(t('web.test.interpolated', { name: 'Mercas', count: 3 })).toBe(
      '你好 Mercas，你有 3 条消息'
    );
  });

  it('returns dev warning for missing key', () => {
    const t = createTranslateFn(testMap);
    // use a key absent from both testMap and the English fallback
    const result = t('common.missing_key');
    expect(result).toContain('common.missing_key');
  });

  it('handles missing interpolation param gracefully', () => {
    const t = createTranslateFn(testMap);
    expect(t('web.test.interpolated', { name: 'Mercas' })).toBe(
      '你好 Mercas，你有 {count} 条消息'
    );
  });
});
