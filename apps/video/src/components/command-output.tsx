import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { colors } from "../design/theme";
import { SPRING_PRESETS } from "../lib/animations";

type OutputLine = {
    text: string;
    color?: string;
    delay?: number;
};

type CommandOutputProps = {
    lines: OutputLine[];
    startFrame?: number;
    staggerFrames?: number;
};

export function CommandOutput({
    lines,
    startFrame = 0,
    staggerFrames = 6,
}: CommandOutputProps) {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {lines.map((line, index) => {
                const lineDelay =
                    startFrame + index * staggerFrames + (line.delay ?? 0);
                const progress = spring({
                    frame: frame - lineDelay,
                    fps,
                    config: SPRING_PRESETS.snappy,
                    durationInFrames: 15,
                });

                if (frame < lineDelay) return null;

                return (
                    <div
                        key={`${line.text}-${index}`}
                        style={{
                            opacity: progress,
                            transform: `translateY(${(1 - progress) * 8}px)`,
                            color: line.color ?? colors.muted,
                        }}
                    >
                        {line.text}
                    </div>
                );
            })}
        </div>
    );
}
