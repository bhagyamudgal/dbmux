import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/constants";

const GRID_SPANS = [
    "sm:col-span-2 lg:col-span-3",
    "sm:col-span-2 lg:col-span-3",
    "lg:col-span-2",
    "lg:col-span-2",
    "lg:col-span-2",
    "sm:col-span-2 lg:col-span-6",
];

export function Features() {
    return (
        <section id="features" className="py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        Everything you need
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Powerful features for efficient database management
                    </p>
                </div>

                <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    {FEATURES.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={cn(
                                "group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:shadow-none dark:hover:shadow-[0_0_30px_var(--glow-green)]",
                                GRID_SPANS[index]
                            )}
                        >
                            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/40 dark:group-hover:shadow-[0_0_15px_var(--glow-green)]">
                                <feature.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-mono text-lg font-semibold text-foreground">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
