CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"description" varchar(1024) NOT NULL,
	"amount" integer NOT NULL,
	"type" "transaction_type" NOT NULL
);
