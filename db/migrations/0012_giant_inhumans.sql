CREATE TYPE "public"."loan_type" AS ENUM('lent', 'borrowed');--> statement-breakpoint
ALTER TYPE "public"."consolidation_group" ADD VALUE 'loan' BEFORE 'unclassified';--> statement-breakpoint
CREATE TABLE "loan_payoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"date" date NOT NULL,
	"notes" text,
	"consolidation_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "loan_type" NOT NULL,
	"party_name" varchar(1024) NOT NULL,
	"amount" integer NOT NULL,
	"date" date NOT NULL,
	"due_date" date,
	"notes" text,
	"consolidation_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "loan_id" uuid;--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "is_payoff" boolean;--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "loan_payoff_id" uuid;--> statement-breakpoint
ALTER TABLE "loan_payoffs" ADD CONSTRAINT "loan_payoffs_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_payoffs" ADD CONSTRAINT "loan_payoffs_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_loan_payoff_id_loan_payoffs_id_fk" FOREIGN KEY ("loan_payoff_id") REFERENCES "public"."loan_payoffs"("id") ON DELETE set null ON UPDATE no action;