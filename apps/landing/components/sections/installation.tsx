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
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        Get started in seconds
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Install dbmux with your preferred method
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl">
                    <Tabs defaultValue="curl" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="curl">
                                Quick Install
                            </TabsTrigger>
                            <TabsTrigger value="npm">npm</TabsTrigger>
                            <TabsTrigger value="bun">bun</TabsTrigger>
                        </TabsList>

                        {(Object.keys(INSTALL_COMMANDS) as InstallMethod[]).map(
                            (method) => (
                                <TabsContent key={method} value={method}>
                                    <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm">
                                        <pre className="overflow-hidden truncate pr-12 font-mono text-sm text-foreground">
                                            <code>
                                                {INSTALL_COMMANDS[method]}
                                            </code>
                                        </pre>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-4 right-4 h-8 w-8 rounded-md bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                            onClick={() =>
                                                copyToClipboard(method)
                                            }
                                        >
                                            {copied === method ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TabsContent>
                            )
                        )}
                    </Tabs>

                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        {[
                            "Linux x64",
                            "macOS Intel",
                            "macOS ARM",
                            "Windows x64",
                        ].map((platform) => (
                            <span
                                key={platform}
                                className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground"
                            >
                                {platform}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
