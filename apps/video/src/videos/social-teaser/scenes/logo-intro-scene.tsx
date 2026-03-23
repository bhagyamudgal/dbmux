import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion";
import { Logo } from "../../../components/logo";
import { colors } from "../../../design/theme";
import { SPRING_PRESETS } from "../../../lib/animations";

export function LogoIntroScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const logoScale = spring({
        frame,
        fps,
        config: SPRING_PRESETS.bouncy,
        durationInFrames: 25,
    });

    const glowRadius = interpolate(
        Math.sin((frame / fps) * Math.PI * 2),
        [-1, 1],
        [30, 60]
    );

    const ringScale = spring({
        frame: frame - 10,
        fps,
        config: { damping: 30, mass: 1, stiffness: 80 },
        durationInFrames: 40,
    });

    const ringOpacity = interpolate(frame, [10, 50, 70], [0, 0.4, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    border: `2px solid ${colors.primary}`,
                    opacity: ringOpacity,
                    transform: `scale(${ringScale * 2})`,
                    position: "absolute",
                }}
            />

            <div
                style={{
                    opacity: logoScale,
                    transform: `scale(${0.6 + logoScale * 0.4})`,
                    filter: `drop-shadow(0 0 ${glowRadius}px ${colors.glowStrong})`,
                }}
            >
                <Logo fontSize={80} />
            </div>
        </AbsoluteFill>
    );
}
