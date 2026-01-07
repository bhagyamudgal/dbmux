import { STEPS } from "@/lib/constants";

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        How it works
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Get up and running in four simple steps
                    </p>
                </div>

                <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {STEPS.map((step, index) => (
                        <div key={step.number} className="relative">
                            {index < STEPS.length - 1 && (
                                <div className="absolute top-10 left-1/2 hidden h-0.5 w-full bg-border lg:block" />
                            )}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-3xl font-bold text-primary shadow-lg shadow-primary/10">
                                    {step.number}
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-foreground">
                                    {step.title}
                                </h3>
                                <p className="mt-3 text-base text-muted-foreground">
                                    {step.description}
                                </p>
                                <code className="mt-6 rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm shadow-sm">
                                    {step.command}
                                </code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
