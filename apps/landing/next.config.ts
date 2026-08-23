import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@dbmux/types", "@dbmux/utils"],
    pageExtensions: ["ts", "tsx", "md", "mdx"],
};

const withMDX = createMDX({
    options: {
        remarkPlugins: ["remark-gfm"],
        rehypePlugins: [
            [
                "rehype-pretty-code",
                {
                    theme: "github-dark-default",
                    keepBackground: false,
                },
            ],
        ],
    },
});

export default withMDX(nextConfig);
