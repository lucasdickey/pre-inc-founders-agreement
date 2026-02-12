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
          "slate-light": "#425466",
          cyan: "#00d4ff",
          green: "#33d17a",
          border: "#e3e8ee",
          "gray-50": "#f6f9fc",
          "gray-100": "#e3e8ee",
          "gray-200": "#c1c9d2",
          "gray-500": "#697386",
          "gray-700": "#3c4257",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Ubuntu",
          "sans-serif",
        ],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      boxShadow: {
        "stripe-sm":
          "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        stripe:
          "0 2px 5px 0 rgba(60, 66, 87, 0.08), 0 1px 1px 0 rgba(0, 0, 0, 0.04)",
        "stripe-md":
          "0 6px 12px -2px rgba(50, 50, 93, 0.08), 0 3px 7px -3px rgba(0, 0, 0, 0.1)",
        "stripe-lg":
          "0 13px 27px -5px rgba(50, 50, 93, 0.1), 0 8px 16px -8px rgba(0, 0, 0, 0.1)",
        "stripe-focus": "0 0 0 3px rgba(99, 91, 255, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
