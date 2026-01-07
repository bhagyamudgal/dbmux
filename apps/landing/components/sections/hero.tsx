import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/youtube-embed";

type HeroProps = {
    videoId?: string;
};

export function Hero({ videoId }: HeroProps) {
    return (
        <section className="relative flex min-h-screen items-center py-24">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center">
                    <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                        Database Backups
                        <span className="mt-2 block text-primary">
                            Made Simple
                        </span>
                    </h1>

                    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        Skip the pg_dump syntax lookup. dbmux gives you simple
                        commands with smart defaults, automatic history
                        tracking, and organized dump files. Backup and restore
                        with ease.
                    </p>

                    <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-6">
                        <Button
                            size="lg"
                            className="h-12 px-8 text-base"
                            asChild
                        >
                            <a href="#installation">Get Started</a>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 px-8 text-base"
                            asChild
                        >
                            <a
                                href="https://github.com/bhagyamudgal/dbmux"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="mr-2 h-5 w-5" />
                                View on GitHub
                            </a>
                        </Button>
                    </div>

                    {videoId && (
                        <div className="mt-20 w-full max-w-4xl">
                            <YouTubeEmbed videoId={videoId} />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
