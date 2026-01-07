import { Github, Package, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type FooterLink = {
    label: string;
    href: string;
    icon?: LucideIcon;
};

type FooterLinks = {
    product: FooterLink[];
    resources: FooterLink[];
    connect: FooterLink[];
};

const footerLinks: FooterLinks = {
    product: [
        { label: "Features", href: "#features" },
        { label: "Installation", href: "#installation" },
        { label: "How it Works", href: "#how-it-works" },
    ],
    resources: [
        {
            label: "Documentation",
            href: "https://github.com/bhagyamudgal/dbmux#readme",
        },
        {
            label: "Changelog",
            href: "https://github.com/bhagyamudgal/dbmux/blob/main/CHANGELOG.md",
        },
        {
            label: "Releases",
            href: "https://github.com/bhagyamudgal/dbmux/releases",
        },
    ],
    connect: [
        {
            label: "GitHub",
            href: "https://github.com/bhagyamudgal/dbmux",
            icon: Github,
        },
        {
            label: "npm",
            href: "https://www.npmjs.com/package/dbmux",
            icon: Package,
        },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-col justify-between gap-12 lg:flex-row">
                    <div className="max-w-xs">
                        <Logo size="sm" />
                        <p className="mt-3 text-sm text-muted-foreground">
                            Simple PostgreSQL backups with smart defaults,
                            automatic history tracking, and organized dump
                            files.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Product
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {footerLinks.product.map((link) => (
                                    <li key={link.href}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Resources
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {footerLinks.resources.map((link) => (
                                    <li key={link.href}>
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Connect
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {footerLinks.connect.map((link) => (
                                    <li key={link.href}>
                                        <a
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-16 overflow-hidden text-center">
                    <Logo size="xl" showCursor />
                </div>

                <div className="mt-8 border-t border-border pt-8">
                    <p className="text-center text-sm text-muted-foreground">
                        Built with TypeScript & Bun. Open source under{" "}
                        <a
                            href="https://github.com/bhagyamudgal/dbmux/blob/main/LICENSE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 hover:text-foreground"
                        >
                            MIT License
                        </a>
                        .
                    </p>
                </div>
            </div>
        </footer>
    );
}
