ALTER TYPE "public"."transaction_budget_category" RENAME TO "consolidation_budget_category";--> statement-breakpoint
ALTER TYPE "public"."transaction_consolidation_group" RENAME TO "consolidation_group";--> statement-breakpoint
CREATE TABLE "consolidations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"is_gst" boolean NOT NULL,
	"consolidation_group" "consolidation_group",
	"budget_category" "consolidation_budget_category",
	"project_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "budget_category_check_constraint" CHECK ("consolidations"."consolidation_group" <> 'budget' OR "consolidations"."budget_category" IS NOT NULL),
	CONSTRAINT "project_id_check_constraint" CHECK ("consolidations"."consolidation_group" <> 'project' OR "consolidations"."project_id" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "budget_category_check_constraint";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "project_id_check_constraint";--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "is_gst";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "consolidation_group";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "budget_category";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "project_id";

--> statement-breakpoint
INSERT INTO consolidations (transaction_id, amount, updated_at, created_at, is_gst)
SELECT id, amount, updated_at, created_at, true FROM transactions;