import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
			},
			colors: {
				// Vice City / Vaporwave Colors
				'vice-purple': '#8b2fa0',
				'vice-pink': '#ff1493', 
				'vice-cyan': '#00ffff',
				'vice-blue': '#4169e1',
				'vice-orange': '#ff6347',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					muted: 'hsl(var(--primary-muted))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				camera: {
					overlay: 'hsl(var(--camera-overlay))',
					controls: 'hsl(var(--camera-controls))',
					highlight: 'hsl(var(--target-highlight))',
					capture: 'hsl(var(--capture-button))',
					'capture-active': 'hsl(var(--capture-button-active))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			spacing: {
				'touch': 'var(--touch-target)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'camera': 'var(--shadow-camera)',
				'professional': 'var(--shadow-lg)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-capture': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.05)', opacity: '0.8' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				// Wave animations
				'wave-1': {
					'0%': { 
						transform: 'translateX(-100%) scaleY(1)',
						opacity: '0.6' 
					},
					'50%': { 
						transform: 'translateX(0%) scaleY(1.2)',
						opacity: '0.8' 
					},
					'100%': { 
						transform: 'translateX(100%) scaleY(1)',
						opacity: '0.6' 
					},
				},
				'wave-2': {
					'0%': { 
						transform: 'translateX(-150%) scaleY(0.8)',
						opacity: '0.4' 
					},
					'50%': { 
						transform: 'translateX(-50%) scaleY(1.1)',
						opacity: '0.7' 
					},
					'100%': { 
						transform: 'translateX(50%) scaleY(0.8)',
						opacity: '0.4' 
					},
				},
				'wave-3': {
					'0%': { 
						transform: 'translateX(-200%) scaleY(0.6)',
						opacity: '0.3' 
					},
					'50%': { 
						transform: 'translateX(-100%) scaleY(0.9)',
						opacity: '0.5' 
					},
					'100%': { 
						transform: 'translateX(0%) scaleY(0.6)',
						opacity: '0.3' 
					},
				},
				// Lens flare animations
				'lens-flare-1': {
					'0%': { 
						opacity: '0.2',
						transform: 'scale(0.5)' 
					},
					'25%': { 
						opacity: '0.8',
						transform: 'scale(1.2)' 
					},
					'50%': { 
						opacity: '0.6',
						transform: 'scale(1)' 
					},
					'75%': { 
						opacity: '0.9',
						transform: 'scale(1.5)' 
					},
					'100%': { 
						opacity: '0.2',
						transform: 'scale(0.5)' 
					},
				},
				'lens-flare-2': {
					'0%': { 
						opacity: '0.1',
						transform: 'scale(0.3)' 
					},
					'33%': { 
						opacity: '0.6',
						transform: 'scale(1)' 
					},
					'66%': { 
						opacity: '0.4',
						transform: 'scale(0.8)' 
					},
					'100%': { 
						opacity: '0.1',
						transform: 'scale(0.3)' 
					},
				},
				'lens-flare-3': {
					'0%': { 
						opacity: '0.3',
						transform: 'scale(0.8)' 
					},
					'40%': { 
						opacity: '0.9',
						transform: 'scale(1.3)' 
					},
					'80%': { 
						opacity: '0.5',
						transform: 'scale(1.1)' 
					},
					'100%': { 
						opacity: '0.3',
						transform: 'scale(0.8)' 
					},
				},
				'lens-flare-4': {
					'0%': { 
						opacity: '0.1',
						transform: 'scale(0.2)' 
					},
					'20%': { 
						opacity: '0.5',
						transform: 'scale(1)' 
					},
					'60%': { 
						opacity: '0.3',
						transform: 'scale(0.7)' 
					},
					'100%': { 
						opacity: '0.1',
						transform: 'scale(0.2)' 
					},
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-capture': 'pulse-capture 2s ease-in-out infinite',
				// Wave animations with different speeds
				'wave-1': 'wave-1 8s ease-in-out infinite',
				'wave-2': 'wave-2 6s ease-in-out infinite reverse',
				'wave-3': 'wave-3 10s ease-in-out infinite',
				// Lens flare animations with different timings
				'lens-flare-1': 'lens-flare-1 3s ease-in-out infinite',
				'lens-flare-2': 'lens-flare-2 4s ease-in-out infinite 0.5s',
				'lens-flare-3': 'lens-flare-3 2.5s ease-in-out infinite 1s',
				'lens-flare-4': 'lens-flare-4 5s ease-in-out infinite 1.5s',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
