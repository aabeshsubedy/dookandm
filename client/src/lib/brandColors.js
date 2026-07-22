/**
 * Brand accent palettes for DokaanDM.
 * Values are RGB channels (space-separated) for CSS variables.
 * Suited to omnichannel social-commerce SaaS.
 */
export const BRAND_COLORS = [
  {
    id: 'blue',
    label: 'Ocean',
    description: 'Trust & clarity',
    // Preview swatch (hex)
    swatch: '#2563EB',
    light: {
      brand: '37 99 235',
      hover: '29 78 216',
      active: '30 64 175',
      soft: '239 246 255',
    },
    dark: {
      brand: '59 130 246',
      hover: '96 165 250',
      active: '37 99 235',
      soft: '23 37 84',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'Modern product feel',
    swatch: '#7C3AED',
    light: {
      brand: '124 58 237',
      hover: '109 40 217',
      active: '91 33 182',
      soft: '245 243 255',
    },
    dark: {
      brand: '167 139 250',
      hover: '196 181 253',
      active: '139 92 246',
      soft: '46 16 101',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    description: 'Growth & commerce',
    swatch: '#059669',
    light: {
      brand: '5 150 105',
      hover: '4 120 87',
      active: '6 95 70',
      soft: '236 253 245',
    },
    dark: {
      brand: '52 211 153',
      hover: '110 231 183',
      active: '16 185 129',
      soft: '6 46 34',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Social energy',
    swatch: '#E11D48',
    light: {
      brand: '225 29 72',
      hover: '190 18 60',
      active: '159 18 57',
      soft: '255 241 242',
    },
    dark: {
      brand: '251 113 133',
      hover: '253 164 175',
      active: '244 63 94',
      soft: '76 5 25',
    },
  },
  {
    id: 'amber',
    label: 'Amber',
    description: 'Warm marketplace',
    swatch: '#D97706',
    light: {
      brand: '217 119 6',
      hover: '180 83 9',
      active: '146 64 14',
      soft: '255 251 235',
    },
    dark: {
      brand: '251 191 36',
      hover: '252 211 77',
      active: '245 158 11',
      soft: '69 40 8',
    },
  },
  {
    id: 'indigo',
    label: 'Indigo',
    description: 'Deep workspace',
    swatch: '#4F46E5',
    light: {
      brand: '79 70 229',
      hover: '67 56 202',
      active: '55 48 163',
      soft: '238 242 255',
    },
    dark: {
      brand: '129 140 248',
      hover: '165 180 252',
      active: '99 102 241',
      soft: '30 27 75',
    },
  },
];

export const DEFAULT_BRAND_COLOR = 'blue';

export function getBrandColor(id) {
  return BRAND_COLORS.find((c) => c.id === id) || BRAND_COLORS[0];
}

export function isValidBrandColor(id) {
  return BRAND_COLORS.some((c) => c.id === id);
}
