import type { TranslateFn } from '$lib/i18n/types';

// --- Absolute formatters ---

/** Format as "2024年3月15日" (locale-aware date via translation). */
export const createFormatDateCN = (t: TranslateFn) => (value?: string): string => {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return t('web.date.date_cn', {
		year: d.getFullYear(),
		month: d.getMonth() + 1,
		day: d.getDate(),
	});
};

/** Format as "2024.03.15" (dotted date). */
export const formatDateDotted = (value?: string): string => {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

/** Format as "0315" (MMDD compact). */
export const formatDateCompact = (value?: string): string => {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '';
	return `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

/** Get locale-aware season name from a date string. */
export const createGetSeason = (t: TranslateFn) => (value?: string): string => {
	if (!value) return '';
	const month = new Date(value).getMonth() + 1;
	if (month >= 3 && month <= 5) return t('web.date.season_spring');
	if (month >= 6 && month <= 8) return t('web.date.season_summer');
	if (month >= 9 && month <= 11) return t('web.date.season_autumn');
	return t('web.date.season_winter');
};

/** Check if two date strings represent different days. */
export const isDifferentDay = (a?: string, b?: string): boolean => {
	if (!a || !b) return false;
	const da = new Date(a);
	const db = new Date(b);
	if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
	return (
		da.getFullYear() !== db.getFullYear() ||
		da.getMonth() !== db.getMonth() ||
		da.getDate() !== db.getDate()
	);
};

// --- Relative formatters ---

export const createFormatRelativeTime = (t: TranslateFn) => (dateStr: string): string => {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days < 1) {
		if (hours < 1) {
			if (minutes < 1) return t('web.date.just_now');
			return t('web.date.minutes_ago', { n: minutes });
		}
		return t('web.date.hours_ago', { n: hours });
	}

	if (days < 7) return t('web.date.days_ago', { n: days });
	if (days < 30) return t('web.date.weeks_ago', { n: Math.ceil(days / 7) });
	if (days < 365) return t('web.date.months_ago', { n: Math.floor(days / 30) });

	return t('web.date.year_format', { year: date.getFullYear() });
};

export const createFormatRelativeTimeWithSeconds = (t: TranslateFn) => (dateStr: string, now = new Date()): string => {
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();

	const clampedMs = Math.max(diffMs, 0);
	const seconds = Math.floor(clampedMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days < 1) {
		if (hours < 1) {
			if (minutes < 1) return seconds <= 0 ? t('web.date.just_now') : t('web.date.seconds_ago', { n: seconds });
			return t('web.date.minutes_ago', { n: minutes });
		}
		return t('web.date.hours_ago', { n: hours });
	}

	if (days < 7) return t('web.date.days_ago', { n: days });
	if (days < 30) return t('web.date.weeks_ago', { n: Math.ceil(days / 7) });
	if (days < 365) return t('web.date.months_ago', { n: Math.floor(days / 30) });

	return t('web.date.year_format', { year: date.getFullYear() });
};

const getNextDelay = (diffMs: number): number | null => {
	if (diffMs < 60_000) return 1_000;
	if (diffMs < 3_600_000) return 60_000;
	return null;
};

export const createRelativeTimeTicker = (
	dateStr: string,
	onTick: (value: string) => void,
	formatFn: (dateStr: string, now?: Date) => string
): (() => void) => {
	if (typeof window === 'undefined') return () => {};

	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const tick = () => {
		const now = new Date();
		const diffMs = now.getTime() - new Date(dateStr).getTime();
		onTick(formatFn(dateStr, now));
		const delay = getNextDelay(Math.max(diffMs, 0));
		if (delay !== null) {
			timeoutId = setTimeout(tick, delay);
		}
	};

	tick();

	return () => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
	};
};
