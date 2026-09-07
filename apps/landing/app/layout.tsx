import type { Metadata } from "next";
import {
    IBM_Plex_Sans as IBMPlexSans,
    JetBrains_Mono as JetBrainsMono,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const ibmPlexSans = IBMPlexSans({
    subsets: ["latin"],
    variable: "--font-sans",
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const jetbrainsMono = JetBrainsMono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    icons: {
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
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
        images: [
            {
                url: "/og-image.png",
                width: 1280,
                height: 640,
                alt: "dbmux - Database Backups Made Simple",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "dbmux - Database Backups Made Simple",
        description:
            "Skip the pg_dump syntax lookup. Simple commands with smart defaults, automatic history tracking, and organized dump files.",
        images: ["/og-image.png"],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body
                className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
            >
                <ThemeProvider defaultTheme="dark">
                    <a
                        href="#main-content"
                        className="sr-only z-[60] rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
                    >
                        Skip to content
                    </a>
                    <Header />
                    {children}
                    <Footer />
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    );
}
