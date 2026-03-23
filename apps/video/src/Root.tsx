import "./index.css";
import { Composition } from "remotion";
import { Demo } from "./videos/demo";
import { SocialTeaser } from "./videos/social-teaser";
import { GitHubBanner } from "./videos/github-banner";
import { FPS, secondsToFrames } from "./lib/timing";

export function Root() {
    return (
        <>
            <Composition
                id="Demo"
                component={Demo}
                durationInFrames={1350}
                fps={FPS}
                width={1920}
                height={1080}
            />
            <Composition
                id="SocialTeaser"
                component={SocialTeaser}
                durationInFrames={secondsToFrames(15)}
                fps={FPS}
                width={1080}
                height={1080}
            />
            <Composition
                id="GitHubBanner"
                component={GitHubBanner}
                durationInFrames={secondsToFrames(8)}
                fps={FPS}
                width={1280}
                height={640}
            />
        </>
    );
}
