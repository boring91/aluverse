"use client";

import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { XIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "../ui/card";

type Props = {
  children: ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
};

export const DataTableFilters = ({
  children,
  onReset,
  hasActiveFilters,
}: Props) => {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {children}

        <div className="absolute top-0 ltr:right-0 rtl:left-0"></div>
      </CardContent>
      {hasActiveFilters && onReset && (
        <CardFooter className="flex justify-end">
          <Button
            variant="destructive"
            size="xs"
            onClick={onReset}
            className="h-9"
          >
            <XIcon className="size-4" />
            Reset filters
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
