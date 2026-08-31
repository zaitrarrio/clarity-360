import { useQueryClient } from "@tanstack/react-query";
import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What should I do this week?",
  "Write today's post",
  "Where is my plan weakest?",
  "Watch competitor pricing daily",
];

export function Clara({
  businessId,
  section,
  compact = false,
  collapsed = false,
  onToggleCollapse,
}: {
  businessId: string;
  section?: string | null;
  compact?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I hold the whole plan. Ask me what to do next, or tell me to run something — I can make the artifact, put it on a schedule, or flag what I find.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/clara", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessId,
          section: section ?? null,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "Clara is unavailable."));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) {
        setMessages([...next, { role: "assistant", content: "Done — check the Actions and Agenda tabs." }]);
      }
      qc.invalidateQueries({ queryKey: ["runs", businessId] });
      qc.invalidateQueries({ queryKey: ["signals", businessId] });
      qc.invalidateQueries({ queryKey: ["schedules", businessId] });
    } catch (e) {
      setMessages(next);
      setError(e instanceof Error ? e.message : "Clara is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card ${compact ? "h-[520px]" : "h-full"}`}>
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="clara-orb" />
        <div className="min-w-0">
          <div className="font-display text-[15px] font-medium text-foreground">Clara</div>
          <div className="truncate text-[11px] font-light text-muted-foreground">
            {busy ? "thinking…" : section ? `reading ${section}` : "your plan, live"}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-ink px-3.5 py-2.5 text-[13.5px] font-light text-background">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[95%]">
              {m.content ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <div className="flex gap-1.5 py-1">
                  <span className="clara-dot" />
                  <span className="clara-dot [animation-delay:120ms]" />
                  <span className="clara-dot [animation-delay:240ms]" />
                </div>
              )}
            </div>
          ),
        )}
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      {messages.length <= 1 ? (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] font-light text-muted-foreground transition-colors hover:border-ember/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask Clara, or tell her to run something…"
          className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-[13.5px] font-light text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-full bg-ember px-3.5 py-1.5 text-[12.5px] font-medium text-on-ember disabled:opacity-55"
        >
          Send
        </button>
      </form>
    </div>
  );
}
