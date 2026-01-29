import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stripe: {
          purple: "#635bff",
          "purple-dark": "#5851ea",
          "purple-light": "#7a73ff",
          slate: "#0a2540",
          cyan: "#00d4ff",
        },
      },
    },
  },
  plugins: [],
};
export default config;
