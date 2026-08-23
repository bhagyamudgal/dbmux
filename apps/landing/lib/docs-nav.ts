export type DocsNavItem = {
    href: string;
    title: string;
};

export type DocsNavSection = {
    label: string;
    items: DocsNavItem[];
};

export const docsNav: DocsNavSection[] = [
    {
        label: "Getting started",
        items: [
            { href: "/docs", title: "Introduction" },
            { href: "/docs/configuration", title: "Configuration" },
        ],
    },
    {
        label: "Commands",
        items: [
            { href: "/docs/connect", title: "connect" },
            { href: "/docs/query", title: "query" },
            { href: "/docs/list", title: "list" },
            { href: "/docs/dump", title: "dump" },
            { href: "/docs/restore", title: "restore" },
            { href: "/docs/db", title: "db" },
            { href: "/docs/config", title: "config" },
            { href: "/docs/history", title: "history" },
            { href: "/docs/status", title: "status" },
            { href: "/docs/disconnect", title: "disconnect" },
            { href: "/docs/update", title: "update" },
        ],
    },
];

export const flatDocsItems: DocsNavItem[] = docsNav.flatMap(
    (section) => section.items,
);

export function getDocsNeighbors(
    pathname: string,
): { previous?: DocsNavItem; next?: DocsNavItem } {
    const index = flatDocsItems.findIndex((item) => item.href === pathname);
    if (index === -1) return {};
    return {
        previous: index > 0 ? flatDocsItems[index - 1] : undefined,
        next:
            index < flatDocsItems.length - 1
                ? flatDocsItems[index + 1]
                : undefined,
    };
}
