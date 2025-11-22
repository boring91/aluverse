"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { notFound, useParams } from "next/navigation";

const Page = () => {
    const params = useParams();
    const accountId = params["accountId"] as string;

    const trpc = useTRPC();
    const { data, isLoading } = useQuery(
        trpc.financialAccounts.get.queryOptions({
            id: accountId,
        })
    );

    if (isLoading) {
        return <Loader2 className="animate-spin" />;
    }

    if (!data) {
        notFound();
        return null;
    }

    return (
        <div className="p-8 flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/financial-accounts">
                        <ArrowLeft className="rtl:-scale-x-100" />
                    </Link>
                </Button>
                <h1 className="font-bold text-2xl">{data.name}</h1>
            </div>
        </div>
    );
};

export default Page;
