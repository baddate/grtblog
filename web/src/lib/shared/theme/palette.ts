export const THEME_MANAGER_VERSION = 1;

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

/** Built-in presets — always available, never deleted */
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
	},
	{
		name: 'Brutalist',
		id: 'default_brutalist',
		base: { border: { radius: '0px' }, font: { family: 'Inter' } },
		card: 'border',
		vars: {
			light: {
				primary: '#222',
				secondary: '#6e6e6e',
				background: '#f0f0f0',
				surface: '#b8b8b844',
				text: '#000000'
			},
			dark: {
				primary: '#ffffff',
				secondary: '#999999',
				background: '#000000',
				surface: '#ffffff14',
				text: '#cccccc'
			}
		}
	},
	{
		name: 'Royal',
		id: 'default_royal_decree',
		base: { border: { radius: '0.25rem' }, font: { family: 'Merriweather' } },
		card: 'border',
		vars: {
			light: {
				primary: '#a6581d',
				secondary: '#c26125',
				background: '#d9cfc4',
				surface: '#a67f6c23',
				text: '#453531'
			},
			dark: {
				primary: '#cf833c',
				secondary: '#ff5370',
				background: '#0d0b14',
				surface: '#6b52473f',
				text: '#ab9b8a'
			}
		}
	},
	{
		name: 'Sakura',
		id: 'default_sakura',
		base: { border: { radius: '0.5rem' }, font: { family: 'Nunito' } },
		card: 'solid-border',
		vars: {
			light: {
				primary: '#d45f7a',
				secondary: '#f4a0b4',
				background: '#fff0f4',
				surface: '#ffd6e040',
				text: '#3d1f28'
			},
			dark: {
				primary: '#f48fa8',
				secondary: '#c46070',
				background: '#1a0d12',
				surface: '#3d1f2840',
				text: '#ffd6e0'
			}
		}
	},
	{
		name: 'Ocean',
		id: 'default_ocean',
		base: { border: { radius: '0.4rem' }, font: { family: 'Inter' } },
		card: 'solid',
		vars: {
			light: {
				primary: '#0077b6',
				secondary: '#00b4d8',
				background: '#f0f8ff',
				surface: '#caf0f820',
				text: '#023e58'
			},
			dark: {
				primary: '#48cae4',
				secondary: '#0096c7',
				background: '#03071e',
				surface: '#023e5840',
				text: '#caf0f8'
			}
		}
	}
];

export const defaultPalettes: ThemePalette[] = [defaultThemePalette];

/** Font families available in the editor */
export const SELECTED_FONTS = [
	'Jost',
	'Inter',
	'Outfit',
	'Poppins',
	'Roboto',
	'Nunito',
	'Acme',
	'Barlow',
	'Merriweather',
	'Space Grotesk',
	'Crimson Text',
	'Vollkorn',
	"'Helvetica Neue', Arial, sans-serif"
] as const;
