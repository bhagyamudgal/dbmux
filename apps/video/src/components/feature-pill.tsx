import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { colors, fontFamily } from "../design/theme";
import { SPRING_PRESETS } from "../lib/animations";

type FeaturePillProps = {
    icon: string;
    label: string;
    delay?: number;
};

export function FeaturePill({ icon, label, delay = 0 }: FeaturePillProps) {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const entrance = spring({
        frame: frame - delay,
        fps,
        config: SPRING_PRESETS.bouncy,
        durationInFrames: 30,
    });

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 24px",
                borderRadius: 50,
                backgroundColor: colors.secondary,
                border: `1px solid ${colors.border}`,
                fontFamily: fontFamily.sans,
                fontSize: 20,
                color: colors.foreground,
                opacity: entrance,
                transform: `scale(${entrance}) translateY(${(1 - entrance) * 20}px)`,
            }}
        >
            <span style={{ fontSize: 24 }}>{icon}</span>
            <span>{label}</span>
        </div>
    );
}
