import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/plan", n: "01", label: "The plan" },
  { to: "/actions", n: "02", label: "Actions" },
  { to: "/agenda", n: "03", label: "Agenda" },
] as const;

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Link to="/" className="flex items-center gap-2 no-underline">
      <div
        className={`grid place-items-center rounded-[7px] bg-ink font-display font-semibold text-ember-soft ${
          size === "sm" ? "h-[22px] w-[22px] text-[13px]" : "h-6 w-6 text-[13px]"
        }`}
      >
        C
      </div>
      <span className="font-display text-[19px] font-medium tracking-tight text-foreground">
        Clarity <em className="not-italic text-ember">360</em>
      </span>
    </Link>
  );
}

export function AppHeader({ businessName }: { businessName?: string | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center gap-4 border-b border-border bg-background/90 px-5 py-3 backdrop-blur-md md:px-7">
      <Logo size="sm" />
      <div className="hidden h-5 w-px bg-border md:block" />
      <nav className="flex gap-1.5">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] no-underline transition-colors ${
                active
                  ? "border-ember/40 bg-ember/10 font-medium text-foreground"
                  : "border-border bg-card font-normal text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`font-mono text-[9.5px] ${active ? "text-ember" : "text-muted-foreground/70"}`}>
                {item.n}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1" />
      {businessName ? (
        <span className="hidden text-[12.5px] font-light text-muted-foreground lg:inline">{businessName}</span>
      ) : null}
      {email ? (
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      ) : (
        <Link
          to="/auth"
          className="rounded-full bg-ember-soft px-4 py-1.5 text-[12.5px] font-semibold text-ink no-underline shadow-ember hover:bg-ember hover:text-primary-foreground"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
