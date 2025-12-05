ALTER TABLE "transactions" DROP CONSTRAINT "budget_category_check_constraint";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "project_id_check_constraint";--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "budget_category_check_constraint" CHECK ("transactions"."consolidation_group" <> 'budget' OR "transactions"."budget_category" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "project_id_check_constraint" CHECK ("transactions"."consolidation_group" <> 'project' OR "transactions"."project_id" IS NOT NULL);