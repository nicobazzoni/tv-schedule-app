module.exports = {
    theme: {
      extend: {
        animation: {
          warp: 'warp 0.6s ease-in-out',
          flicker: 'flicker 1.5s infinite',
          pulseFast: 'pulse 1s ease-in-out infinite',
        },
        keyframes: {
          warp: {
            '0%': { transform: 'scale(1.2) rotate(2deg)', opacity: '0' },
            '50%': { transform: 'scale(0.95)', opacity: '1' },
            '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
          },
          flicker: {
            '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
            '20%, 24%, 55%': { opacity: '0' },
          },
        },
      },
    },
  };