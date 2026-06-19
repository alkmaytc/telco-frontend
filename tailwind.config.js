/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Heritage Palette
        'telco-bg': '#fbf9f8',         // Vintage krem kağıt arka planı
        'telco-primary': '#041632',    // Derin endüstriyel lacivert (Yazılar ve sınırlar)
        'telco-primary-container': '#1b2b48',
        'telco-secondary': '#77574d',  // Retro kiremit / kahve tonu
        'telco-container': '#f0eded',  // Panel iç dolgu rengi
        'telco-accent': '#b08d48',     // Sinyal ve premium altın/bakır vurgusu
        'telco-error': '#ba1a1a',      // Kritik hata ve doluluk uyarısı
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderWidth: {
        '2': '2px', // Tüm brutalist kartlar ve inputlar için standart kalınlık
      },
      boxShadow: {
        // Retro donanım hissi veren sert, bulanıklaşmayan gölge
        'retro': '2px 2px 0px 0px #041632',
      }
    },
  },
  plugins: [],
}