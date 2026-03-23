import { cn } from "@/lib/utils";
import { STEPS } from "@/lib/constants";

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        How it works
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Get up and running in four simple steps
                    </p>
                </div>

                <div className="relative mx-auto mt-20 max-w-3xl">
                    <div className="absolute top-0 bottom-0 left-6 hidden w-px border-l-2 border-dashed border-primary/20 lg:left-1/2 lg:block" />

                    <div className="space-y-12 lg:space-y-16">
                        {STEPS.map((step, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <div
                                    key={step.number}
                                    className={cn(
                                        "relative grid items-center gap-6 lg:grid-cols-2 lg:gap-12",
                                        !isEven && "lg:direction-rtl"
                                    )}
                                >
                                    <div className="absolute top-0 left-6 z-10 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-primary bg-background lg:left-1/2 lg:block" />

                                    <div
                                        className={cn(
                                            "pl-16 lg:pl-0",
                                            isEven
                                                ? "lg:pr-12 lg:text-right"
                                                : "lg:order-2 lg:pl-12 lg:text-left"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "inline-flex items-center gap-2 font-mono",
                                                isEven
                                                    ? "lg:flex-row-reverse"
                                                    : ""
                                            )}
                                        >
                                            <span className="text-sm font-bold text-primary">
                                                [{step.number}]
                                            </span>
                                            <span className="text-xl font-bold text-foreground">
                                                {step.title}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </div>

                                    <div
                                        className={cn(
                                            "pl-16 lg:pl-0",
                                            isEven
                                                ? "lg:order-2 lg:pl-12"
                                                : "lg:pr-12"
                                        )}
                                    >
                                        <div className="inline-flex items-center gap-2 rounded-lg border-l-2 border-primary bg-card px-4 py-2.5 font-mono text-sm">
                                            <span className="text-primary">
                                                $
                                            </span>
                                            <span className="text-foreground">
                                                {step.command}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="absolute top-1 left-6 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-primary/30 bg-card font-mono text-xs font-bold text-primary lg:hidden">
                                        {step.number}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
