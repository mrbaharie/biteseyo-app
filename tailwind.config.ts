import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF6F0',
        paper: '#FFFDF9',
        pink: '#FF8FAB',
        pinkDeep: '#FF5C8A',
        mint: '#A8E6CF',
        mintDeep: '#4FAE86',
        yellow: '#FFD93D',
        lavender: '#C8B6FF',
        ink: '#4A3B3B',
        inkSoft: '#8A7A72',
        red: '#E8503A',
      },
      fontFamily: {
        doodle: ['Gaegu', 'cursive'],
        body: ['Baloo 2', 'sans-serif'],
        pen: ['Nanum Pen Script', 'cursive'],
      },
      boxShadow: {
        doodle: '4px 4px 0 #4A3B3B',
        'doodle-sm': '3px 3px 0 rgba(74,59,59,0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
