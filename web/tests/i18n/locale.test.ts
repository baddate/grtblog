import { describe, it, expect } from 'vitest';
import { parseAcceptLanguage, buildSwitchUrl } from '$lib/i18n/locale';

describe('parseAcceptLanguage', () => {
  it('extracts primary language from simple header', () => {
    expect(parseAcceptLanguage('en-US,en;q=0.9')).toBe('en');
  });

  it('extracts zh from Chinese header', () => {
    expect(parseAcceptLanguage('zh-CN,zh;q=0.9,en;q=0.8')).toBe('zh');
  });

  it('returns null for null input', () => {
    expect(parseAcceptLanguage(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseAcceptLanguage('')).toBeNull();
  });
});

describe('buildSwitchUrl', () => {
  it('replaces zh with en in URL path', () => {
    expect(buildSwitchUrl('/zh/articles/hello/', 'en')).toBe('/en/articles/hello/');
  });

  it('replaces en with zh', () => {
    expect(buildSwitchUrl('/en/', 'zh')).toBe('/zh/');
  });

  it('handles root paths with no trailing slash', () => {
    expect(buildSwitchUrl('/zh', 'en')).toBe('/en/');
  });
});
