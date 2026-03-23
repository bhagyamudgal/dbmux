import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
} from "remotion";
import { GridBackground } from "../../../components/grid-background";
import { FeaturePill } from "../../../components/feature-pill";
import { colors, fontFamily } from "../../../design/theme";
import { SPRING_PRESETS } from "../../../lib/animations";

const FEATURES = [
    { icon: "📦", label: "One-Command Backups" },
    { icon: "📜", label: "Automatic History" },
    { icon: "⚡", label: "Instant Restore" },
    { icon: "📁", label: "Managed Dump Files" },
    { icon: "🔗", label: "Multi-Connection" },
    { icon: "🔍", label: "SQL Queries" },
];

export function FeaturePillsScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const titleEntrance = spring({
        frame,
        fps,
        config: SPRING_PRESETS.gentle,
        durationInFrames: 30,
    });

    return (
        <AbsoluteFill>
            <GridBackground />
            <AbsoluteFill
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 50,
                }}
            >
                <h2
                    style={{
                        fontFamily: fontFamily.sans,
                        fontSize: 52,
                        fontWeight: 700,
                        color: colors.foreground,
                        opacity: titleEntrance,
                        transform: `translateY(${(1 - titleEntrance) * 20}px)`,
                    }}
                >
                    Everything you need.
                </h2>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 16,
                        maxWidth: 800,
                    }}
                >
                    {FEATURES.map((feature, index) => (
                        <FeaturePill
                            key={feature.label}
                            icon={feature.icon}
                            label={feature.label}
                            delay={20 + index * 12}
                        />
                    ))}
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
}
