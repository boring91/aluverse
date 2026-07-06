import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/client-utils";

type Props = {
  className?: string;
  variant?: "page" | "inline";
};

export const PageLoader = ({ className, variant = "page" }: Props) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        variant === "page" && "py-16",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        <span className="text-sm">Loading</span>
      </div>
    </div>
  );
};
