import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "DBMux - Database Management CLI",
    description:
        "A flexible database management CLI tool with persistent configuration",
};

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
