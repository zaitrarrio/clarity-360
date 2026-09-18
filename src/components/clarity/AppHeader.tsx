import { Link } from "@tanstack/react-router";
import { CalendarDays, FileStack, ListChecks, Menu, NotebookTabs } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { brandInitial, brandWordmark, useTenant } from "@/lib/tenant";

const WORKSPACE_LINKS = [
  { to: "/plan", label: "My Operating Plan", icon: NotebookTabs },
  { to: "/content", label: "My Content", icon: FileStack },
  { to: "/agenda", label: "My Agenda", icon: CalendarDays },
  { to: "/actions", label: "My Actions", icon: ListChecks },
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

export function HeaderLead({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) return <Logo size="sm" />;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Open workspace navigation" className="h-8 w-8">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-sidebar p-0 text-sidebar-foreground sm:max-w-[280px]">
        <SheetHeader className="border-b border-sidebar-border px-5 py-5 text-left">
          <SheetTitle><Logo size="sm" /></SheetTitle>
          <SheetDescription className="sr-only">Workspace navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Workspace" className="space-y-1 p-3">
          {WORKSPACE_LINKS.map((item) => (
            <SheetClose asChild key={item.to}>
              <Link
                to={item.to}
                className="flex h-10 items-center gap-3 rounded-md px-3 text-[13.5px] text-sidebar-foreground no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function AppHeader({
  businessName,
  workspace = false,
}: {
  businessName?: string | undefined;
  workspace?: boolean;
}) {
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
      {workspace ? <SidebarTrigger aria-label="Toggle workspace navigation" /> : <HeaderLead signedIn={Boolean(email)} />}
      {workspace ? <div className="md:hidden"><Logo size="sm" /></div> : null}
      <div className="flex-1" />
      {businessName ? (
        <span className="hidden text-[12.5px] font-light text-muted-foreground lg:inline">{businessName}</span>
      ) : null}
      {email ? (
        <Link
          to="/plan"
          className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1.5 text-[12.5px] font-medium text-foreground no-underline hover:bg-ember/20"
        >
          My workspace
        </Link>
      ) : (
        <Link
          to="/intake"
          className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1.5 text-[12.5px] font-medium text-foreground no-underline hover:bg-ember/20"
        >
          Build a plan
        </Link>
      )}


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
              <Link to="/plan">My workspace</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/intake" search={{ new: true }}>Build a new plan</Link>
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
