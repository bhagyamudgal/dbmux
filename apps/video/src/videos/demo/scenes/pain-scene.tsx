import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    spring,
} from "remotion";
import { GridBackground } from "../../../components/grid-background";
import { TerminalWindow } from "../../../components/terminal-window";
import { TypewriterText } from "../../../components/typewriter-text";
import { SPRING_PRESETS } from "../../../lib/animations";
import { colors, fontFamily } from "../../../design/theme";

const PAINFUL_COMMAND =
    'pg_dump --host=prod-db-1.us-east-1.rds.amazonaws.com --port=5432 --username=admin --dbname=myapp_production --format=custom --compress=9 --verbose --file="/backups/myapp_$(date +%Y%m%d_%H%M%S).dump" 2>&1 | tee -a /var/log/backup.log';

export function PainScene() {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const terminalEntrance = spring({
        frame,
        fps,
        config: SPRING_PRESETS.gentle,
        durationInFrames: 30,
    });

    const shakeStart = 180;
    const isShaking = frame > shakeStart && frame < shakeStart + 30;
    const shakeX = isShaking ? Math.sin(frame * 19) * 3 : 0;
    const shakeY = isShaking ? Math.cos(frame * 23) * 2 : 0;

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
                <div
                    style={{
                        opacity: terminalEntrance,
                        transform: `scale(${0.9 + terminalEntrance * 0.1}) translateY(${(1 - terminalEntrance) * 30}px) translate(${shakeX}px, ${shakeY}px)`,
                    }}
                >
                    <TerminalWindow title="bash" width={1000}>
                        <div
                            style={{
                                fontFamily: fontFamily.mono,
                                fontSize: 16,
                                lineHeight: 1.8,
                            }}
                        >
                            <span style={{ color: colors.success }}>
                                user@prod
                            </span>
                            <span style={{ color: colors.muted }}>:</span>
                            <span style={{ color: colors.primaryLight }}>
                                ~
                            </span>
                            <span style={{ color: colors.muted }}>$ </span>
                            <TypewriterText
                                text={PAINFUL_COMMAND}
                                startFrame={20}
                                charsPerFrame={1.5}
                                color={colors.foreground}
                                showCursor={true}
                            />
                        </div>
                    </TerminalWindow>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
}
