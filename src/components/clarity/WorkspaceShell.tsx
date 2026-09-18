import { Link, useRouterState } from "@tanstack/react-router";
import { Bot, CalendarDays, FileStack, ListChecks, NotebookTabs } from "lucide-react";
import type { ReactNode } from "react";
import { AppHeader, Logo } from "@/components/clarity/AppHeader";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const WORKSPACE_LINKS = [
  { to: "/plan", label: "My Operating Plan", icon: NotebookTabs },
  { to: "/content", label: "My Content", icon: FileStack },
  { to: "/agenda", label: "My Agenda", icon: CalendarDays },
  { to: "/actions", label: "My Actions", icon: ListChecks },
  { to: "/agents", label: "My Agents", icon: Bot },
] as const;

function WorkspaceSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-[57px] justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <div className="group-data-[collapsible=icon]:hidden">
          <Logo size="sm" />
        </div>
        <Link
          to="/"
          aria-label="Clarity 360 home"
          className="hidden h-8 w-8 place-items-center rounded-md font-display text-lg font-semibold text-ember group-data-[collapsible=icon]:grid"
        >
          C
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.16em]">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKSPACE_LINKS.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="h-10">
                      <Link to={item.to} onClick={() => setOpenMobile(false)}>
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export function WorkspaceShell({
  businessName,
  children,
}: {
  businessName?: string | undefined;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <WorkspaceSidebar />
      <SidebarInset className="min-w-0">
        <AppHeader businessName={businessName} workspace />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}