import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-only guard for the plan builder routes. The Supabase session lives in
 * localStorage, so these routes set `ssr: false` and call this in `beforeLoad`.
 *
 * The session can take a tick to hydrate from storage on a cold load, so we
 * wait briefly before deciding somebody is signed out.
 */
async function waitForSession(timeoutMs = 2500) {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  return await new Promise<typeof data.session>((resolve) => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        clearTimeout(timer);
        sub.subscription.unsubscribe();
        resolve(session);
      }
    });
    const timer = setTimeout(() => {
      sub.subscription.unsubscribe();
      resolve(null);
    }, timeoutMs);
  });
}

export async function requireAuthOrRedirect(pathname: string) {
  const session = await waitForSession();
  if (session?.user) return { user: session.user };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/auth", search: { redirect: pathname } });
  }
  return { user: data.user };
}
