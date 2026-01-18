/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['"Quicksand"', 'sans-serif'],
                title: ['"Fredoka"', 'sans-serif'],
            },
            colors: {
                paper: {
                    50: '#fdfbf7',
                    100: '#f7f3e8',
                    200: '#efe5d1',
                    300: '#e5d1b0',
                    800: '#5e4b35',
                    900: '#4d3d2a',
                },
                ink: {
                    900: '#1a1a1a',
                }
            },
            boxShadow: {
                'book': '0 20px 40px -5px rgba(0, 0, 0, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.2)',
                'page-left': 'inset -20px 0 50px -20px rgba(0,0,0,0.1)',
                'page-right': 'inset 20px 0 50px -20px rgba(0,0,0,0.1)',
            }
        },
    },
    plugins: [],
}
