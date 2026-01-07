type YouTubeEmbedProps = {
    videoId: string;
    title?: string;
};

export function YouTubeEmbed({
    videoId,
    title = "dbmux Demo",
}: YouTubeEmbedProps) {
    return (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
            <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
                loading="lazy"
            />
        </div>
    );
}
