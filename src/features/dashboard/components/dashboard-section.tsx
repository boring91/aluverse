import type { ReactNode } from "react";
import { cn } from "@/lib/client-utils";
import { Card } from "@/components/ui/card";

type Props = {
  children: ReactNode;
  isLoading?: boolean;
  skeleton?: ReactNode;
  className?: string;
};

export const DashboardSection = ({
  children,
  isLoading = false,
  skeleton,
  className,
}: Props) => {
  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        {skeleton || <Card className="h-64" />}
      </div>
    );
  }

  return <div className={cn("h-full", className)}>{children}</div>;
};
