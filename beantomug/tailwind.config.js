/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Coffee Dashboard Palette
        coffee: {
          // Deep espresso tones (primary)
          espresso: '#2C1810',      // Deepest espresso brown
          dark: '#3D2415',          // Dark roasted coffee
          rich: '#4A2C1A',          // Rich dark brown
          
          // Medium roasted mocha tones (secondary)
          mocha: '#6B4423',         // Medium roasted mocha
          medium: '#8B5A2B',        // Medium brown
          warm: '#A67B4A',          // Warm medium brown
          
          // Light latte tones (accent)
          latte: '#C4A484',         // Light latte
          light: '#D4B898',         // Light coffee
          cream: '#E2C8A8',         // Coffee cream
          
          // Crystal-like coffee accents (highlights)
          crystal: '#F0E6D8',       // Crystal coffee
          pearl: '#F5EDE0',         // Pearl coffee
          ivory: '#FAF4E8',         // Ivory coffee
          
          // Ultra-light tones (backgrounds)
          mist: '#FDF8F0',          // Coffee mist
          cloud: '#FEFAF5',         // Coffee cloud
          snow: '#FFFCF8',          // Coffee snow
        },
        
        // Semantic colors for dashboard
        dashboard: {
          // Success states
          success: {
            light: '#D1FAE5',       // Light mint
            main: '#10B981',        // Green
            dark: '#059669',        // Dark green
          },
          
          // Warning states
          warning: {
            light: '#FEF3C7',       // Light amber
            main: '#F59E0B',        // Amber
            dark: '#D97706',        // Dark amber
          },
          
          // Error states
          error: {
            light: '#FEE2E2',       // Light red
            main: '#EF4444',        // Red
            dark: '#DC2626',        // Dark red
          },
          
          // Info states
          info: {
            light: '#DBEAFE',       // Light blue
            main: '#3B82F6',        // Blue
            dark: '#2563EB',        // Dark blue
          },
        },
        
        // Neutral tones for text and borders
        neutral: {
          text: {
            primary: '#1F2937',     // Dark text
            secondary: '#4B5563',   // Medium text
            tertiary: '#9CA3AF',    // Light text
            disabled: '#D1D5DB',    // Disabled text
          },
          border: {
            light: '#E5E7EB',       // Light border
            medium: '#D1D5DB',      // Medium border
            dark: '#9CA3AF',        // Dark border
          },
          background: {
            primary: '#FFFFFF',     // Primary background
            secondary: '#F9FAFB',   // Secondary background
            tertiary: '#F3F4F6',    // Tertiary background
          },
        },
      },
      backgroundImage: {
        // Coffee dashboard gradients
        'coffee-primary': 'linear-gradient(135deg, #2C1810 0%, #4A2C1A 50%, #6B4423 100%)',
        'coffee-secondary': 'linear-gradient(135deg, #6B4423 0%, #8B5A2B 50%, #A67B4A 100%)',
        'coffee-accent': 'linear-gradient(135deg, #A67B4A 0%, #C4A484 50%, #D4B898 100%)',
        'coffee-light': 'linear-gradient(135deg, #D4B898 0%, #E2C8A8 50%, #F0E6D8 100%)',
        'coffee-crystal': 'linear-gradient(135deg, #F0E6D8 0%, #F5EDE0 50%, #FAF4E8 100%)',
        'coffee-mist': 'linear-gradient(135deg, #FDF8F0 0%, #FEFAF5 50%, #FFFCF8 100%)',
        
        // Dashboard specific gradients
        'dashboard-card': 'linear-gradient(135deg, #FAF4E8 0%, #F5EDE0 30%, #F0E6D8 100%)',
        'dashboard-header': 'linear-gradient(135deg, #2C1810 0%, #3D2415 50%, #4A2C1A 100%)',
        'dashboard-sidebar': 'linear-gradient(180deg, #4A2C1A 0%, #6B4423 100%)',
        'dashboard-content': 'linear-gradient(135deg, #FDF8F0 0%, #FAF4E8 100%)',
        
        // Utility gradients
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
        'mono': ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideDown': 'slideDown 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'bounceIn': 'bounceIn 0.6s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin': 'spin 1s linear infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true, // Ensure Preflight is enabled
  },
} 