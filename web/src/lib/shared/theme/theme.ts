import tinycolor from 'tinycolor2';

function isObject<T>(item: T) {
	return item && typeof item === 'object' && !Array.isArray(item);
}

export const deepMerge = <T extends Record<string, unknown>, U extends Record<string, unknown>>(
	theme1: T,
	theme2: U
): T & U => {
	const output = Object.assign({}, theme1) as T & U;
	if (isObject(theme1) && isObject(theme2)) {
		Object.keys(theme2).forEach((key) => {
			if (isObject(theme2[key])) {
				if (!(key in theme1)) Object.assign(output, { [key]: theme2[key] });
				else
					(output as Record<string, unknown>)[key] = deepMerge(
						theme1[key] as Record<string, unknown>,
						theme2[key] as Record<string, unknown>
					);
			} else {
				Object.assign(output, { [key]: theme2[key] });
			}
		});
	}
	return output;
};

const forObjectReplace = <T extends Record<string, unknown>, Y>(
	obj: T,
	replace: (keys: string[], value: unknown) => Y
): T => {
	const generated: Record<string, unknown> = JSON.parse(JSON.stringify(obj));
	const walk = (o: Record<string, unknown>, prefix: string[]) => {
		Object.keys(o).forEach((key) => {
			if (typeof o[key] === 'object' && o[key] !== null) {
				walk(o[key] as Record<string, unknown>, [...prefix, key]);
			} else {
				o[key] = replace([...prefix, key], o[key]);
			}
		});
	};
	walk(generated, []);
	return generated as T;
};

const flattenObject = <T extends Record<string, unknown>>(
	theme: T,
	newKey: (keys: string[], value: unknown) => [string, unknown]
): Record<string, unknown> => {
	const flattened: Record<string, unknown> = {};
	const walk = (obj: Record<string, unknown>, prefix: string[]) => {
		Object.keys(obj).forEach((key) => {
			if (typeof obj[key] === 'object' && obj[key] !== null) {
				walk(obj[key] as Record<string, unknown>, [...prefix, key]);
			} else {
				const item = newKey([...prefix, key], obj[key]);
				flattened[item[0]] = item[1];
			}
		});
	};
	walk(theme as Record<string, unknown>, []);
	return flattened;
};

const newKey = (keys: string[], value: unknown): [string, unknown] => [
	`--${keys.join('-')}`,
	value
];

const joinVariables = (vars: Record<string, unknown>) =>
	Object.entries(vars)
		.map(([k, v]) => `${k}: ${v};`)
		.join('\n');

export const cssConverter = (theme: UITheme) => {
	const baseCssVars = flattenObject(theme.base, newKey);
	const modeVars = {
		dark: flattenObject(theme.vars.dark, newKey),
		light: flattenObject(theme.vars.light, newKey)
	};

	// :root includes base vars only.
	// Light/dark vars are applied via media queries (system preference)
	// and explicit .light-mode / .dark-mode classes (user choice overrides).
	const baseStyles = `:root { ${joinVariables(baseCssVars)} }`;

	const mediaVarsStyles = (['dark', 'light'] as const)
		.map((key) => {
			const value = modeVars[key];
			return `@media (prefers-color-scheme: ${key}) { :root { ${joinVariables(value)} } }`;
		})
		.join('\n');

	const modeVarsStyles = (['dark', 'light'] as const)
		.map((key) => {
			const value = modeVars[key];
			return `.${key}-mode { ${joinVariables(value)} }`;
		})
		.join('\n');

	return `${baseStyles} ${mediaVarsStyles} ${modeVarsStyles}`;
};

const fontSizes = {
	sm: 'clamp(0.9375rem, 0.8521rem + 0.2276vw, 1.1253rem)',
	base: 'clamp(1.125rem, 0.9545rem + 0.4545vw, 1.5rem)',
	md: 'clamp(1.35rem, 1.0548rem + 0.7873vw, 1.9995rem)',
	lg: 'clamp(1.62rem, 1.1448rem + 1.2671vw, 2.6653rem)',
	xl: 'clamp(1.944rem, 1.2127rem + 1.9502vw, 3.5529rem)',
	xxl: 'clamp(2.3328rem, 1.2404rem + 2.913vw, 4.736rem)',
	xxxl: 'clamp(2.7994rem, 1.2022rem + 4.2591vw, 6.3131rem)'
};

const layout = {
	content: { wide: '1200px', main: '60rem' },
	nav: { height: '3rem' }
};

export const CardTypes = ['gradient', 'solid', 'solid-border', 'border', 'transparent'] as const;
export type CardType = (typeof CardTypes)[number];

