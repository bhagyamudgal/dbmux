import { interpolate, spring, type SpringConfig } from "remotion";

type PartialSpringConfig = Partial<SpringConfig>;

export const SPRING_PRESETS = {
    snappy: {
        damping: 15,
        mass: 0.5,
        stiffness: 200,
    } satisfies PartialSpringConfig,
    gentle: {
        damping: 20,
        mass: 1,
        stiffness: 100,
    } satisfies PartialSpringConfig,
    bouncy: {
        damping: 10,
        mass: 0.8,
        stiffness: 180,
    } satisfies PartialSpringConfig,
} as const;

export function springIn(
    frame: number,
    fps: number,
    delay: number = 0,
    config: PartialSpringConfig = SPRING_PRESETS.snappy
) {
    return spring({ frame: frame - delay, fps, config, durationInFrames: 30 });
}

export function fadeIn(
    frame: number,
    startFrame: number,
    duration: number = 15
) {
    return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
}

export function fadeOut(
    frame: number,
    startFrame: number,
    duration: number = 15
) {
    return interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
}

export function slideIn(
    frame: number,
    fps: number,
    delay: number = 0,
    direction: "left" | "right" | "up" | "down" = "up",
    config: PartialSpringConfig = SPRING_PRESETS.snappy
) {
    const progress = springIn(frame, fps, delay, config);
    const offsets = {
        left: { x: -100, y: 0 },
        right: { x: 100, y: 0 },
        up: { x: 0, y: 50 },
        down: { x: 0, y: -50 },
    };
    const offset = offsets[direction];
    return {
        x: interpolate(progress, [0, 1], [offset.x, 0]),
        y: interpolate(progress, [0, 1], [offset.y, 0]),
        opacity: progress,
    };
}
