ALTER TABLE "consolidations" ADD COLUMN "budget_category_id" uuid;--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_budget_category_id_budget_categories_id_fk" FOREIGN KEY ("budget_category_id") REFERENCES "public"."budget_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consolidations_budget_category_id_index" ON "consolidations" USING btree ("budget_category_id");--> statement-breakpoint
DO $$
DECLARE
  missing_categories text;
BEGIN
  SELECT string_agg(DISTINCT c.budget_category::text, ', ' ORDER BY c.budget_category::text)
    INTO missing_categories
  FROM consolidations c
  LEFT JOIN budget_categories bc
    ON bc.human_id = c.budget_category::text
  WHERE c.budget_category IS NOT NULL
    AND bc.id IS NULL;

  IF missing_categories IS NOT NULL THEN
    RAISE EXCEPTION 'Missing budget category mapping for consolidation categories: %', missing_categories;
  END IF;
END $$;
--> statement-breakpoint
UPDATE "consolidations" AS c
SET "budget_category_id" = bc.id
FROM "budget_categories" AS bc
WHERE c."budget_category" IS NOT NULL
  AND c."budget_category_id" IS NULL
  AND bc."human_id" = c."budget_category"::text;
--> statement-breakpoint
ALTER TABLE "consolidations" DROP CONSTRAINT "budget_category_check_constraint";--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "budget_category_check_constraint" CHECK ("consolidations"."consolidation_group" <> 'budget' OR "consolidations"."budget_category" IS NOT NULL OR "consolidations"."budget_category_id" IS NOT NULL);
