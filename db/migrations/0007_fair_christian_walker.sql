CREATE TYPE "public"."transaction_budget_category" AS ENUM('subscription', 'consumable', 'toll', 'tool', 'food', 'salary', 'fuel');--> statement-breakpoint
CREATE TYPE "public"."transaction_consolidation_group" AS ENUM('budget', 'project', 'unclassified');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_gst" boolean;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "consolidation_group" "transaction_consolidation_group";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "budget_category" "transaction_budget_category";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "budget_category_check_constraint" CHECK ("transactions"."consolidation_group" IS NULL OR "transactions"."budget_category" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "project_id_check_constraint" CHECK ("transactions"."consolidation_group" IS NULL OR "transactions"."project_id" IS NOT NULL);