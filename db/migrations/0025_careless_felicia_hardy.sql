ALTER TABLE "roles" RENAME COLUMN "key" TO "human_id";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_key_unique";--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_humanId_unique" UNIQUE("human_id");