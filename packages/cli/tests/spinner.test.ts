import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockChalk = {
    cyan: (text: string) => text,
    green: (text: string) => text,
    red: (text: string) => text,
    blue: (text: string) => text,
    yellow: (text: string) => text,
    magenta: (text: string) => text,
};

vi.mock("chalk", () => ({ default: mockChalk }));

describe("createSpinner", () => {
    let mockWrite: ReturnType<typeof vi.fn>;
    let mockLog: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockWrite = vi.fn();
        mockLog = vi.fn();
        vi.spyOn(process.stdout, "write").mockImplementation(mockWrite);
        vi.spyOn(console, "log").mockImplementation(mockLog);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("should create and start a spinner", async () => {
        const { createSpinner } = await import("../src/utils/spinner.js");
        const spinner = createSpinner({ text: "Loading..." });

        expect(mockWrite).toHaveBeenCalled();
        expect(mockWrite).toHaveBeenCalledWith(
            expect.stringContaining("Loading...")
        );

        spinner.stop();
    });

    it("should animate through frames", async () => {
        const { createSpinner } = await import("../src/utils/spinner.js");
        const spinner = createSpinner({ text: "Processing" });

        const initialCallCount = mockWrite.mock.calls.length;

        vi.advanceTimersByTime(160);

        expect(mockWrite.mock.calls.length).toBeGreaterThan(initialCallCount);

        spinner.stop();
    });

    it("should update spinner text", async () => {
        const { createSpinner } = await import("../src/utils/spinner.js");
        const spinner = createSpinner({ text: "Initial" });

        spinner.update("Updated text");
        vi.advanceTimersByTime(100);

        const lastCall =
            mockWrite.mock.calls[mockWrite.mock.calls.length - 1][0];
        expect(lastCall).toContain("Updated text");

        spinner.stop();
    });

    it("should show success state with checkmark", async () => {
        const { createSpinner } = await import("../src/utils/spinner.js");
        const spinner = createSpinner({ text: "Processing" });

        spinner.succeed("Done!");

        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Done!"));
    });

    it("should show fail state with x mark", async () => {
        const { createSpinner } = await import("../src/utils/spinner.js");
        const spinner = createSpinner({ text: "Processing" });

        spinner.fail("Failed!");

        expect(mockLog).toHaveBeenCalledWith(
            expect.stringContaining("Failed!")
        );
    });

    it("should stop spinner and clear line", async () => {
        const { createSpinner } = await import("../src/utils/spinner.js");
        const spinner = createSpinner({ text: "Running" });

        const callCountBefore = mockWrite.mock.calls.length;
        spinner.stop();

        vi.advanceTimersByTime(200);

        const callCountAfter = mockWrite.mock.calls.length;
        expect(callCountAfter).toBe(callCountBefore + 1);
    });
});
