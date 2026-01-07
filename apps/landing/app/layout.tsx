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
    title: "DBMux - Database Management CLI",
    description:
        "A powerful CLI tool for managing PostgreSQL databases with persistent configuration, backup/restore, and multi-connection support.",
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
