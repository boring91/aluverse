import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { AppHeader } from "./_components/app-header";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-col w-full">
                <AppHeader />
                <main className="grow overflow-auto">{children}</main>
            </div>
        </SidebarProvider>
    );
};

export default Layout;
