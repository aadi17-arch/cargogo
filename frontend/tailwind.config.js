/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#09121F',
                    hover: '#1E293B',
                },
                accent: {
                    DEFAULT: '#4F46E5',
                    hover: '#4338CA',
                },
                surface: {
                    DEFAULT: '#FFFFFF',
                    muted: '#F8FAFC',
                },
                canvas: '#F1F5F9',
                status: {
                    pending: '#D97706',
                    accepted: '#8B5CF6',
                    transit: '#EA580C',
                    delivered: '#0D9488',
                    completed: '#059669',
                    cancelled: '#DC2626',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                serif: ['"Plus Jakarta Sans"', 'sans-serif'],
                heading: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
                display: ['"Space Grotesk"', 'sans-serif'],
                mono: ['"Space Mono"', 'monospace'],
            },
            borderRadius: {
                card: '6px',
                button: '6px',
            },
        },
    },
    plugins: [],
}