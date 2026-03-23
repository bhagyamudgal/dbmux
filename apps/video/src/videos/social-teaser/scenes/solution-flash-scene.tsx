import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion";
import { TerminalWindow } from "../../../components/terminal-window";
import { TypewriterText } from "../../../components/typewriter-text";
import { colors, fontFamily } from "../../../design/theme";
import { SPRING_PRESETS } from "../../../lib/animations";

export function SolutionFlashScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const termEntrance = spring({
        frame,
        fps,
        config: SPRING_PRESETS.snappy,
        durationInFrames: 20,
    });

    const outputOpacity = spring({
        frame: frame - 50,
        fps,
        config: SPRING_PRESETS.gentle,
        durationInFrames: 20,
    });

    const checkScale = spring({
        frame: frame - 80,
        fps,
        config: SPRING_PRESETS.bouncy,
        durationInFrames: 25,
    });

    const glowPulse = interpolate(
        Math.sin(((frame - 80) / fps) * Math.PI * 2),
        [-1, 1],
        [0.2, 0.5]
    );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 30,
                padding: 60,
            }}
        >
            <div
                style={{
                    opacity: termEntrance,
                    transform: `scale(${0.95 + termEntrance * 0.05})`,
                }}
            >
                <TerminalWindow title="dbmux" width={850}>
                    <div
                        style={{
                            fontFamily: fontFamily.mono,
                            fontSize: 18,
                            lineHeight: 1.8,
                        }}
                    >
                        <div>
                            <span style={{ color: colors.primary }}>~</span>
                            <span style={{ color: colors.muted }}> $ </span>
                            <TypewriterText
                                text="dbmux dump create"
                                startFrame={10}
                                charsPerFrame={1.2}
                                color={colors.foreground}
                            />
                        </div>
                        {frame > 50 && (
                            <div
                                style={{ opacity: outputOpacity, marginTop: 8 }}
                            >
                                <div style={{ color: colors.muted }}>
                                    Dumping myapp... done (14.2 MB)
                                </div>
                                <div style={{ color: colors.success }}>
                                    Saved to ~/.dbmux/dumps/myapp_20260323.dump
                                </div>
                            </div>
                        )}
                    </div>
                </TerminalWindow>
            </div>

            {frame > 80 && (
                <div
                    style={{
                        fontFamily: fontFamily.sans,
                        fontSize: 28,
                        fontWeight: 600,
                        color: colors.primary,
                        opacity: checkScale,
                        transform: `scale(${checkScale})`,
                        filter: `drop-shadow(0 0 ${20 * glowPulse}px ${colors.glowStrong})`,
                    }}
                >
                    That&apos;s it. One command.
                </div>
            )}
        </AbsoluteFill>
    );
}
