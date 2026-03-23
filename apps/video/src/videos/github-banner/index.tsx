import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion";
import { Logo } from "../../components/logo";
import { colors, fontFamily } from "../../design/theme";
import { SPRING_PRESETS } from "../../lib/animations";

const FEATURES = [
    "One-Command Backups",
    "Auto History",
    "Instant Restore",
    "Multi-Connection",
    "SQL Queries",
];

export function GitHubBanner() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scanlineY = interpolate(frame, [0, 40], [-100, 110], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const bgReveal = interpolate(frame, [0, 30], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const logoEntrance = spring({
        frame: frame - 15,
        fps,
        config: SPRING_PRESETS.bouncy,
        durationInFrames: 30,
    });

    const taglineEntrance = spring({
        frame: frame - 30,
        fps,
        config: SPRING_PRESETS.gentle,
        durationInFrames: 25,
    });

    const installEntrance = spring({
        frame: frame - 45,
        fps,
        config: SPRING_PRESETS.snappy,
        durationInFrames: 20,
    });

    const glowPulse = interpolate(
        Math.sin((frame / fps) * Math.PI * 1.5),
        [-1, 1],
        [0.2, 0.6]
    );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                overflow: "hidden",
            }}
        >
            {/* Subtle grid */}
            <AbsoluteFill
                style={{
                    backgroundImage: `linear-gradient(to right, ${colors.mutedSubtle}15 1px, transparent 1px), linear-gradient(to bottom, ${colors.mutedSubtle}15 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    opacity: bgReveal,
                    maskImage:
                        "radial-gradient(ellipse at center, black 40%, transparent 75%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 40%, transparent 75%)",
                }}
            />

            {/* Scanline sweep */}
            {frame < 45 && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: `${scanlineY}%`,
                        height: 2,
                        background: `linear-gradient(90deg, transparent, ${colors.primary}80, transparent)`,
                        boxShadow: `0 0 30px 10px ${colors.glow}`,
                    }}
                />
            )}

            {/* Green accent line at top */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
                    opacity: bgReveal,
                }}
            />

            <AbsoluteFill
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 80,
                    padding: "0 100px",
                }}
            >
                {/* Left: Logo + tagline */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 20,
                        flex: 1,
                    }}
                >
                    <div
                        style={{
                            opacity: logoEntrance,
                            transform: `scale(${0.8 + logoEntrance * 0.2})`,
                            filter: `drop-shadow(0 0 ${30 * glowPulse}px ${colors.glowStrong})`,
                        }}
                    >
                        <Logo fontSize={64} />
                    </div>

                    <p
                        style={{
                            fontFamily: fontFamily.sans,
                            fontSize: 22,
                            color: colors.muted,
                            fontWeight: 400,
                            lineHeight: 1.5,
                            opacity: taglineEntrance,
                            transform: `translateY(${(1 - taglineEntrance) * 10}px)`,
                            maxWidth: 400,
                        }}
                    >
                        Database Backups Made Simple.
                        <br />
                        Skip the pg_dump syntax lookup.
                    </p>

                    <div
                        style={{
                            padding: "10px 20px",
                            borderRadius: 6,
                            backgroundColor: colors.terminal.bg,
                            border: `1px solid ${colors.primary}30`,
                            fontFamily: fontFamily.mono,
                            fontSize: 16,
                            color: colors.foreground,
                            opacity: installEntrance,
                            transform: `translateY(${(1 - installEntrance) * 8}px)`,
                            boxShadow: `0 0 20px ${colors.glow}`,
                        }}
                    >
                        <span style={{ color: colors.muted }}>$ </span>
                        npm install -g dbmux
                    </div>
                </div>

                {/* Right: Feature tags */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        flex: 0,
                    }}
                >
                    {FEATURES.map((feature, index) => {
                        const delay = 40 + index * 8;
                        const entrance = spring({
                            frame: frame - delay,
                            fps,
                            config: SPRING_PRESETS.snappy,
                            durationInFrames: 20,
                        });

                        return (
                            <div
                                key={feature}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 20px",
                                    borderRadius: 8,
                                    backgroundColor: colors.secondary,
                                    border: `1px solid ${colors.border}`,
                                    opacity: entrance,
                                    transform: `translateX(${(1 - entrance) * 30}px)`,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        backgroundColor: colors.primary,
                                        boxShadow: `0 0 8px ${colors.glowStrong}`,
                                    }}
                                />
                                <span
                                    style={{
                                        fontFamily: fontFamily.sans,
                                        fontSize: 16,
                                        fontWeight: 500,
                                        color: colors.foreground,
                                    }}
                                >
                                    {feature}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </AbsoluteFill>

            {/* Bottom accent line */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
                    opacity: bgReveal,
                }}
            />
        </AbsoluteFill>
    );
}
