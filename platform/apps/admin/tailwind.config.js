/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@fade/design-tokens/tailwind-preset.cjs')],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
