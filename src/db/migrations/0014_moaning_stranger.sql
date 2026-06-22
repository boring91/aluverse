CREATE TYPE "public"."financial_account_bank_syncers" AS ENUM('westpac');--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD COLUMN "sync_with_bank" "financial_account_bank_syncers";