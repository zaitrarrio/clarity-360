import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brandInitial, brandWordmark, useTenant } from "@/lib/tenant";

const NAV = [
  { to: "/plan", n: "01", label: "The plan" },
  { to: "/actions", n: "02", label: "Actions" },
  { to: "/agenda", n: "03", label: "Agenda" },
] as const;

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const tenant = useTenant();
  const { lead, tail } = brandWordmark(tenant);
  const logoUrl = tenant.branding.logoUrl;

  return (
    <Link to="/" className="flex items-center gap-2 no-underline">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className={size === "sm" ? "h-[22px] w-auto" : "h-6 w-auto"}
        />
      ) : (
        <div
          className={`grid place-items-center rounded-[7px] bg-ink font-display font-semibold text-ember-soft ${
            size === "sm" ? "h-[22px] w-[22px] text-[13px]" : "h-6 w-6 text-[13px]"
          }`}
        >
          {brandInitial(tenant)}
        </div>
      )}
      <span className="font-display text-[19px] font-medium tracking-tight text-foreground">
        {lead} {tail ? <em className="not-italic text-ember">{tail}</em> : null}
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
      <Link
        to="/intake"
        className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1.5 text-[12.5px] font-medium text-foreground no-underline hover:bg-ember/20"
      >
        Build a plan
      </Link>

      {email ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account menu"
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-[12px] font-medium uppercase text-foreground transition-colors hover:border-ember/40 hover:bg-ember/10"
            >
              {email.charAt(0)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                Signed in as
              </span>
              <span className="block truncate text-[13px] text-foreground">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/branding">Workspace branding</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/tenants">Platform admin</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/intake">Build a plan</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void supabase.auth.signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          to="/auth"
          className="rounded-full bg-ember-soft px-4 py-1.5 text-[12.5px] font-semibold text-on-ember no-underline shadow-ember hover:bg-ember hover:text-on-ember"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
