import type { Reroute } from '@sveltejs/kit';
import { DEFAULT_LANG, NON_DEFAULT_LANG_RE } from '$lib/i18n/languages';

export const reroute: Reroute = ({ url }) => {
  const pathname = url.pathname;
  if (NON_DEFAULT_LANG_RE.test(pathname)) {
    return pathname;
  }
  // Default language: inject prefix internally so [lang] route param is populated
  return `/${DEFAULT_LANG}${pathname}`;
};
