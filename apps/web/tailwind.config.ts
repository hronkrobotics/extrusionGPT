import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0b0d10",
          800: "#12151a",
          700: "#1a1e25",
          600: "#232833",
          500: "#2f3641",
          400: "#485162",
        },
        accent: {
          DEFAULT: "#5ea9ff",
          soft: "#7fbcff",
          muted: "#3a5a80",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
