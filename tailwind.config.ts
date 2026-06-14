import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#ffffff",
        canvas: "#f4f5f7",
      },
    },
  },
  plugins: [],
};

export default config;
