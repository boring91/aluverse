export type WestpacTransaction = {
    id: string;
    type: "transaction";
    status: "posted" | "pending";
    description: string;
    amount: string; // Can be negative
    balance?: string;
    direction: "credit" | "debit";
    class:
        | "bank-fee"
        | "payment"
        | "cash-withdrawal"
        | "transfer"
        | "loan-interest"
        | "refund"
        | "direct-credit"
        | "interest"
        | "loan-repayment";
    institution: string;
    connection: string;
    transactionDate: string; // ISO
    postDate: string | null; // ISO
    reference: string;
    currency: string;
};
