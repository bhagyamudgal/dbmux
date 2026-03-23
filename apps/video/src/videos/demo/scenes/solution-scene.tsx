import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { GridBackground } from "../../../components/grid-background";
import { TerminalWindow } from "../../../components/terminal-window";
import { TypewriterText } from "../../../components/typewriter-text";
import { CommandOutput } from "../../../components/command-output";
import { colors, fontFamily } from "../../../design/theme";
import { secondsToFrames } from "../../../lib/timing";

function Prompt({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                fontFamily: fontFamily.mono,
                fontSize: 18,
                lineHeight: 1.8,
            }}
        >
            <span style={{ color: colors.success }}>~</span>
            <span style={{ color: colors.muted }}> $ </span>
            {children}
        </div>
    );
}

const DUMP_START = 0;
const HISTORY_START = secondsToFrames(6);
const RESTORE_START = secondsToFrames(10);

function DumpBlock({ frame }: { frame: number }) {
    const localFrame = frame - DUMP_START;
    if (localFrame < 0) return null;

    return (
        <div>
            <Prompt>
                <TypewriterText
                    text="dbmux dump create"
                    startFrame={DUMP_START}
                    charsPerFrame={1}
                    color={colors.foreground}
                />
            </Prompt>
            {localFrame > 40 && (
                <CommandOutput
                    startFrame={DUMP_START + 40}
                    lines={[
                        {
                            text: "Creating backup of myapp_production...",
                            color: colors.muted,
                        },
                        {
                            text: "Compressing... 24.3 MB",
                            color: colors.muted,
                            delay: 15,
                        },
                        {
                            text: "Backup saved to ~/.dbmux/dumps/myapp_20260302_143022.dump",
                            color: colors.success,
                            delay: 30,
                        },
                    ]}
                />
            )}
        </div>
    );
}

function HistoryBlock({ frame }: { frame: number }) {
    const localFrame = frame - HISTORY_START;
    if (localFrame < 0) return null;

    const tableRows = [
        { id: "#1", date: "2026-03-02 14:30", size: "24.3 MB", status: "OK" },
        { id: "#2", date: "2026-03-01 09:15", size: "23.8 MB", status: "OK" },
        { id: "#3", date: "2026-02-28 18:45", size: "22.1 MB", status: "OK" },
    ];

    return (
        <div>
            <Prompt>
                <TypewriterText
                    text="dbmux history list"
                    startFrame={HISTORY_START}
                    charsPerFrame={1}
                    color={colors.foreground}
                />
            </Prompt>
            {localFrame > 40 && (
                <div
                    style={{
                        marginTop: 12,
                        fontFamily: fontFamily.mono,
                        fontSize: 15,
                    }}
                >
                    <div
                        style={{
                            color: colors.muted,
                            borderBottom: `1px solid ${colors.border}`,
                            paddingBottom: 6,
                            marginBottom: 6,
                            display: "flex",
                            gap: 40,
                        }}
                    >
                        <span style={{ width: 40 }}>ID</span>
                        <span style={{ width: 160 }}>Date</span>
                        <span style={{ width: 80 }}>Size</span>
                        <span style={{ width: 60 }}>Status</span>
                    </div>
                    {tableRows.map((row, i) => {
                        const rowLocalDelay = 45 + i * 8;
                        if (localFrame < rowLocalDelay) return null;
                        const rowOpacity = interpolate(
                            localFrame,
                            [rowLocalDelay, rowLocalDelay + 8],
                            [0, 1],
                            {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                            }
                        );
                        return (
                            <div
                                key={row.id}
                                style={{
                                    display: "flex",
                                    gap: 40,
                                    color: colors.foreground,
                                    lineHeight: 1.8,
                                    opacity: rowOpacity,
                                    transform: `translateY(${(1 - rowOpacity) * 6}px)`,
                                }}
                            >
                                <span
                                    style={{
                                        width: 40,
                                        color: colors.primaryLight,
                                    }}
                                >
                                    {row.id}
                                </span>
                                <span style={{ width: 160 }}>{row.date}</span>
                                <span style={{ width: 80 }}>{row.size}</span>
                                <span
                                    style={{ width: 60, color: colors.success }}
                                >
                                    {row.status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function RestoreBlock({ frame }: { frame: number }) {
    const localFrame = frame - RESTORE_START;
    if (localFrame < 0) return null;

    return (
        <div>
            <Prompt>
                <TypewriterText
                    text="dbmux restore run"
                    startFrame={RESTORE_START}
                    charsPerFrame={1}
                    color={colors.foreground}
                />
            </Prompt>
            {localFrame > 40 && (
                <CommandOutput
                    startFrame={RESTORE_START + 40}
                    lines={[
                        {
                            text: "Restoring from myapp_20260302_143022.dump...",
                            color: colors.muted,
                        },
                        {
                            text: "Creating database myapp_staging...",
                            color: colors.muted,
                            delay: 20,
                        },
                        {
                            text: "Restore complete. 142 tables, 1.2M rows.",
                            color: colors.success,
                            delay: 40,
                        },
                    ]}
                />
            )}
        </div>
    );
}

export function SolutionScene() {
    const frame = useCurrentFrame();

    const activeSection =
        frame < HISTORY_START
            ? "dump"
            : frame < RESTORE_START
              ? "history"
              : "restore";

    return (
        <AbsoluteFill>
            <GridBackground />
            <AbsoluteFill
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <TerminalWindow title="dbmux" width={1000}>
                    {activeSection === "dump" && <DumpBlock frame={frame} />}
                    {activeSection === "history" && (
                        <HistoryBlock frame={frame} />
                    )}
                    {activeSection === "restore" && (
                        <RestoreBlock frame={frame} />
                    )}
                </TerminalWindow>
            </AbsoluteFill>
        </AbsoluteFill>
    );
}
