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
DO $$
DECLARE
  budget_rows_missing_count integer;
BEGIN
  SELECT count(*)
    INTO budget_rows_missing_count
  FROM consolidations c
  WHERE c.consolidation_group = 'budget'
    AND c.budget_category_id IS NULL;

  IF budget_rows_missing_count > 0 THEN
    RAISE EXCEPTION 'Cannot finalize migration: % budget consolidations are missing budget_category_id', budget_rows_missing_count;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "consolidations" DROP CONSTRAINT "budget_category_check_constraint";--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "budget_category_check_constraint" CHECK ("consolidations"."consolidation_group" <> 'budget' OR "consolidations"."budget_category_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "consolidations" DROP COLUMN "budget_category";--> statement-breakpoint
DROP TYPE "public"."consolidation_budget_category";
