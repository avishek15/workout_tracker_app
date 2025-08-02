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
                    primary: "#1A1A1A",
                    secondary: "#2D2D2D",
                },
                accent: {
                    primary: "#A855F7",
                    secondary: "#D4AF37",
                },
                text: {
                    primary: "#F8F9FA",
                    secondary: "#E9ECEF",
                    muted: "#ADB5BD",
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
