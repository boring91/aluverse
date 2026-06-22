type LoanType = "borrowed" | "lent";

export function getLoanPayoffAmountSignError(type: LoanType, amount: number) {
  if (type === "borrowed" && amount >= 0) {
    return "Borrowed loan payoff amount must be less than zero";
  }

  if (type === "lent" && amount <= 0) {
    return "Lent loan payoff amount must be greater than zero";
  }

  return null;
}
