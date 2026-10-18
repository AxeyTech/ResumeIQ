/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light-mode surfaces (Stripe/Linear caliber high-contrast palette)
        canvas: '#F4F6FB',
        'canvas-deep': '#EAEEF6',
        paper: '#FFFFFF',
        ink: '#0E1116',
        'ink-soft': '#334155',
        'ink-faint': '#64748B',
        line: '#CBD5E1',
        'line-soft': '#E2E8F0',
        'line-strong': '#94A3B8',

        // Dark-mode surfaces
        'night': '#07080D',
        'night-deep': '#0C0E16',
        'night-panel': '#12141F',
        'night-surface': '#181B28',
        'night-surface-hover': '#222638',
        'night-card': '#141622',
        'night-line': '#23273A',
        'moon': '#F5F6FB',
        'moon-soft': '#A9AEC2',

        // Google brand palette
        'g-blue': '#4285F4',
        'g-blue-dim': '#1A73E8',
        'g-red': '#EA4335',
        'g-yellow': '#FBBC05',
        'g-green': '#34A853',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Lora"', 'ui-serif', 'Georgia', 'serif'],
        ui: ['"Poppins"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 20px 35px -4px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        frame: '0 40px 90px -30px rgba(14,17,22,0.24)',
        'glow-blue': '0 0 24px -2px rgba(66,133,244,0.55)',
        'glow-red': '0 0 24px -2px rgba(234,67,53,0.55)',
        'glow-yellow': '0 0 24px -2px rgba(251,188,5,0.55)',
        'glow-green': '0 0 24px -2px rgba(52,168,83,0.55)',
        'glow-soft': '0 0 40px -8px rgba(66,133,244,0.35)',
        'night-card': '0 1px 1px rgba(0,0,0,0.4), 0 30px 60px -20px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        'g-gradient': 'linear-gradient(115deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)',
        'g-gradient-soft': 'linear-gradient(115deg, #4285F4 0%, #EA4335 50%, #34A853 100%)',
        'aurora-1': 'radial-gradient(circle at 30% 30%, rgba(66,133,244,0.5), transparent 60%)',
        'aurora-2': 'radial-gradient(circle at 70% 40%, rgba(234,67,53,0.4), transparent 60%)',
        'aurora-3': 'radial-gradient(circle at 50% 80%, rgba(251,188,5,0.4), transparent 60%)',
        'aurora-4': 'radial-gradient(circle at 20% 70%, rgba(52,168,83,0.4), transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(3%, -4%) scale(1.05)' },
          '66%': { transform: 'translate(-3%, 3%) scale(0.97)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 3s linear infinite',
        aurora: 'aurora-drift 18s ease-in-out infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
