import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion";
import { colors, fontFamily } from "../../../design/theme";
import { SPRING_PRESETS } from "../../../lib/animations";

const PAINFUL_CMD =
    "pg_dump --host=prod-db.rds.amazonaws.com --port=5432 --username=admin --format=custom...";

export function PainFlashScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const textEntrance = spring({
        frame,
        fps,
        config: SPRING_PRESETS.snappy,
        durationInFrames: 20,
    });

    const cmdEntrance = spring({
        frame: frame - 15,
        fps,
        config: SPRING_PRESETS.gentle,
        durationInFrames: 25,
    });

    const isShaking = frame > 60 && frame < 80;
    const shakeX = isShaking ? Math.sin(frame * 19) * 4 : 0;
    const shakeY = isShaking ? Math.cos(frame * 23) * 3 : 0;

    const strikeOpacity = interpolate(frame, [70, 80], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
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
                    fontSize: 42,
                    fontWeight: 700,
                    color: colors.foreground,
                    textAlign: "center",
                    opacity: textEntrance,
                    transform: `translateY(${(1 - textEntrance) * 20}px)`,
                }}
            >
                Still doing this?
            </h2>

            <div
                style={{
                    position: "relative",
                    transform: `translate(${shakeX}px, ${shakeY}px)`,
                }}
            >
                <div
                    style={{
                        fontFamily: fontFamily.mono,
                        fontSize: 16,
                        color: colors.error,
                        backgroundColor: colors.terminal.bg,
                        padding: "20px 28px",
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`,
                        maxWidth: 900,
                        opacity: cmdEntrance,
                        wordBreak: "break-all",
                        lineHeight: 1.6,
                    }}
                >
                    <span style={{ color: colors.muted }}>$ </span>
                    {PAINFUL_CMD}
                </div>

                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "-5%",
                        right: "-5%",
                        height: 4,
                        backgroundColor: colors.error,
                        opacity: strikeOpacity,
                        transform: "rotate(-2deg)",
                        boxShadow: `0 0 20px ${colors.error}88`,
                    }}
                />
            </div>
        </AbsoluteFill>
    );
}
