// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        gradient: 'gradientShift 30s ease infinite',
        float: 'float 20s ease-in-out infinite',
        
      },
      keyframes: {
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
};

module.exports = {
  theme: {
    extend: {
      animation: {
        beam: 'beamSlide 4s linear infinite',
      },
      keyframes: {
        beamSlide: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '25%': { opacity: '0.1' },
          '50%': { opacity: '0.2' },
          '75%': { opacity: '0.1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
      },
    },
  },
};