import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { UserRound } from "lucide-react";
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

export function HeaderAccountControls({ signedOut }: { signedOut?: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!email) return <>{signedOut}</>;

  return (
    <>
      <Button asChild variant="outline" size="sm" className="border-ember/40 bg-ember/10 hover:bg-ember/20">
        <Link to="/plan">My workspace</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Account menu" className="rounded-full">
            <UserRound aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <span className="block text-[11px] uppercase text-muted-foreground">Signed in as</span>
            <span className="block truncate text-[13px] text-foreground">{email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/plan">My workspace</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/intake" search={{ new: true }}>Build a new plan</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/settings/branding">Workspace branding</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/admin/tenants">Platform admin</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void supabase.auth.signOut()}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}