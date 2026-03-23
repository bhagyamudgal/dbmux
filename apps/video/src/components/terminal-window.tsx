import type { CSSProperties, ReactNode } from "react";
import { colors } from "../design/theme";
import { fontFamily } from "../design/fonts";

type TerminalWindowProps = {
    children: ReactNode;
    title?: string;
    style?: CSSProperties;
    width?: number;
};

export function TerminalWindow({
    children,
    title = "Terminal",
    style,
    width = 900,
}: TerminalWindowProps) {
    return (
        <div
            style={{
                width,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: `0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px ${colors.border}, 0 0 40px ${colors.glow}`,
                fontFamily: fontFamily.mono,
                ...style,
            }}
        >
            <div
                style={{
                    backgroundColor: colors.terminal.titleBar,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <div
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: colors.terminal.dot.red,
                    }}
                />
                <div
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: colors.terminal.dot.yellow,
                    }}
                />
                <div
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: colors.terminal.dot.green,
                    }}
                />
                <span
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        color: colors.muted,
                        fontSize: 13,
                        fontFamily: fontFamily.sans,
                    }}
                >
                    {title}
                </span>
                <div style={{ width: 60 }} />
            </div>
            <div
                style={{
                    backgroundColor: colors.terminal.bg,
                    padding: "24px 28px",
                    minHeight: 200,
                    fontSize: 18,
                    lineHeight: 1.7,
                    color: colors.foreground,
                }}
            >
                {children}
            </div>
        </div>
    );
}
