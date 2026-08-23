"use client";

import { docsNav } from "@/lib/docs-nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const focusRing =
    "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

function NavLink({ href, title }: { href: string; title: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "block rounded-md px-3 py-2 font-mono text-sm transition-colors",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                focusRing
            )}
        >
            {title}
        </Link>
    );
}

export function DocsSidebarRail() {
    return (
        <nav aria-label="Docs" className="space-y-8">
            {docsNav.map((section) => (
                <div key={section.label}>
                    <p className="px-3 text-xs font-semibold tracking-wider text-foreground uppercase">
                        {section.label}
                    </p>
                    <ul className="mt-2 space-y-0.5">
                        {section.items.map((item) => (
                            <li key={item.href}>
                                <NavLink href={item.href} title={item.title} />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

export function DocsSidebarStrip() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Docs pages"
            className="mb-8 flex gap-2 overflow-x-auto pb-2 lg:hidden"
        >
            {docsNav.flatMap((section) =>
                section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "shrink-0 rounded-full border px-4 py-2.5 font-mono text-xs leading-none whitespace-nowrap transition-colors",
                                isActive
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:text-foreground",
                                focusRing
                            )}
                        >
                            {item.title}
                        </Link>
                    );
                })
            )}
        </nav>
    );
}
