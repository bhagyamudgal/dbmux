import { AbsoluteFill, Sequence } from "remotion";
import { PainScene } from "./scenes/pain-scene";
import { TransitionScene } from "./scenes/transition-scene";
import { SolutionScene } from "./scenes/solution-scene";
import { FeaturePillsScene } from "./scenes/feature-pills-scene";
import { OutroScene } from "./scenes/outro-scene";
import { secondsToFrames } from "../../lib/timing";

export function Demo() {
    return (
        <AbsoluteFill>
            <Sequence
                from={0}
                durationInFrames={secondsToFrames(8)}
                name="Pain"
            >
                <PainScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(8)}
                durationInFrames={secondsToFrames(4)}
                name="Transition"
            >
                <TransitionScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(12)}
                durationInFrames={secondsToFrames(16)}
                name="Solution"
            >
                <SolutionScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(28)}
                durationInFrames={secondsToFrames(10)}
                name="Features"
            >
                <FeaturePillsScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(38)}
                durationInFrames={secondsToFrames(7)}
                name="Outro"
            >
                <OutroScene />
            </Sequence>
        </AbsoluteFill>
    );
}
