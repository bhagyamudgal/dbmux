import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { FEATURES } from "@/lib/constants";

export function Features() {
    return (
        <section id="features" className="py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        Everything you need
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Powerful features for efficient database management
                    </p>
                </div>

                <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature) => (
                        <Card
                            key={feature.title}
                            className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
                        >
                            <CardHeader className="p-8">
                                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/30">
                                    <feature.icon className="h-7 w-7 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-semibold">
                                    {feature.title}
                                </CardTitle>
                                <CardDescription className="mt-3 text-base leading-relaxed">
                                    {feature.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
