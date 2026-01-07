import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BGPattern } from "@/components/ui/bg-pattern";

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen items-center justify-center">
            <BGPattern
                variant="grid"
                mask="fade-edges"
                size={48}
                fill="var(--border)"
            />
            <div className="px-4 text-center">
                <div className="inline-flex items-baseline font-mono">
                    <span className="text-muted-foreground/50 text-5xl sm:text-7xl lg:text-8xl">
                        $
                    </span>
                    <span className="ml-2 text-6xl font-bold text-primary sm:text-8xl lg:text-9xl">
                        404
                    </span>
                    <span className="ml-2 inline-block h-12 w-1 animate-pulse bg-primary sm:h-16 lg:h-20" />
                </div>

                <p className="mt-6 font-mono text-lg text-destructive sm:text-xl">
                    command not found
                </p>

                <p className="mx-auto mt-6 max-w-md text-muted-foreground">
                    The page you are looking for does not exist or has been
                    moved.
                </p>

                <Button asChild size="lg" className="mt-10 h-12 px-8 text-base">
                    <Link href="/">
                        <Home className="mr-2 h-5 w-5" />
                        Go Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
