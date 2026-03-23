import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const ibmPlexSans = loadIBMPlexSans("normal", {
    weights: ["300", "400", "500", "600", "700"],
    subsets: ["latin"],
});
const jetBrainsMono = loadJetBrainsMono("normal", {
    weights: ["400", "700"],
    subsets: ["latin"],
});

export const fontFamily = {
    sans: ibmPlexSans.fontFamily,
    mono: jetBrainsMono.fontFamily,
} as const;
