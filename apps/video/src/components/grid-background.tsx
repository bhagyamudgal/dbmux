import { AbsoluteFill } from "remotion";
import { colors } from "../design/theme";

type GridBackgroundProps = {
    gridSize?: number;
    gridColor?: string;
};

export function GridBackground({
    gridSize = 48,
    gridColor = colors.mutedSubtle,
}: GridBackgroundProps) {
    return (
        <AbsoluteFill
            style={{
                backgroundColor: colors.background,
            }}
        >
            <AbsoluteFill
                style={{
                    backgroundImage: `linear-gradient(to right, ${gridColor}22 1px, transparent 1px), linear-gradient(to bottom, ${gridColor}22 1px, transparent 1px)`,
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    maskImage:
                        "radial-gradient(ellipse at center, black 30%, transparent 70%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 30%, transparent 70%)",
                }}
            />
        </AbsoluteFill>
    );
}
