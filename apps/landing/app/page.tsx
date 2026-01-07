import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { Installation } from "@/components/sections/installation";
import { HowItWorks } from "@/components/sections/how-it-works";
import { BGPattern } from "@/components/ui/bg-pattern";

export default function Home() {
    return (
        <div className="relative min-h-screen">
            <BGPattern
                variant="grid"
                mask="fade-edges"
                size={48}
                fill="rgba(128, 128, 128, 0.15)"
            />
            <Header />
            <main>
                <Hero />
                <Features />
                <Installation />
                <HowItWorks />
            </main>
            <Footer />
        </div>
    );
}
