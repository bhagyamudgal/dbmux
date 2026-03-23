export const colors = {
    // Matched from apps/landing dark mode: oklch with hue 250 (cool blue undertone)
    background: "#14151e", // oklch(0.12 0.005 250)
    foreground: "#f4f4f8", // oklch(0.97 0.003 250)
    card: "#1b1c27", // oklch(0.15 0.005 250)
    primary: "#22c55e", // oklch(0.72 0.19 145)
    primaryLight: "#4ade80",
    secondary: "#2e3040", // oklch(0.22 0.01 250)
    muted: "#9a9db0", // oklch(0.65 0.015 250)
    mutedSubtle: "#272833", // oklch(0.20 0.008 250)
    accent: "#2e3040", // oklch(0.22 0.01 250)
    border: "#383a4a", // oklch(0.25 0.01 250)
    success: "#22c55e",
    error: "#ef4444",
    glow: "rgba(34, 197, 94, 0.15)",
    glowStrong: "rgba(34, 197, 94, 0.3)",
    terminal: {
        bg: "#0f1018",
        titleBar: "#191a24",
        dot: {
            red: "#ff5f57",
            yellow: "#febc2e",
            green: "#28c840",
        },
    },
} as const;
