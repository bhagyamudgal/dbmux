export const FPS = 30;

export function secondsToFrames(seconds: number): number {
    return Math.round(seconds * FPS);
}

export function framesToSeconds(frames: number): number {
    return frames / FPS;
}

export function frameRange(startSec: number, durationSec: number) {
    return {
        from: secondsToFrames(startSec),
        durationInFrames: secondsToFrames(durationSec),
    };
}
