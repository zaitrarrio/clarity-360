import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-only guard for the plan builder routes. The Supabase session lives in
 * localStorage, so these routes set `ssr: false` and call this in `beforeLoad`.
 */
export async function requireAuthOrRedirect(pathname: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/auth", search: { redirect: pathname } });
  }
  return { user: data.user };
}
