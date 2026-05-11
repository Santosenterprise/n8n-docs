import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        phase: {
          1: "#6366f1",
          2: "#f59e0b",
          3: "#10b981",
        },
      },
    },
  },
  plugins: [],
};

export default config;
