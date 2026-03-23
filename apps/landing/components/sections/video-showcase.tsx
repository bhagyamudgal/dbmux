"use client";

import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

const VIDEO_URL = "https://cdn.dbmux.com/videos/demo.mp4";

export function VideoShowcase() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    function togglePlay() {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }

    return (
        <section id="demo" className="relative py-24">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        See it in action
                    </h2>
                    <p className="mt-3 text-lg text-muted-foreground">
                        From painful pg_dump commands to simple backups in
                        seconds
                    </p>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-border shadow-lg dark:shadow-[0_0_30px_var(--glow-green)]">
                    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
                        <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                        <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                        <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                        <span className="ml-auto mr-auto font-mono text-xs text-muted-foreground">
                            dbmux demo
                        </span>
                        <div className="w-[52px]" />
                    </div>

                    <div className="relative bg-[#14151e]">
                        <video
                            ref={videoRef}
                            src={VIDEO_URL}
                            className="w-full"
                            playsInline
                            muted
                            loop
                            preload="metadata"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                        />

                        <button
                            type="button"
                            onClick={togglePlay}
                            className="absolute inset-0 flex cursor-pointer items-center justify-center transition-opacity"
                            aria-label={
                                isPlaying ? "Pause video" : "Play video"
                            }
                        >
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm transition-all ${
                                    isPlaying
                                        ? "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                                        : "scale-100 opacity-100"
                                }`}
                            >
                                {isPlaying ? (
                                    <Pause className="h-6 w-6" />
                                ) : (
                                    <Play className="ml-1 h-6 w-6" />
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
