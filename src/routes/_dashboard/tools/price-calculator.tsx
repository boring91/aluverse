import { createFileRoute } from "@tanstack/react-router";

import { ProjectPriceCalculatorView } from "@/features/projects/views/project-price-calculator-view";

export const Route = createFileRoute("/_dashboard/tools/price-calculator")({
  component: ProjectPriceCalculatorView,
});
