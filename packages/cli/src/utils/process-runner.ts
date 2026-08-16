import { spawn } from "child_process";

export async function executeCommand(
    command: string,
    args: string[],
    env?: Record<string, string>
): Promise<{ success: boolean; output: string; error: string }> {
    return new Promise((resolve) => {
        const childProcess = spawn(command, args, {
            env: { ...process.env, ...env },
            stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        childProcess.stdout?.on("data", (data: Buffer) => {
            stdout += data.toString();
        });

        childProcess.stderr?.on("data", (data: Buffer) => {
            stderr += data.toString();
        });

        childProcess.on("close", (code: number | null) => {
            resolve({
                success: code === 0,
                output: stdout,
                error: stderr,
            });
        });

        childProcess.on("error", (error: Error) => {
            resolve({
                success: false,
                output: stdout,
                error: error.message,
            });
        });
    });
}
