import type { Reroute } from '@sveltejs/kit';

// Reroute: internally add /zh/ prefix for default-language URLs so they match routes/[lang]/...
export const reroute: Reroute = ({ url }) => {
	const pathname = url.pathname;
	if (!/^\/(en|jp|zh)(\/|$)/.test(pathname)) {
		return `/zh${pathname}`;
	}
	return pathname;
};
