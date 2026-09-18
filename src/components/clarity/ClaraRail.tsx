import { MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Clara } from "./Clara";

/**
 * Clara as a right-edge rail: a slim tab when closed, a full-height drawer when open.
 */
export function ClaraRail({
  open,
  onOpenChange,
  businessId,
  section,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  section?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="Open Clara"
          className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-border bg-card px-2.5 py-4 shadow-lg transition-colors hover:bg-parchment"
        >
          <span className="clara-orb" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground [writing-mode:vertical-rl]">
            Clara
          </span>
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      ) : null}

      {open ? (
        <button
          type="button"
          aria-label="Close Clara"
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
        />
      ) : null}

      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 h-dvh w-full border-l border-border bg-card shadow-2xl transition-[width,transform] duration-300 ${
          expanded ? "lg:w-[min(900px,calc(100vw-5rem))]" : "max-w-[400px]"
        } ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-end px-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close Clara"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-parchment hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Clara
              businessId={businessId}
              section={section ?? null}
              expanded={expanded}
              onToggleExpand={() => setExpanded((value) => !value)}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
