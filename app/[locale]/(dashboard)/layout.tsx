"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/app-sidebar";
import { AppHeader } from "./_components/app-header";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
    const { data, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const fullUrl = `${pathname}?${searchParams.toString()}`;

        if (!data?.user && !isPending) {
            router.push(`/login?returnUrl=${encodeURIComponent(fullUrl)}`);
        }
    }, [data?.user, isPending, router, pathname, searchParams]);

    if (!data?.user) {
        return null;
    }

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
