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
    <SidebarProvider>
      <AppSidebar />
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <AppHeader className="shrink-0" />
        <main className="grow overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
