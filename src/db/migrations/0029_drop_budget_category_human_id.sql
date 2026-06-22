DROP INDEX IF EXISTS "budget_human_id_index";--> statement-breakpoint
ALTER TABLE "budget_categories" DROP COLUMN IF EXISTS "human_id";
