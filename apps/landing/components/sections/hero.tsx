"use client";

import { useState } from "react";
import { Github, Check, Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedTerminal } from "@/components/ui/animated-terminal";

const QUICK_INSTALL = "npm install -g dbmux";

export function Hero() {
    const [copied, setCopied] = useState(false);

    async function copyInstall() {
        try {
            await navigator.clipboard.writeText(QUICK_INSTALL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard not available */
        }
    }

    return (
        <section className="relative pt-32 pb-24">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div className="flex flex-col items-start">
                        <Badge
                            variant="outline"
                            className="mb-6 gap-1.5 border-primary/30 px-3 py-1 font-mono text-xs text-primary"
                        >
                            <Terminal className="h-3 w-3" />
                            Open Source CLI Tool
                        </Badge>

                        <h1 className="font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                            Database Backups
                            <span className="mt-2 block text-primary text-glow-green">
                                Made Simple
                            </span>
                        </h1>

                        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                            Skip the pg_dump syntax lookup. dbmux gives you
                            simple commands with smart defaults, automatic
                            history tracking, and organized dump files.
                        </p>

                        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-4">
                            <Button
                                size="lg"
                                className="h-12 px-8 text-base font-semibold"
                                asChild
                            >
                                <a href="#installation">Get Started</a>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 px-8 text-base"
                                asChild
                            >
                                <a
                                    href="https://github.com/bhagyamudgal/dbmux"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Github className="mr-2 h-5 w-5" />
                                    GitHub
                                </a>
                            </Button>
                        </div>

                        <button
                            type="button"
                            onClick={copyInstall}
                            className="mt-6 flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-sm shadow-sm transition-all hover:border-primary/40 hover:shadow-md dark:shadow-none dark:hover:shadow-[0_0_15px_var(--glow-green)]"
                        >
                            <span className="text-primary">$</span>
                            <span className="text-muted-foreground">
                                {QUICK_INSTALL}
                            </span>
                            {copied ? (
                                <Check className="h-4 w-4 text-primary" />
                            ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>
                    </div>

                    <div className="transition-transform duration-300 lg:hover:rotate-1 lg:hover:scale-[1.02]">
                        <AnimatedTerminal />
                    </div>
                </div>
            </div>
        </section>
    );
}
