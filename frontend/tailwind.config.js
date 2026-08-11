/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                serif: ['"Plus Jakarta Sans"', 'sans-serif'],
                heading: ['"Plus Jakarta Sans"', 'sans-serif'],
                mono: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}