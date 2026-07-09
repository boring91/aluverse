ALTER TABLE "financial_accounts" ADD COLUMN "frollo_account_id" text;--> statement-breakpoint
UPDATE "financial_accounts" SET "frollo_account_id" = '2339164' WHERE "sync_with_bank" = 'westpac';--> statement-breakpoint
ALTER TABLE "financial_accounts" DROP COLUMN "sync_with_bank";--> statement-breakpoint
DROP TYPE "public"."financial_account_bank_syncers";
