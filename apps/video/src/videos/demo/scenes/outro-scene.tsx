import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion";
import { GridBackground } from "../../../components/grid-background";
import { Logo } from "../../../components/logo";
import { colors, fontFamily } from "../../../design/theme";
import { SPRING_PRESETS } from "../../../lib/animations";

export function OutroScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const logoEntrance = spring({
        frame,
        fps,
        config: SPRING_PRESETS.bouncy,
        durationInFrames: 30,
    });

    const taglineEntrance = spring({
        frame: frame - 15,
        fps,
        config: SPRING_PRESETS.gentle,
        durationInFrames: 30,
    });

    const installEntrance = spring({
        frame: frame - 30,
        fps,
        config: SPRING_PRESETS.snappy,
        durationInFrames: 30,
    });

    const glowPulse = interpolate(
        Math.sin((frame / fps) * Math.PI),
        [-1, 1],
        [0.3, 0.6]
    );

    return (
        <AbsoluteFill>
            <GridBackground />
            <AbsoluteFill
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 30,
                }}
            >
                <div
                    style={{
                        opacity: logoEntrance,
                        transform: `scale(${0.8 + logoEntrance * 0.2})`,
                        filter: `drop-shadow(0 0 ${40 * glowPulse}px ${colors.primary}66)`,
                    }}
                >
                    <Logo fontSize={96} />
                </div>

                <p
                    style={{
                        fontFamily: fontFamily.sans,
                        fontSize: 32,
                        color: colors.muted,
                        fontWeight: 500,
                        opacity: taglineEntrance,
                        transform: `translateY(${(1 - taglineEntrance) * 15}px)`,
                    }}
                >
                    Database Backups Made Simple
                </p>

                <div
                    style={{
                        marginTop: 20,
                        padding: "14px 28px",
                        borderRadius: 8,
                        backgroundColor: colors.secondary,
                        border: `1px solid ${colors.border}`,
                        fontFamily: fontFamily.mono,
                        fontSize: 22,
                        color: colors.foreground,
                        opacity: installEntrance,
                        transform: `translateY(${(1 - installEntrance) * 10}px)`,
                    }}
                >
                    <span style={{ color: colors.muted }}>$ </span>
                    npm install -g dbmux
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
}
