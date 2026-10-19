import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF8F5',
        card: '#FFFFFF',
        border: {
          DEFAULT: '#EAE6DF',
          subtle: '#F0ECE4',
          strong: '#DFD8CC',
        },
        sidebar: {
          bg: '#FAF8F5',
          active: '#F2ECE2',
          text: '#2D2821',
          muted: '#736B5E',
        },
        ink: {
          primary: '#1A1816',
          secondary: '#5C5449',
          muted: '#8C8274',
          faint: '#B5ABA0',
        },
        bronze: {
          DEFAULT: '#8C653B',
          light: '#F8F3EC',
          hover: '#73522E',
        },
        status: {
          green: {
            bg: '#ECFDF5',
            text: '#065F46',
            border: '#A7F3D0',
            dot: '#10B981',
          },
          amber: {
            bg: '#FFFBEB',
            text: '#92400E',
            border: '#FDE68A',
            dot: '#F59E0B',
          },
          red: {
            bg: '#FEF2F2',
            text: '#991B1B',
            border: '#FECACA',
            dot: '#EF4444',
          },
          brown: {
            bg: '#F5EFE6',
            text: '#684E31',
            border: '#E3D7C5',
            dot: '#8C653B',
          },
          gray: {
            bg: '#F3F4F6',
            text: '#374151',
            border: '#E5E7EB',
            dot: '#6B7280',
          },
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06)',
        dropdown: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
