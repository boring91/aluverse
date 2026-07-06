import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LaborsList } from "@/features/projects/components/labors-list";
import { MiscList } from "@/features/projects/components/misc-list";
import { PaymentsList } from "@/features/projects/components/payments-list";
import { SuppliesList } from "@/features/projects/components/supplies-list";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const ProjectDetailsTabs = ({ projectId }: { projectId: string }) => {
  const { hasPermission, isPending } = useRbacAccess();
  const canReadProjectItems = hasPermission("projectItems.read");

  if (isPending) {
    return <PageLoader variant="inline" />;
  }

  if (!canReadProjectItems) {
    return (
      <p className="text-muted-foreground">
        You do not have access to project items.
      </p>
    );
  }

  return (
    <Tabs defaultValue="supplies" className="mt-2 space-y-4">
      <TabsList>
        <TabsTrigger value="supplies">Supplies</TabsTrigger>
        <TabsTrigger value="labors">Labors</TabsTrigger>
        <TabsTrigger value="misc">Misc</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
      </TabsList>

      <TabsContent value="supplies" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Supplies</CardTitle>
            <CardDescription>
              Manage and track all supplies and materials for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuppliesList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="labors" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Labors</CardTitle>
            <CardDescription>
              View and manage labor hours and rates for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LaborsList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="misc" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Misc</CardTitle>
            <CardDescription>
              Track miscellaneous expenses and items for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MiscList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>
              View and manage all payments received for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentsList projectId={projectId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
