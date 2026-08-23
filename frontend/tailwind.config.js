/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                cyber: {
                    dark: '#060a12',
                    darker: '#03060a',
                    surface: '#0d131f',
                    card: '#111928',
                    border: '#1e293b',
                    cyan: '#00f0ff',
                    blue: '#3b82f6',
                    violet: '#8b5cf6',
                    purple: '#a855f7',
                    emerald: '#00ff9d',
                    amber: '#ffaa00',
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scanline': 'scanline 8s linear infinite',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'float': 'float 4s ease-in-out infinite',
            },
            keyframes: {
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(1000%)' },
                },
                glowPulse: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.9' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' },
                }
            }
        },
    },
    plugins: [],
}
