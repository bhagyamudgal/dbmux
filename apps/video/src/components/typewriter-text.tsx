import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors } from "../design/theme";

type TypewriterTextProps = {
    text: string;
    startFrame?: number;
    charsPerFrame?: number;
    color?: string;
    showCursor?: boolean;
    cursorColor?: string;
};

export function TypewriterText({
    text,
    startFrame = 0,
    charsPerFrame = 0.8,
    color = colors.foreground,
    showCursor = true,
    cursorColor = colors.primary,
}: TypewriterTextProps) {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const elapsed = Math.max(0, frame - startFrame);
    const charsVisible = Math.min(
        Math.floor(elapsed * charsPerFrame),
        text.length
    );
    const visibleText = text.slice(0, charsVisible);
    const isComplete = charsVisible >= text.length;

    const cursorOpacity = isComplete
        ? interpolate(Math.sin((frame / fps) * Math.PI * 2), [-1, 1], [0, 1])
        : 1;

    return (
        <span style={{ color }}>
            {visibleText}
            {showCursor && (
                <span
                    style={{
                        display: "inline-block",
                        width: 10,
                        height: "1em",
                        backgroundColor: cursorColor,
                        marginLeft: 2,
                        opacity: cursorOpacity,
                        verticalAlign: "text-bottom",
                    }}
                />
            )}
        </span>
    );
}
