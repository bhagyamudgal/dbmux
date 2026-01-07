import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { Installation } from "@/components/sections/installation";
import { HowItWorks } from "@/components/sections/how-it-works";

export default function Home() {
    return (
        <div className="min-h-screen bg-background">
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
