import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/clarity/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Clarity 360" },
      {
        name: "description",
        content: "Sign in to Clarity 360 to keep your own operating plan, agents, and agenda.",
      },
      { property: "og:title", content: "Sign in — Clarity 360" },
      { property: "og:description", content: "Your plan, your agents, your agenda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/plan" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/plan` },
        });
        if (err) throw err;
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/intake" });
        else setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate({ to: "/plan" });
      }
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in isn't available right now.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/plan" });
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-10 lg:flex">
        <span className="font-display text-[19px] font-medium text-background">
          Clarity <em className="not-italic text-ember-soft">360</em>
        </span>
        <div>
          <p className="max-w-md font-display text-[34px] leading-[1.2] font-light text-background">
            The plan stops being a document the moment an agent is holding it.
          </p>
          <p className="mt-4 max-w-sm text-[14px] font-light text-background/60">
            Clara keeps your seven reports current, runs the work, and tells you when something moved.
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-background/40">Growth OS</span>
      </div>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-6 font-display text-[32px] leading-tight font-normal text-foreground">
            {mode === "signup" ? "Start your plan" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-[13.5px] font-light text-muted-foreground">
            {mode === "signup"
              ? "Answer a short intake and Clara writes the first version."
              : "Pick up where your agents left off."}
          </p>

          <button
            onClick={google}
            className="mt-7 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-[13.5px] font-medium text-foreground hover:bg-parchment"
          >
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] font-light text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-ember/50"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-ember/50"
            />
            {error ? <p className="text-[12.5px] text-destructive">{error}</p> : null}
            {notice ? <p className="text-[12.5px] text-ember">{notice}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-ember px-4 py-2.5 text-[13.5px] font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 text-[12.5px] font-light text-muted-foreground hover:text-foreground"
          >
            {mode === "signup" ? "I already have an account" : "I need an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
