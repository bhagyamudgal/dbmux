import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { VideoShowcase } from "@/components/sections/video-showcase";
import { Features } from "@/components/sections/features";
import { Installation } from "@/components/sections/installation";
import { HowItWorks } from "@/components/sections/how-it-works";
import { BGPattern } from "@/components/ui/bg-pattern";

export default function Home() {
    return (
        <div className="relative min-h-screen">
            <BGPattern
                variant="dots"
                mask="fade-edges"
                size={32}
                fill="oklch(0.72 0.19 145 / 0.06)"
            />
            <Header />
            <main>
                <Hero />
                <VideoShowcase />
                <Features />
                <Installation />
                <HowItWorks />
            </main>
            <Footer />
        </div>
    );
}
