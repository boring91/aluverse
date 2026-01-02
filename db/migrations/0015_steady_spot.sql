ALTER TYPE "public"."consolidation_group" ADD VALUE 'tax' BEFORE 'unclassified';--> statement-breakpoint
ALTER TYPE "public"."consolidation_group" ADD VALUE 'refund' BEFORE 'unclassified';--> statement-breakpoint
ALTER TYPE "public"."consolidation_group" ADD VALUE 'refunded' BEFORE 'unclassified';