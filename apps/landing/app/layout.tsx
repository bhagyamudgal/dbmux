import type { Metadata } from "next";
import { Noto_Sans as notoSansFont } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const notoSans = notoSansFont({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "dbmux - Database Backups Made Simple",
    description:
        "Skip the pg_dump syntax lookup. dbmux gives you simple commands with smart defaults, automatic history tracking, and organized dump files.",
    keywords: [
        "database backup",
        "postgresql",
        "pg_dump",
        "cli tool",
        "database restore",
        "postgres backup",
        "database management",
    ],
    authors: [{ name: "Bhagya Mudgal" }],
    openGraph: {
        title: "dbmux - Database Backups Made Simple",
        description:
            "Skip the pg_dump syntax lookup. Simple commands with smart defaults, automatic history tracking, and organized dump files.",
        type: "website",
        locale: "en_US",
        siteName: "dbmux",
    },
    twitter: {
        card: "summary_large_image",
        title: "dbmux - Database Backups Made Simple",
        description:
            "Skip the pg_dump syntax lookup. Simple commands with smart defaults, automatic history tracking, and organized dump files.",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${notoSans.variable} font-sans antialiased`}>
                <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
            </body>
        </html>
    );
}
