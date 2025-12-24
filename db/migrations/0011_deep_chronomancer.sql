CREATE TYPE "public"."consolidation_project_stream" AS ENUM('supplies', 'labors', 'misc', 'payments');--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "project_stream" "consolidation_project_stream";--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "project_item_id" uuid;--> statement-breakpoint
ALTER TABLE "project_labors" ADD COLUMN "consolidation_id" uuid;--> statement-breakpoint
ALTER TABLE "project_labors" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_labors" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_misc" ADD COLUMN "consolidation_id" uuid;--> statement-breakpoint
ALTER TABLE "project_misc" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_misc" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_payments" ADD COLUMN "consolidation_id" uuid;--> statement-breakpoint
ALTER TABLE "project_payments" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_payments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_supplies" ADD COLUMN "consolidation_id" uuid;--> statement-breakpoint
ALTER TABLE "project_supplies" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_supplies" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_labors" ADD CONSTRAINT "project_labors_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_misc" ADD CONSTRAINT "project_misc_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_payments" ADD CONSTRAINT "project_payments_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_supplies" ADD CONSTRAINT "project_supplies_consolidation_id_consolidations_id_fk" FOREIGN KEY ("consolidation_id") REFERENCES "public"."consolidations"("id") ON DELETE set null ON UPDATE no action;