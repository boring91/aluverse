"use client";

import { PageContainer } from "@/components/page-container";
import { ProjectsList } from "./_components/projects-list";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useTitle } from "@/hooks/use-title";

const Page = () => {
    const tc = useTranslations("Common");

    useTitle(tc("projects"));

    const [isCreateTransactionOpen, setIsCreateTransactionOpen] =
        useState(false);

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl">{tc("projects")}</h1>

                <Button onClick={() => setIsCreateTransactionOpen(true)}>
                    <PlusIcon />
                    {tc("createNew")}
                </Button>
            </div>

            <ProjectsList
                openCreateSheet={isCreateTransactionOpen}
                onOpenCreateSheetChange={setIsCreateTransactionOpen}
            />
        </PageContainer>
    );
};

export default Page;
