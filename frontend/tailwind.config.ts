import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Accent de marque NovaCampus (jaune logo #FFD500 + declinaisons).
        // Regles AAA : le jaune ne porte JAMAIS de texte clair ; sur fond
        // blanc, les liens/textes "jaunes" utilisent les ors sombres 700-900.
        brand: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#FFD500", // jaune vif du logo
          500: "#eab308",
          600: "#C9960B", // or sombre du logo
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        // Barre laterale alignee sur l'anthracite du logo (#1D1D1B).
        // muted = #b4b4bc : 8.2:1 sur l'anthracite (AAA texte normal).
        sidebar: {
          DEFAULT: "#1D1D1B",
          hover: "#2D2D2A",
          border: "#3a3a36",
          muted: "#b4b4bc",
        },
      },
    },
  },
  plugins: [],
};
export default config;
