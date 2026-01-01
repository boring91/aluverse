"use client";

import { PageContainer } from "@/components/page-container";
import { ProjectsList } from "@/features/projects/components/projects-list";
import { useTranslations } from "next-intl";
import { useTitle } from "@/hooks/use-title";

export const ProjectsListView = () => {
    const tc = useTranslations("Common");

    useTitle(tc("projects"));

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl">{tc("projects")}</h1>
            </div>

            <ProjectsList />
        </PageContainer>
    );
};