const getCard = (cardType: CardType) => {
	if (cardType === 'gradient') {
		return {
			card: {
				border: '2px dashed var(--border-color)',
				background: 'linear-gradient(-45deg, var(--background), var(--background), var(--surface))',
				backgroundHover:
					'linear-gradient(-45deg, var(--background), var(--background), var(--surface))',
				backgroundPosition: '90% 0',
				backgroundSize: '200%',
				borderHover: '2px solid var(--border-color)',
				backgroundPositionHover: '10% 20%'
			}
		};
	}
	if (cardType === 'solid') {
		return {
			card: {
				border: 'none',
				background: 'var(--surface)',
				backgroundPosition: 'initial',
				backgroundSize: 'initial',
				borderHover: 'none',
				backgroundHover: 'var(--surface)',
				backgroundPositionHover: 'initial'
			}
		};
	}
	if (cardType === 'solid-border') {
		return {
			card: {
				border: '1px solid var(--border-color)',
				background: 'var(--surface)',
				backgroundPosition: 'initial',
				backgroundHover: 'initial',
				backgroundSize: 'initial',
				borderHover: '1px solid var(--border-color)',
				backgroundPositionHover: 'initial'
			}
		};
	}
	if (cardType === 'border') {
		return {
			card: {
				border: '1px solid var(--border-color)',
				background: 'var(--background)',
				backgroundHover: 'var(--background)',
				backgroundPosition: 'initial',
				backgroundSize: 'initial',
				borderHover: '1px solid var(--border-color)',
				backgroundPositionHover: 'initial'
			}
		};
	}
	// transparent
	return {
		card: {
			border: 'none',
			background: 'linear-gradient(-45deg, var(--background), var(--background), var(--surface))',
			backgroundHover: 'inherit',
			backgroundPosition: '90% 0',
			backgroundSize: '200%',
			borderHover: 'none',
			backgroundPositionHover: '0% 0%'
		}
	};
};

type PaletteColors = {
	primary: string;
	secondary: string;
	background: string;
	surface: string;
	text: string;
};

const generateModeVarsFromPaletteColors = (palette: PaletteColors, cardType: CardType) => {
	const isDark = tinycolor(palette.background).isDark();
	const midErth = tinycolor.mix(palette.surface, palette.background, 50).toString();
	const borderColor = tinycolor.mix(palette.text, palette.background, 75).toString();
	const tooltip = tinycolor
		.mix(palette.background, tinycolor(palette.text).setAlpha(1), 15)
		.toString();

	return {
		primary: {
			color: palette.primary,
			contrast: tinycolor(palette.primary).isDark() ? '#ffffff' : '#000000'
		},
		secondary: { color: palette.secondary },
		colors: { purple: palette.primary },
		background: palette.background,
		surface: palette.surface,
		surface2: tinycolor.mix(palette.surface, borderColor, 25).toString(),
		tooltip,
		border: {
			style: 'solid',
			color: borderColor
		},
		text: palette.text,
		heading: tinycolor(palette.text)[isDark ? 'brighten' : 'darken']().toString(),
		fadeText: tinycolor.mix(palette.text, midErth, 30).toString(),
		shadow: {
			card: `0 1rem 2rem 0 rgba(0, 0, 0, ${isDark ? 0.6 : 0.2})`,
			medium: `0 0.5rem 1rem 0 rgba(0, 0, 0, ${isDark ? 0.3 : 0.15})`,
			small: `0 0.1rem 0.2rem 0 rgba(0, 0, 0, ${isDark ? 0.3 : 0.3})`,
			cardDrop: `0 1rem 2rem rgba(0, 0, 0, ${isDark ? 0.6 : 0.2})`
		},
		...getCard(cardType),
		bold: palette.primary,
		italic: palette.primary,
		strikethrough: palette.primary,
		gradient: {
			'color-1': 'var(--primary-color)',
			'color-2': 'var(--colors-purple)'
		},
		'animated-gradient':
			'linear-gradient(-60deg, var(--gradient-color-1), var(--gradient-color-2), var(--gradient-color-1), var(--gradient-color-2), var(--gradient-color-1), var(--secondary-color), var(--gradient-color-1), var(--gradient-color-2))'
	};
};

export type ThemeVars = ReturnType<typeof generateModeVarsFromPaletteColors>;

export interface UITheme {
	id: string;
	name: string;
	base: {
		layout: typeof layout;
		border: { radius: string };
		font: { family: string; size: typeof fontSizes };
	};
	vars: {
		light: ThemeVars;
		dark: ThemeVars;
	};
}

import type { ThemePalette } from './palette';

export const generateThemeFromPalette = (palette: ThemePalette): UITheme => {
	return {
		id: palette.id,
		name: palette.name,
		base: {
			layout,
			border: { radius: palette.base.border.radius },
			font: {
				family: palette.base.font.family,
				size: fontSizes
			}
		},
		vars: {
			light: generateModeVarsFromPaletteColors(palette.vars.light, palette.card),
			dark: generateModeVarsFromPaletteColors(palette.vars.dark, palette.card)
		}
	};
};

export const generateUITheme = (theme: UITheme, mode: 'light' | 'dark' | 'auto', prefix = '') => {
	const themeVars = deepMerge(theme.base, theme.vars['light']);
	const generatedTheme = forObjectReplace(themeVars, (keys) => `var(--${prefix}${keys.join('-')})`);
	return {
		themeCss: cssConverter(theme),
		theme: generatedTheme
	};
};
