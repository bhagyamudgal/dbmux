import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
} from "remotion";
import { colors, fontFamily } from "../../../design/theme";
import { SPRING_PRESETS } from "../../../lib/animations";

const FEATURES = [
    { icon: "backup", label: "One-Command Backups" },
    { icon: "history", label: "Auto History" },
    { icon: "restore", label: "Instant Restore" },
    { icon: "connect", label: "Multi-Connection" },
];

const ICONS: Record<string, string> = {
    backup: "\u25B6",
    history: "\u2630",
    restore: "\u21BA",
    connect: "\u2194",
};

export function FeaturesGridScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const titleEntrance = spring({
        frame,
        fps,
        config: SPRING_PRESETS.snappy,
        durationInFrames: 20,
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 40,
                padding: 60,
            }}
        >
            <h2
                style={{
                    fontFamily: fontFamily.sans,
                    fontSize: 38,
                    fontWeight: 700,
                    color: colors.foreground,
                    opacity: titleEntrance,
                    transform: `translateY(${(1 - titleEntrance) * 15}px)`,
                }}
            >
                Everything you need.
            </h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    maxWidth: 700,
                }}
            >
                {FEATURES.map((feature, index) => {
                    const delay = 15 + index * 10;
                    const entrance = spring({
                        frame: frame - delay,
                        fps,
                        config: SPRING_PRESETS.bouncy,
                        durationInFrames: 25,
                    });

                    return (
                        <div
                            key={feature.label}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                padding: "20px 24px",
                                borderRadius: 12,
                                backgroundColor: colors.secondary,
                                border: `1px solid ${colors.border}`,
                                opacity: entrance,
                                transform: `scale(${0.9 + entrance * 0.1}) translateY(${(1 - entrance) * 12}px)`,
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 10,
                                    backgroundColor: `${colors.primary}18`,
                                    border: `1px solid ${colors.primary}30`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    color: colors.primary,
                                    fontFamily: fontFamily.mono,
                                }}
                            >
                                {ICONS[feature.icon]}
                            </div>
                            <span
                                style={{
                                    fontFamily: fontFamily.sans,
                                    fontSize: 20,
                                    fontWeight: 500,
                                    color: colors.foreground,
                                }}
                            >
                                {feature.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
}
