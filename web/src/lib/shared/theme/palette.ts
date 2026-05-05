export interface ThemePalette {
	name: string;
	id: string;
	base: {
		border: { radius: string };
		font: { family: string };
	};
	card: 'gradient' | 'solid' | 'solid-border' | 'border' | 'transparent';
	vars: {
		light: {
			primary: string;
			secondary: string;
			background: string;
			surface: string;
			text: string;
		};
		dark: {
			primary: string;
			secondary: string;
			background: string;
			surface: string;
			text: string;
		};
	};
}

export const defaultThemePalette: ThemePalette = {
	name: 'Aster',
	id: 'default_aster',
	base: {
		border: { radius: '0.2rem' },
		font: { family: 'Jost' }
	},
	card: 'gradient',
	vars: {
		light: {
			primary: '#613de3',
			secondary: '#b55089',
			background: '#dfdfed',
			surface: '#9f9fe02d',
			text: '#343654'
		},
		dark: {
			primary: '#ff5370',
			secondary: '#5d86ff',
			background: '#0f111a',
			surface: '#1e2139a0',
			text: '#919DCF'
		}
	}
};

export const defaultPalettes: ThemePalette[] = [defaultThemePalette];
