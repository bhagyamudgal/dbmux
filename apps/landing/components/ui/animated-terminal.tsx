"use client";

import { cn } from "@/lib/utils";

type TerminalLine = {
    text: string;
    type: "command" | "output" | "blank";
};

const TERMINAL_LINES: TerminalLine[] = [
    {
        text: "dbmux connect --url postgresql://localhost:5432/myapp",
        type: "command",
    },
    { text: "  Connected to myapp (PostgreSQL 16.2)", type: "output" },
    { text: "", type: "blank" },
    { text: "dbmux dump create", type: "command" },
    { text: "  Dumping myapp... done (14.2 MB)", type: "output" },
    { text: "  Saved to ~/.dbmux/dumps/myapp_2024-03-15.dump", type: "output" },
    { text: "", type: "blank" },
    { text: "dbmux history list", type: "command" },
    { text: "  #  Database  Size     Date", type: "output" },
    { text: "  1  myapp     14.2 MB  2024-03-15 14:30", type: "output" },
    { text: "  2  myapp     13.8 MB  2024-03-14 09:15", type: "output" },
];

type AnimatedTerminalProps = {
    className?: string;
};

export function AnimatedTerminal({ className }: AnimatedTerminalProps) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border border-primary/20 bg-[oklch(0.10_0.005_250)] terminal-glow",
                className
            )}
        >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <span className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="ml-2 font-mono text-xs text-white/50">
                    Terminal
                </span>
            </div>

            <div className="p-5 font-mono text-sm leading-relaxed">
                {TERMINAL_LINES.map((line, index) => {
                    if (line.type === "blank") {
                        return (
                            <div
                                key={index}
                                className="h-4 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            />
                        );
                    }

                    return (
                        <div
                            key={index}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.2}s` }}
                        >
                            {line.type === "command" ? (
                                <span>
                                    <span className="text-green-400">$ </span>
                                    <span className="text-white">
                                        {line.text}
                                    </span>
                                </span>
                            ) : (
                                <span className="text-white/60">
                                    {line.text}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div
                    className="mt-1 animate-fade-in-up"
                    style={{
                        animationDelay: `${TERMINAL_LINES.length * 0.2}s`,
                    }}
                >
                    <span className="text-green-400">$ </span>
                    <span className="inline-block h-4 w-2 translate-y-0.5 animate-blink-caret bg-green-400" />
                </div>
            </div>
        </div>
    );
}
