/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: "#0f172a",            
          bgLight: "#1e293b",       
          card: "#1e293b",          
          border: "#334155",        
          text: "#e2e8f0",          
          subtext: "#cbd5e1",      
          positive: "#34d399",      
          negative: "#f43f5e",      
          accentBlue: "#22d3ee",    
          accentPurple: "#a855f7",  
          accentPink: "#ec4899",    
        },
      },
    },
  },
  plugins: [],
}
