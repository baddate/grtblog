import type { Reroute } from '@sveltejs/kit';
import { SUPPORTED_LANGS } from '$lib/i18n/languages';

const ANY_LANG_RE = new RegExp(`^/(${SUPPORTED_LANGS.join('|')})(/|$)`, 'i');

export const reroute: Reroute = ({ url }) => {
  const pathname = url.pathname;
  if (ANY_LANG_RE.test(pathname)) {
    return pathname;
  }
  return pathname;
};
