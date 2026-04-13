import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#FFF0F5", 100: "#FFE0EB", 200: "#FFB8D0", 300: "#FF85B0", 400: "#FF4D8A", 500: "#E91E63", 600: "#C2185B", 700: "#9C1450", 800: "#7B1044", 900: "#5D0D37" },
      },
    },
  },
  plugins: [],
};
export default config;
