import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState } from "react";
import { Markdown } from "@/components/clarity/Markdown";
import { WorkspaceShell } from "@/components/clarity/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { AGENT_NAMES, timeAgo } from "@/lib/clarity";
import { useActiveBusinessId, useBusiness, useRuns } from "@/lib/useWorkspace";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "My Content — Clarity 360" },
      {
        name: "description",
        content: "Review the content, documents, and business assets created by your Clarity 360 agents.",
      },
      { property: "og:title", content: "My Content — Clarity 360" },
      {
        property: "og:description",
        content: "Your library of content and business assets generated from the operating plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const businessId = useActiveBusinessId();
  const { data: business } = useBusiness(businessId);
  const { data: runs, isLoading } = useRuns(businessId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const content = (runs ?? []).filter((run) => run.artifact_body);
  const selected = content.find((run) => run.id === selectedId);

  return (
    <WorkspaceShell businessName={business?.name}>
      <main className="mx-auto w-full max-w-[1500px] px-5 py-7 md:px-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Library</div>
        <h1 className="mt-2 text-balance font-display text-[38px] leading-tight font-normal text-foreground">
          My Content
        </h1>
        <p className="mt-2 max-w-2xl text-pretty text-[14.5px] font-light text-muted-foreground">
          Everything your agents have produced from your operating plan, gathered in one place.
        </p>

        {isLoading ? (
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-lg bg-parchment" />
            ))}
          </div>
        ) : content.length ? (
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {content.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => setSelectedId(run.id)}
                className="group min-h-40 rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-ember/40 hover:bg-ember/[0.04]"
              >
                <FileText className="h-5 w-5 text-ember" aria-hidden="true" />
                <h2 className="mt-5 text-balance font-display text-[20px] leading-snug font-normal text-foreground">
                  {run.artifact_title ?? run.title}
                </h2>
                <p className="mt-2 text-[11.5px] font-light text-muted-foreground">
                  {AGENT_NAMES[run.agent_key ?? ""] ?? "Clara"} · {timeAgo(run.started_at)}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 border-y border-border py-12 text-center">
            <FileText className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 font-display text-[22px] font-normal text-foreground">Your library is ready</h2>
            <p className="mx-auto mt-2 max-w-md text-pretty text-[13.5px] font-light text-muted-foreground">
              Content appears here after you run an action such as a pitch deck, website copy, or daily post.
            </p>
          </div>
        )}
      </main>

      {selected?.artifact_body ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-title"
            className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="content-title" className="text-balance font-display text-[26px] leading-tight font-normal text-foreground">
                {selected.artifact_title ?? selected.title}
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
            <Markdown>{selected.artifact_body}</Markdown>
          </div>
        </div>
      ) : null}
    </WorkspaceShell>
  );
}