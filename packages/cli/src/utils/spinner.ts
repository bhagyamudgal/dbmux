import chalk from "chalk";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const FRAME_INTERVAL = 80;

type SpinnerColor = "blue" | "green" | "yellow" | "red" | "cyan" | "magenta";

type SpinnerOptions = {
    text: string;
    color?: SpinnerColor;
};

type SpinnerInstance = {
    update: (text: string) => void;
    succeed: (text: string) => void;
    fail: (text: string) => void;
    stop: () => void;
};

export function createSpinner(options: SpinnerOptions): SpinnerInstance {
    let frameIndex = 0;
    let currentText = options.text;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isActive = true;
    const colorFn = chalk[options.color ?? "cyan"];

    function render(): void {
        if (!isActive) return;
        const frame = SPINNER_FRAMES[frameIndex];
        process.stdout.write(`\r${colorFn(frame)} ${currentText}`);
        frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    }

    function clearLine(): void {
        process.stdout.write("\r" + " ".repeat(currentText.length + 4) + "\r");
    }

    intervalId = setInterval(render, FRAME_INTERVAL);
    render();

    return {
        update(text: string): void {
            currentText = text;
        },
        succeed(text: string): void {
            isActive = false;
            if (intervalId) clearInterval(intervalId);
            clearLine();
            console.log(`${chalk.green("✓")} ${text}`);
        },
        fail(text: string): void {
            isActive = false;
            if (intervalId) clearInterval(intervalId);
            clearLine();
            console.log(`${chalk.red("✗")} ${text}`);
        },
        stop(): void {
            isActive = false;
            if (intervalId) clearInterval(intervalId);
            clearLine();
        },
    };
}

export type { SpinnerInstance, SpinnerOptions };
