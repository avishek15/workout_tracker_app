/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#3b82f6",
                    hover: "#2563eb",
                },
                secondary: {
                    DEFAULT: "#6b7280",
                    hover: "#4b5563",
                },
            },
            spacing: {
                section: "2rem",
                container: "1rem",
            },
            borderRadius: {
                container: "0.75rem",
            },
        },
    },
    plugins: [],
};
