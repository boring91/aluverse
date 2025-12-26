import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
    CreateProjectItem,
    CreateProjectItemHandle,
} from "./create-project-item";
import { CreateProject } from "@/features/projects/components/create-project";
import { useConsolidationForm } from "../hooks/use-consolidation-form";
import { useProjectItems } from "../hooks/use-project-items";
import { usePendingProjectItemSelection } from "../hooks/use-pending-project-item-selection";
import { usePendingProjectSelection } from "../hooks/use-pending-project-selection";
import {
    DescriptionField,
    AmountField,
    ConsolidationGroupField,
    BudgetCategoryField,
    ProjectFields,
    IsGstField,
} from "./consolidation-form-fields";

type Props = {
    transactionId: string;
    itemId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const CreateConsolidation = ({
    transactionId,
    itemId,
    open,
    onOpenChange,
}: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const { form, handleSubmit, isPending } = useConsolidationForm({
        transactionId,
        itemId,
        open,
        onOpenChange,
    });

    const trpc = useTRPC();

    const selectedGroup = form.watch("consolidationGroup");

    const { data: projects } = useQuery(
        trpc.projects.list.queryOptions({
            pagination: { pageSize: -1, pageIndex: 0 },
        })
    );

    const projectItems = useProjectItems(form);

    const projectId = form.watch("projectId");
    const projectStream = form.watch("projectStream");

    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false); // TODO: should be moved
    const createProjectItemRef = useRef<CreateProjectItemHandle>(null); // TODO: should be moved
    const handleItemCreated = usePendingProjectItemSelection(
        form,
        projectItems,
        open,
        projectId,
        projectStream
    ); // TODO: should be moved
    const handleProjectCreated = usePendingProjectSelection(
        form,
        projects?.items,
        open
    ); // TODO: should be moved

    return (
        <Dialog
            open={open}
            onOpenChange={value => {
                if (isPending) return;
                if (!value) {
                    form.reset();
                    setIsCreateProjectOpen(false);
                }
                onOpenChange(value);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("consolidateTransaction")}</DialogTitle>
                    <DialogDescription>
                        {t("consolidateTransactionDetails")}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="consolidate-transaction-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col gap-8 px-4"
                >
                    <fieldset disabled={isPending}>
                        <FieldGroup>
                            <DescriptionField control={form.control} />

                            <AmountField control={form.control} />

                            <ConsolidationGroupField
                                control={form.control}
                                form={form}
                            />

                            {selectedGroup === "budget" && (
                                <BudgetCategoryField control={form.control} />
                            )}

                            <ProjectFields
                                control={form.control}
                                form={form}
                                selectedGroup={selectedGroup}
                                projects={projects?.items}
                                projectItems={projectItems}
                                projectStream={projectStream}
                                isCreateProjectOpen={isCreateProjectOpen}
                                setIsCreateProjectOpen={setIsCreateProjectOpen}
                                createProjectItemRef={createProjectItemRef}
                            />

                            <IsGstField control={form.control} />
                        </FieldGroup>
                    </fieldset>
                </form>

                <DialogFooter>
                    <Button
                        disabled={isPending}
                        type="submit"
                        form="consolidate-transaction-form"
                    >
                        {isPending && <Loader2 className="animate-spin" />}
                        <span>{tc("save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Nested create modal handler */}
            {projectId && (
                <CreateProjectItem
                    ref={createProjectItemRef}
                    projectId={projectId}
                    stream={projectStream}
                    onItemCreated={handleItemCreated}
                />
            )}
            <CreateProject
                open={isCreateProjectOpen}
                onOpenChange={setIsCreateProjectOpen}
                itemId={null}
                onCreated={handleProjectCreated}
            />
        </Dialog>
    );
};
