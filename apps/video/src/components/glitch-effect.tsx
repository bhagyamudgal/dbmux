import type { ReactNode } from "react";
import { useCurrentFrame, interpolate } from "remotion";

type GlitchEffectProps = {
    children: ReactNode;
    startFrame?: number;
    duration?: number;
    intensity?: number;
};

export function GlitchEffect({
    children,
    startFrame = 0,
    duration = 30,
    intensity = 1,
}: GlitchEffectProps) {
    const frame = useCurrentFrame();
    const progress = interpolate(
        frame,
        [startFrame, startFrame + duration],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    if (progress <= 0) {
        return <>{children}</>;
    }

    const glitchAmount = progress * intensity;
    const offsetX = Math.sin(frame * 13.7) * glitchAmount * 15;
    const offsetY = Math.cos(frame * 7.3) * glitchAmount * 5;
    const skew = Math.sin(frame * 11.1) * glitchAmount * 3;

    return (
        <div style={{ position: "relative" }}>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translate(${offsetX * 0.5}px, ${offsetY * 0.3}px)`,
                    filter: `hue-rotate(${glitchAmount * 90}deg)`,
                    opacity: 0.6 * glitchAmount,
                    mixBlendMode: "screen",
                }}
            >
                {children}
            </div>
            <div
                style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) skewX(${skew}deg)`,
                    filter:
                        progress > 0.7
                            ? `brightness(${1 + (progress - 0.7) * 3})`
                            : undefined,
                }}
            >
                {children}
            </div>
        </div>
    );
}
