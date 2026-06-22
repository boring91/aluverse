UPDATE "reconciliations"
SET "amount" = abs("amount")
WHERE "loan_id" IN (
	SELECT "id"
	FROM "loans"
	WHERE "type" = 'borrowed'
)
AND "is_payoff" IS NOT TRUE
AND "amount" < 0;--> statement-breakpoint
UPDATE "reconciliations"
SET "amount" = -abs("amount")
WHERE "loan_id" IN (
	SELECT "id"
	FROM "loans"
	WHERE "type" = 'lent'
)
AND "is_payoff" IS NOT TRUE
AND "amount" > 0;--> statement-breakpoint
UPDATE "loans"
SET "amount" = abs("amount")
WHERE "type" = 'borrowed'
AND "amount" < 0;--> statement-breakpoint
UPDATE "loans"
SET "amount" = -abs("amount")
WHERE "type" = 'lent'
AND "amount" > 0;
--> statement-breakpoint
UPDATE "reconciliations"
SET "amount" = -abs("amount")
WHERE "loan_payoff_id" IN (
	SELECT "loan_payoffs"."id"
	FROM "loan_payoffs"
	INNER JOIN "loans" ON "loans"."id" = "loan_payoffs"."loan_id"
	WHERE "loans"."type" = 'borrowed'
)
AND "amount" > 0;--> statement-breakpoint
UPDATE "reconciliations"
SET "amount" = abs("amount")
WHERE "loan_payoff_id" IN (
	SELECT "loan_payoffs"."id"
	FROM "loan_payoffs"
	INNER JOIN "loans" ON "loans"."id" = "loan_payoffs"."loan_id"
	WHERE "loans"."type" = 'lent'
)
AND "amount" < 0;--> statement-breakpoint
UPDATE "loan_payoffs"
SET "amount" = -abs("loan_payoffs"."amount")
FROM "loans"
WHERE "loans"."id" = "loan_payoffs"."loan_id"
AND "loans"."type" = 'borrowed'
AND "loan_payoffs"."amount" > 0;--> statement-breakpoint
UPDATE "loan_payoffs"
SET "amount" = abs("loan_payoffs"."amount")
FROM "loans"
WHERE "loans"."id" = "loan_payoffs"."loan_id"
AND "loans"."type" = 'lent'
AND "loan_payoffs"."amount" < 0;
