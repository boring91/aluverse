ALTER TABLE "consolidations" ALTER COLUMN "consolidation_group" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "consolidations" ADD COLUMN "description" varchar(1024);