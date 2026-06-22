ALTER TYPE "public"."consolidation_group" RENAME TO "reconciliation_group";--> statement-breakpoint
ALTER TYPE "public"."consolidation_project_stream" RENAME TO "reconciliation_project_stream";--> statement-breakpoint
ALTER TABLE "consolidations" RENAME TO "reconciliations";--> statement-breakpoint
ALTER TABLE "reconciliations" RENAME COLUMN "consolidation_group" TO "reconciliation_group";--> statement-breakpoint
ALTER TABLE "loans" RENAME COLUMN "consolidation_id" TO "reconciliation_id";--> statement-breakpoint
ALTER TABLE "loan_payoffs" RENAME COLUMN "consolidation_id" TO "reconciliation_id";--> statement-breakpoint
ALTER TABLE "project_labors" RENAME COLUMN "consolidation_id" TO "reconciliation_id";--> statement-breakpoint
ALTER TABLE "project_misc" RENAME COLUMN "consolidation_id" TO "reconciliation_id";--> statement-breakpoint
ALTER TABLE "project_payments" RENAME COLUMN "consolidation_id" TO "reconciliation_id";--> statement-breakpoint
ALTER TABLE "project_supplies" RENAME COLUMN "consolidation_id" TO "reconciliation_id";--> statement-breakpoint
ALTER INDEX "consolidations_budget_category_id_index" RENAME TO "reconciliations_budget_category_id_index";--> statement-breakpoint
ALTER TABLE "reconciliations" RENAME CONSTRAINT "consolidations_transaction_id_transactions_id_fk" TO "reconciliations_transaction_id_transactions_id_fk";--> statement-breakpoint
ALTER TABLE "reconciliations" RENAME CONSTRAINT "consolidations_project_id_projects_id_fk" TO "reconciliations_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "reconciliations" RENAME CONSTRAINT "consolidations_loan_id_loans_id_fk" TO "reconciliations_loan_id_loans_id_fk";--> statement-breakpoint
ALTER TABLE "reconciliations" RENAME CONSTRAINT "consolidations_loan_payoff_id_loan_payoffs_id_fk" TO "reconciliations_loan_payoff_id_loan_payoffs_id_fk";--> statement-breakpoint
ALTER TABLE "reconciliations" RENAME CONSTRAINT "consolidations_budget_category_id_budget_categories_id_fk" TO "reconciliations_budget_category_id_budget_categories_id_fk";--> statement-breakpoint
ALTER TABLE "loan_payoffs" RENAME CONSTRAINT "loan_payoffs_consolidation_id_consolidations_id_fk" TO "loan_payoffs_reconciliation_id_reconciliations_id_fk";--> statement-breakpoint
ALTER TABLE "loans" RENAME CONSTRAINT "loans_consolidation_id_consolidations_id_fk" TO "loans_reconciliation_id_reconciliations_id_fk";--> statement-breakpoint
ALTER TABLE "project_labors" RENAME CONSTRAINT "project_labors_consolidation_id_consolidations_id_fk" TO "project_labors_reconciliation_id_reconciliations_id_fk";--> statement-breakpoint
ALTER TABLE "project_misc" RENAME CONSTRAINT "project_misc_consolidation_id_consolidations_id_fk" TO "project_misc_reconciliation_id_reconciliations_id_fk";--> statement-breakpoint
ALTER TABLE "project_payments" RENAME CONSTRAINT "project_payments_consolidation_id_consolidations_id_fk" TO "project_payments_reconciliation_id_reconciliations_id_fk";--> statement-breakpoint
ALTER TABLE "project_supplies" RENAME CONSTRAINT "project_supplies_consolidation_id_consolidations_id_fk" TO "project_supplies_reconciliation_id_reconciliations_id_fk";--> statement-breakpoint
UPDATE "role_permissions"
SET "permission" = REPLACE("permission", 'consolidations.', 'reconciliations.')
WHERE "permission" LIKE 'consolidations.%';
