import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";

type LogoProps = {
    size?: LogoSize;
    showCursor?: boolean;
    className?: string;
};

const sizeClasses: Record<LogoSize, { text: string; cursor: string }> = {
    sm: { text: "text-xl", cursor: "h-4 w-0.5" },
    md: { text: "text-2xl", cursor: "h-5 w-0.5" },
    lg: { text: "text-4xl", cursor: "h-8 w-1" },
    xl: {
        text: "text-5xl sm:text-7xl lg:text-8xl",
        cursor: "h-12 sm:h-16 lg:h-20 w-1",
    },
};

export function Logo({
    size = "sm",
    showCursor = false,
    className,
}: LogoProps) {
    const classes = sizeClasses[size];

    return (
        <span
            className={cn(
                "inline-flex items-baseline font-mono font-bold tracking-tight select-none",
                classes.text,
                className
            )}
        >
            <span className="text-muted-foreground/50">$</span>
            <span className="ml-1 text-primary">dbmux</span>
            {showCursor && (
                <span
                    className={cn(
                        "ml-1 inline-block animate-pulse bg-primary",
                        classes.cursor
                    )}
                />
            )}
        </span>
    );
}
