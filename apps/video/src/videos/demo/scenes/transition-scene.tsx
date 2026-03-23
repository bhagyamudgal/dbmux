import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../../../components/grid-background";
import { TerminalWindow } from "../../../components/terminal-window";
import { GlitchEffect } from "../../../components/glitch-effect";
import { colors, fontFamily } from "../../../design/theme";

export function TransitionScene() {
    const frame = useCurrentFrame();

    const flashOpacity = interpolate(frame, [60, 75, 90], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const oldTerminalOpacity = interpolate(frame, [0, 80], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const newTerminalOpacity = interpolate(frame, [80, 110], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const newTerminalScale = interpolate(frame, [80, 110], [0.95, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill>
            <GridBackground />
            <AbsoluteFill
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {frame < 90 && (
                    <div style={{ opacity: oldTerminalOpacity }}>
                        <GlitchEffect
                            startFrame={0}
                            duration={80}
                            intensity={2}
                        >
                            <TerminalWindow title="bash" width={1000}>
                                <div
                                    style={{
                                        fontFamily: fontFamily.mono,
                                        fontSize: 16,
                                        color: colors.error,
                                    }}
                                >
                                    Error: connection timeout...
                                </div>
                            </TerminalWindow>
                        </GlitchEffect>
                    </div>
                )}

                {frame >= 80 && (
                    <div
                        style={{
                            opacity: newTerminalOpacity,
                            transform: `scale(${newTerminalScale})`,
                        }}
                    >
                        <TerminalWindow title="dbmux" width={1000}>
                            <div
                                style={{
                                    fontFamily: fontFamily.mono,
                                    fontSize: 18,
                                    color: colors.muted,
                                    textAlign: "center",
                                    padding: "40px 0",
                                }}
                            >
                                There&apos;s a better way.
                            </div>
                        </TerminalWindow>
                    </div>
                )}
            </AbsoluteFill>

            <AbsoluteFill
                style={{
                    backgroundColor: "white",
                    opacity: flashOpacity,
                }}
            />
        </AbsoluteFill>
    );
}
