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

export const presets: ThemePalette[] = [
	defaultThemePalette,
	{
		name: 'Coral',
		id: 'preset_coral',
		base: { border: { radius: '0.2rem' }, font: { family: 'Jost' } },
		card: 'gradient',
		vars: {
			light: {
				primary: '#e76f51',
				secondary: '#f4a261',
				background: '#fef9f2',
				surface: '#f4a26120',
				text: '#2d2a26'
			},
			dark: {
				primary: '#f4a261',
				secondary: '#e76f51',
				background: '#1a1512',
				surface: '#2d221a',
				text: '#e8d5c4'
			}
		}
	},
	{
		name: 'Moss',
		id: 'preset_moss',
		base: { border: { radius: '0.2rem' }, font: { family: 'Jost' } },
		card: 'solid',
		vars: {
			light: {
				primary: '#2d6a4f',
				secondary: '#40916c',
				background: '#f0f7f4',
				surface: '#d8f3dc50',
				text: '#1b3a2d'
			},
			dark: {
				primary: '#52b788',
				secondary: '#40916c',
				background: '#0d1f17',
				surface: '#1a3a2a',
				text: '#b7e4c7'
			}
		}
	},
	{
		name: 'Slate',
		id: 'preset_slate',
		base: { border: { radius: '0.2rem' }, font: { family: 'Jost' } },
		card: 'border',
		vars: {
			light: {
				primary: '#3a4151',
				secondary: '#5c6378',
				background: '#f8f9fa',
				surface: '#e9ecef50',
				text: '#212529'
			},
			dark: {
				primary: '#8d99ae',
				secondary: '#6c7576',
				background: '#111318',
				surface: '#1e2128',
				text: '#ced4da'
			}
		}
	}
];
