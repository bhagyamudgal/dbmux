"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { INSTALL_COMMANDS } from "@/lib/constants";

type InstallMethod = keyof typeof INSTALL_COMMANDS;

export function Installation() {
    const [copied, setCopied] = useState<InstallMethod | null>(null);

    async function copyToClipboard(method: InstallMethod) {
        try {
            await navigator.clipboard.writeText(INSTALL_COMMANDS[method]);
            setCopied(method);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
        }
    }

    return (
        <section id="installation" className="py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        Get started in seconds
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Install dbmux with your preferred method
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl">
                    <div className="overflow-hidden rounded-xl border border-primary/20 terminal-glow">
                        <div className="flex items-center gap-2 border-b border-white/10 bg-[oklch(0.10_0.005_250)] px-4 py-3">
                            <div className="flex gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                            </div>
                            <span className="ml-2 font-mono text-xs text-white/50">
                                Install
                            </span>
                        </div>

                        <div className="bg-[oklch(0.10_0.005_250)] p-2">
                            <Tabs defaultValue="curl" className="w-full">
                                <TabsList className="w-full justify-start gap-0 rounded-none border-b border-white/10 bg-transparent p-0">
                                    <TabsTrigger
                                        value="curl"
                                        className="rounded-none border-b-2 border-transparent px-4 py-2 font-mono text-xs text-white/60 data-[state=active]:border-green-400 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                                    >
                                        Quick Install *
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="npm"
                                        className="rounded-none border-b-2 border-transparent px-4 py-2 font-mono text-xs text-white/60 data-[state=active]:border-green-400 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                                    >
                                        npm
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="bun"
                                        className="rounded-none border-b-2 border-transparent px-4 py-2 font-mono text-xs text-white/60 data-[state=active]:border-green-400 data-[state=active]:bg-transparent data-[state=active]:text-green-400 data-[state=active]:shadow-none"
                                    >
                                        bun
                                    </TabsTrigger>
                                </TabsList>

                                {(
                                    Object.keys(
                                        INSTALL_COMMANDS
                                    ) as InstallMethod[]
                                ).map((method) => (
                                    <TabsContent key={method} value={method}>
                                        <div className="relative px-4 py-4">
                                            <pre className="overflow-x-auto pr-12 font-mono text-sm">
                                                <code>
                                                    <span className="text-green-400">
                                                        ${" "}
                                                    </span>
                                                    <span className="text-white">
                                                        {
                                                            INSTALL_COMMANDS[
                                                                method
                                                            ]
                                                        }
                                                    </span>
                                                </code>
                                            </pre>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-3 right-3 h-8 w-8 text-white/50 transition-colors hover:text-green-400"
                                                onClick={() =>
                                                    copyToClipboard(method)
                                                }
                                            >
                                                {copied === method ? (
                                                    <Check className="h-4 w-4 text-green-400" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </div>

                    <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
                        <span className="text-primary">Recommended:</span> Quick
                        Install handles all dependencies automatically
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        {[
                            "Linux x64",
                            "macOS Intel",
                            "macOS ARM",
                            "Windows x64",
                        ].map((platform) => (
                            <span
                                key={platform}
                                className="font-mono text-xs text-muted-foreground"
                            >
                                <span className="text-primary/60">&gt;</span>{" "}
                                {platform}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
