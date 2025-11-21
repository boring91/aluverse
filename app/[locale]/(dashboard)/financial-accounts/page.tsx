"use client";

import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const Page = () => {
    const tc = useTranslations("Common");
    useTitle(tc("financialAccounts"));

    const trpc = useTRPC();
    const { data, isLoading } = useQuery(
        trpc.financialAccounts.list.queryOptions()
    );

    return (
        <div className="p-8 flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl">
                    {tc("financialAccounts")}
                </h1>

                <Button>
                    <PlusIcon />
                    {tc("createNew")}
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <Loader2Icon className="animate-spin" />
            ) : (
                data?.map(account => {
                    return <div key={account.id}>{account.name}</div>;
                })
            )}
        </div>
    );
};

export default Page;
