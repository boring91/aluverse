ALTER TABLE "gst_payments" ADD COLUMN "reconciliation_id" uuid;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD COLUMN "gst_payment_id" uuid;--> statement-breakpoint
ALTER TABLE "gst_payments" ADD CONSTRAINT "gst_payments_reconciliation_id_reconciliations_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."reconciliations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_gst_payment_id_gst_payments_id_fk" FOREIGN KEY ("gst_payment_id") REFERENCES "public"."gst_payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "gst_payment_id_check_constraint" CHECK ("reconciliations"."reconciliation_group"::text <> 'gst_payable' OR "reconciliations"."gst_payment_id" IS NOT NULL);
