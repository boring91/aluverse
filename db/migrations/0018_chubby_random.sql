ALTER TABLE "projects" ADD COLUMN "budget_unit" double precision;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "budget_unit_value" integer;

UPDATE "projects" SET "budget_unit" = 1, "budget_unit_value" = 131727 WHERE "budget_unit" IS NULL;