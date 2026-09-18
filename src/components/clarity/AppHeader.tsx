import { Link } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { brandInitial, brandWordmark, useTenant } from "@/lib/tenant";
import { HeaderAccountControls } from "./HeaderAccountControls";
import { HeaderSiteMenu } from "./HeaderSiteMenu";

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

export function AppHeader({
  businessName,
  workspace = false,
}: {
  businessName?: string | undefined;
  workspace?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center gap-4 border-b border-border bg-background/90 px-5 py-3 backdrop-blur-md md:px-7">
      {workspace ? <SidebarTrigger aria-label="Toggle workspace navigation" /> : <HeaderSiteMenu signedIn={<Logo size="sm" />} />}
      {workspace ? <div className="md:hidden"><Logo size="sm" /></div> : null}
      <div className="flex-1" />
      {businessName ? (
        <span className="hidden text-[12.5px] font-light text-muted-foreground lg:inline">{businessName}</span>
      ) : null}
      <HeaderAccountControls
        signedOut={(
          <>
            <Link to="/intake" className="text-[12.5px] font-medium text-foreground no-underline">Build a plan</Link>
            <Link to="/auth" className="rounded-full bg-ember-soft px-4 py-1.5 text-[12.5px] font-semibold text-on-ember no-underline shadow-ember">Sign in</Link>
          </>
        )}
      />
    </header>
  );
}
