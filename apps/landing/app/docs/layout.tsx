import { DocsSidebarRail, DocsSidebarStrip } from "@/components/docs/sidebar";
import { DocsPager } from "@/components/docs/pager";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "dbmux documentation",
        template: "%s | dbmux docs",
    },
    description:
        "Command reference for dbmux, the PostgreSQL backup CLI: connect, query, dump, restore, and more.",
};

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pt-20">
            <div className="mx-auto flex max-w-7xl gap-10 px-4 sm:px-6 lg:px-8">
                <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] w-56 shrink-0 overflow-y-auto py-10 lg:block">
                    <DocsSidebarRail />
                </aside>
                <main
                    id="main-content"
                    className="min-w-0 flex-1 py-10"
                >
                    <DocsSidebarStrip />
                    <article className="docs-prose mx-auto max-w-3xl">
                        {children}
                    </article>
                    <DocsPager />
                </main>
            </div>
        </div>
    );
}
