/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kendi belirleyeceğin renk kodlarını ileride buraya yazacaksın kanka:
        'custom-bg': '#000000',      // Örn: Ana arka plan rengin
        'custom-card': '#111111',    // Örn: Kart ve panel rengin
        'custom-fiber': '#222222',   // Örn: Haritadaki fiber hattı rengin
        'custom-vdsl': '#333333',    // Örn: Haritadaki vdsl hattı rengin
      }
    },
  },
  plugins: [],
}