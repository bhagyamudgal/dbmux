import { AbsoluteFill, Sequence } from "remotion";
import { LogoIntroScene } from "./scenes/logo-intro-scene";
import { PainFlashScene } from "./scenes/pain-flash-scene";
import { SolutionFlashScene } from "./scenes/solution-flash-scene";
import { FeaturesGridScene } from "./scenes/features-grid-scene";
import { CtaScene } from "./scenes/cta-scene";
import { secondsToFrames } from "../../lib/timing";

export function SocialTeaser() {
    return (
        <AbsoluteFill>
            <Sequence
                from={0}
                durationInFrames={secondsToFrames(2.5)}
                name="LogoIntro"
            >
                <LogoIntroScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(2.5)}
                durationInFrames={secondsToFrames(3)}
                name="PainFlash"
            >
                <PainFlashScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(5.5)}
                durationInFrames={secondsToFrames(4)}
                name="SolutionFlash"
            >
                <SolutionFlashScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(9.5)}
                durationInFrames={secondsToFrames(3)}
                name="FeaturesGrid"
            >
                <FeaturesGridScene />
            </Sequence>

            <Sequence
                from={secondsToFrames(12.5)}
                durationInFrames={secondsToFrames(2.5)}
                name="CTA"
            >
                <CtaScene />
            </Sequence>
        </AbsoluteFill>
    );
}
