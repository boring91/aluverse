import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/features/dashboard/components/app-header";
import { AppSidebar } from "@/features/dashboard/components/app-sidebar";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      const returnUrl = `${location.pathname}${location.searchStr}${location.hash}`;
      throw redirect({
        href: `/login?returnUrl=${encodeURIComponent(returnUrl)}`,
      });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider className="fixed inset-0 h-dvh min-h-0 overflow-hidden">
      <AppSidebar />
      <div className="flex h-full min-w-0 w-full flex-col overflow-hidden">
        <AppHeader className="shrink-0" />
        <main className="min-h-0 grow overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
