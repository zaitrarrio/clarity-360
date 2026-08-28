import { createFileRoute } from "@tanstack/react-router";
import { TENANT_COOKIE } from "@/lib/tenant";

/**
 * Path-prefix entry point for a white-label workspace: /t/<slug> pins the
 * tenant in a cookie and drops the visitor on the branded home page.
 */
export const Route = createFileRoute("/t/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { tenantBySlug } = await import("@/lib/tenant.server");
        const tenant = await tenantBySlug(params.slug);
        if (!tenant || tenant.status !== "active") {
          return new Response("Workspace not found", { status: 404 });
        }
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
            "Set-Cookie": `${TENANT_COOKIE}=${encodeURIComponent(tenant.slug)}; Path=/; Max-Age=31536000; SameSite=Lax`,
          },
        });
      },
    },
  },
});
