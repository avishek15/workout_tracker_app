/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#8B6F47",
                    hover: "#7A5F3E",
                },
                secondary: {
                    DEFAULT: "#A67C52",
                    hover: "#8F6A44",
                },
                background: {
                    primary: "#F5F1EB",
                    secondary: "#E8E0D5",
                },
                accent: {
                    primary: "#8B6F47",
                    secondary: "#A67C52",
                },
                text: {
                    primary: "#5D4E37",
                    secondary: "#7A6B53",
                    muted: "#9A8B73",
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
