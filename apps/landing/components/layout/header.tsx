"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Github, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#installation", label: "Installation" },
    { href: "#how-it-works", label: "How it Works" },
];

export function Header() {
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    <Link href="/">
                        <Logo size="sm" />
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="hidden sm:flex"
                        >
                            <a
                                href="https://github.com/bhagyamudgal/dbmux"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View on GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                <div
                    className={cn(
                        "overflow-hidden transition-all duration-200 md:hidden",
                        mobileMenuOpen ? "max-h-64 pb-4" : "max-h-0"
                    )}
                >
                    <nav className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <a
                            href="https://github.com/bhagyamudgal/dbmux"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Github className="h-4 w-4" />
                            GitHub
                        </a>
                    </nav>
                </div>
            </div>
        </header>
    );
}
