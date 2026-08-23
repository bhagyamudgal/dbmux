"use client";

import { getDocsNeighbors } from "@/lib/docs-nav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DocsPager() {
    const pathname = usePathname();
    const { previous, next } = getDocsNeighbors(pathname);

    return (
        <nav
            aria-label="Pagination"
            className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 border-t border-border pt-8"
        >
            <div>
                {previous && (
                    <Link
                        href={previous.href}
                        className="group flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors outline-none hover:border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Previous
                        </span>
                        <span className="font-mono text-sm text-primary">
                            {previous.title}
                        </span>
                    </Link>
                )}
            </div>
            <div className="justify-self-end text-right">
                {next && (
                    <Link
                        href={next.href}
                        className="group flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors outline-none hover:border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                        <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                            Next
                            <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-mono text-sm text-primary">
                            {next.title}
                        </span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
