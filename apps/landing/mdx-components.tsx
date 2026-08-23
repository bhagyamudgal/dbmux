import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/docs/code-block";
import Link from "next/link";

function isExternalHref(href: string | undefined): boolean {
    return href?.startsWith("http") ?? false;
}

function MdxTable({ children, ...props }: React.ComponentProps<"table">) {
    return (
        <div className="my-6 max-w-full overflow-x-auto">
            <table {...props} className="w-full text-sm">
                {children}
            </table>
        </div>
    );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        a: ({ href, children }) => {
            if (isExternalHref(href)) {
                return (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                );
            }
            return <Link href={href ?? "#"}>{children}</Link>;
        },
        table: MdxTable,
        pre: CodeBlock,
        ...components,
    };
}
