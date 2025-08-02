/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#A855F7",
                    hover: "#9333EA",
                },
                secondary: {
                    DEFAULT: "#D4AF37",
                    hover: "#B8941F",
                },
                background: {
                    primary: "#0A0A0A",
                    secondary: "#1A1A1A",
                },
                accent: {
                    primary: "#A855F7",
                    secondary: "#D4AF37",
                },
                text: {
                    primary: "#F5F5F5",
                    secondary: "#E0E0E0",
                    muted: "#A0A0A0",
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
