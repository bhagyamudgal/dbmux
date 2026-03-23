import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors, fontFamily } from "../design/theme";

type LogoProps = {
    fontSize?: number;
    showCursor?: boolean;
};

export function Logo({ fontSize = 72, showCursor = true }: LogoProps) {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const cursorOpacity = interpolate(
        Math.sin((frame / fps) * Math.PI * 2),
        [-1, 1],
        [0.2, 1]
    );

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "baseline",
                fontFamily: fontFamily.mono,
                fontWeight: 700,
                fontSize,
                letterSpacing: "-0.02em",
            }}
        >
            <span style={{ color: colors.muted, opacity: 0.5 }}>$</span>
            <span style={{ color: colors.primary, marginLeft: 8 }}>dbmux</span>
            {showCursor && (
                <span
                    style={{
                        display: "inline-block",
                        width: fontSize * 0.12,
                        height: fontSize * 0.75,
                        backgroundColor: colors.primary,
                        marginLeft: 6,
                        opacity: cursorOpacity,
                    }}
                />
            )}
        </span>
    );
}
