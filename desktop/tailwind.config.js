/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#E8F1FA",
          bg2: "#F5F9FC",
          sidebar: "rgba(236, 242, 248, 0.72)",
          pill: "#5BA4E8",
          pillSoft: "#A8D0F5",
          cta: "#6BB3F0",
          ctaHover: "#5AA6E6",
          text: "#1C1C1E",
          muted: "#6B7280",
          card: "#FFFFFF",
          line: "rgba(0,0,0,0.06)",
          input: "rgba(255,255,255,0.55)",
        },
      },
      boxShadow: {
        card: "0 20px 60px rgba(80, 120, 180, 0.18), 0 4px 16px rgba(80,120,180,0.08)",
        soft: "0 8px 24px rgba(90, 140, 200, 0.12)",
      },
      borderRadius: {
        window: "18px",
        card: "28px",
        pill: "999px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "PingFang SC",
          "Microsoft YaHei",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
