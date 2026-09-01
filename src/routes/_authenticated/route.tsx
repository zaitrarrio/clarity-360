import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuthOrRedirect } from "@/lib/require-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => requireAuthOrRedirect(location.pathname),
  component: () => <Outlet />,
});
