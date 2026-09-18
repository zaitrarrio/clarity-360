import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`space-y-3 text-[14px] leading-[1.75] font-light text-foreground/85 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h3 className="text-balance font-display text-xl font-normal text-foreground" {...p} />,
          h2: (p) => <h3 className="text-balance font-display text-lg font-normal text-foreground" {...p} />,
          h3: (p) => <h4 className="text-balance font-display text-base font-medium text-foreground" {...p} />,
          p: (p) => <p className="text-pretty text-foreground/85" {...p} />,
          ul: (p) => <ul className="list-disc space-y-1.5 pl-5 marker:text-ember [&>li]:text-pretty" {...p} />,
          ol: (p) => <ol className="list-decimal space-y-1.5 pl-5 marker:text-ember [&>li]:text-pretty" {...p} />,
          strong: (p) => <strong className="font-medium text-foreground" {...p} />,
          em: (p) => <em className="italic text-ember" {...p} />,
          blockquote: (p) => (
            <blockquote className="border-l-2 border-ember/50 pl-3 text-muted-foreground" {...p} />
          ),
          hr: (p) => <hr className="my-4 border-border" {...p} />,
          pre: (p) => <pre className="overflow-x-auto rounded-lg bg-parchment p-3 text-[12px]" {...p} />,
          code: (p) => <code className="rounded bg-parchment px-1 py-0.5 font-mono text-[12px]" {...p} />,
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]" {...p} />
            </div>
          ),
          th: (p) => <th className="border-b border-border py-1.5 pr-4 text-left font-medium" {...p} />,
          td: (p) => <td className="border-b border-border/60 py-1.5 pr-4 align-top" {...p} />,
          a: (p) => (
            <a
              className="text-ember underline underline-offset-2 hover:no-underline"
              target="_blank"
              rel="noreferrer"
              {...p}
            />
          ),
          input: (p) => <input className="mr-2 accent-ember" disabled {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
