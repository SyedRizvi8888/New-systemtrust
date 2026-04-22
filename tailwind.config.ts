import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* ═══════════════════════════════════════════════════════════════════════
         COLORS — Semantic token system
         ═══════════════════════════════════════════════════════════════════════ */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* Extended semantic colors */
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         TYPOGRAPHY — Custom font sizes with optical scaling
         ═══════════════════════════════════════════════════════════════════════ */
      fontSize: {
        "hero": ["var(--text-hero)", { lineHeight: "var(--leading-tight)", letterSpacing: "var(--tracking-tight)" }],
        "display": ["var(--text-6xl)", { lineHeight: "var(--leading-tight)", letterSpacing: "var(--tracking-tight)" }],
      },
      
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "Menlo", "Monaco", "monospace"],
      },
      
      letterSpacing: {
        tighter: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
        wider: "var(--tracking-wider)",
      },
      
      lineHeight: {
        tight: "var(--leading-tight)",
        snug: "var(--leading-snug)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         SPACING — Extended scale
         ═══════════════════════════════════════════════════════════════════════ */
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
        "header": "var(--header-height)",
        "sidebar": "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-collapsed)",
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         LAYOUT
         ═══════════════════════════════════════════════════════════════════════ */
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         BORDER RADIUS
         ═══════════════════════════════════════════════════════════════════════ */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         BOX SHADOW — Elevation system
         ═══════════════════════════════════════════════════════════════════════ */
      boxShadow: {
        "xs": "var(--shadow-xs)",
        "sm": "var(--shadow-sm)",
        "md": "var(--shadow-md)",
        "lg": "var(--shadow-lg)",
        "xl": "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        "inner": "var(--shadow-inner)",
        "glow": "var(--glow-accent)",
        "glow-strong": "var(--glow-accent-strong)",
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         TRANSITIONS — Motion system
         ═══════════════════════════════════════════════════════════════════════ */
      transitionDuration: {
        "instant": "var(--duration-instant)",
        "fast": "var(--duration-fast)",
        "normal": "var(--duration-normal)",
        "slow": "var(--duration-slow)",
        "slower": "var(--duration-slower)",
        "cinematic": "var(--duration-cinematic)",
      },
      
      transitionTimingFunction: {
        "ease-out-custom": "var(--ease-out)",
        "ease-in-custom": "var(--ease-in)",
        "ease-in-out-custom": "var(--ease-in-out)",
        "bounce": "var(--ease-bounce)",
        "spring": "var(--ease-spring)",
        "smooth": "var(--ease-smooth)",
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         ANIMATIONS — Keyframe animations
         ═══════════════════════════════════════════════════════════════════════ */
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "var(--glow-accent)" },
          "50%": { boxShadow: "var(--glow-accent-strong)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.25s ease-out",
        "accordion-up": "accordion-up 0.25s ease-out",
        "fade-up": "fade-up 0.5s var(--ease-out) forwards",
        "fade-in": "fade-in 0.3s var(--ease-out) forwards",
        "scale-in": "scale-in 0.25s var(--ease-spring) forwards",
        "slide-up": "slide-up 0.6s var(--ease-out) forwards",
        "slide-down": "slide-down 0.4s var(--ease-out) forwards",
        "slide-in-right": "slide-in-right 0.3s var(--ease-out)",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      
      /* ═══════════════════════════════════════════════════════════════════════
         BACKDROP BLUR
         ═══════════════════════════════════════════════════════════════════════ */
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
