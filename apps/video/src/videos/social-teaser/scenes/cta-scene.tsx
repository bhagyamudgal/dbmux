import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion";
import { Logo } from "../../../components/logo";
import { colors, fontFamily } from "../../../design/theme";
import { SPRING_PRESETS } from "../../../lib/animations";

export function CtaScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const logoEntrance = spring({
        frame,
        fps,
        config: SPRING_PRESETS.bouncy,
        durationInFrames: 25,
    });

    const installEntrance = spring({
        frame: frame - 20,
        fps,
        config: SPRING_PRESETS.snappy,
        durationInFrames: 20,
    });

    const tagEntrance = spring({
        frame: frame - 35,
        fps,
        config: SPRING_PRESETS.gentle,
        durationInFrames: 25,
    });

    const glowPulse = interpolate(
        Math.sin((frame / fps) * Math.PI * 1.5),
        [-1, 1],
        [0.3, 0.7]
    );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
            }}
        >
            <div
                style={{
                    opacity: logoEntrance,
                    transform: `scale(${0.7 + logoEntrance * 0.3})`,
                    filter: `drop-shadow(0 0 ${40 * glowPulse}px ${colors.glowStrong})`,
                }}
            >
                <Logo fontSize={72} />
            </div>

            <div
                style={{
                    padding: "14px 28px",
                    borderRadius: 8,
                    backgroundColor: colors.secondary,
                    border: `1px solid ${colors.primary}40`,
                    fontFamily: fontFamily.mono,
                    fontSize: 20,
                    color: colors.foreground,
                    opacity: installEntrance,
                    transform: `translateY(${(1 - installEntrance) * 10}px)`,
                    boxShadow: `0 0 30px ${colors.glow}`,
                }}
            >
                <span style={{ color: colors.muted }}>$ </span>
                npm install -g dbmux
            </div>

            <p
                style={{
                    fontFamily: fontFamily.sans,
                    fontSize: 18,
                    color: colors.muted,
                    fontWeight: 400,
                    opacity: tagEntrance,
                }}
            >
                Database Backups Made Simple
            </p>
        </AbsoluteFill>
    );
}
