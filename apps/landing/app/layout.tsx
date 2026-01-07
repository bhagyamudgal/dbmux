import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "DBMux - Database Management CLI",
    description:
        "A flexible database management CLI tool with persistent configuration",
};

/**
 * Root layout component that renders an HTML document with lang="en" and places `children` inside the document body.
 *
 * @param children - Content to render inside the <body> element.
 * @returns A JSX element representing the top-level HTML structure containing the provided children.
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}