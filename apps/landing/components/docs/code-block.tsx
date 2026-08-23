"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CodeBlockProps = React.ComponentProps<"pre"> & {
    "data-language"?: string;
};

type CopyState = "copied" | "failed" | null;

export function CodeBlock({ children, ...props }: CodeBlockProps) {
    const [copyState, setCopyState] = useState<CopyState>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const resetTimerRef = useRef<number>(null);
    const language = props["data-language"];

    useEffect(() => {
        return () => {
            if (resetTimerRef.current !== null) {
                window.clearTimeout(resetTimerRef.current);
            }
        };
    }, []);

    async function handleCopy() {
        const text = preRef.current?.querySelector("code")?.textContent ?? "";
        try {
            await navigator.clipboard.writeText(text);
            setCopyState("copied");
        } catch {
            setCopyState("failed");
        }
        if (resetTimerRef.current !== null) {
            window.clearTimeout(resetTimerRef.current);
        }
        resetTimerRef.current = window.setTimeout(() => {
            setCopyState(null);
            resetTimerRef.current = null;
        }, 2000);
    }

    return (
        <div className="group relative my-6 overflow-hidden rounded-xl border border-primary/20 bg-[oklch(0.10_0.005_250)] terminal-glow">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                    <span className="ml-3 font-mono text-xs text-white/60">
                        {language ?? "shell"}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span role="status" className="sr-only">
                        {copyState === "copied"
                            ? "Copied to clipboard"
                            : copyState === "failed"
                              ? "Copy failed"
                              : undefined}
                    </span>
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label="Copy code"
                        className="rounded-md p-2 -m-1 text-white/60 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                        {copyState === "copied" ? (
                            <Check className="h-4 w-4 text-primary" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
            <pre
                ref={preRef}
                {...props}
                className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-white"
            >
                {children}
            </pre>
        </div>
    );
}
