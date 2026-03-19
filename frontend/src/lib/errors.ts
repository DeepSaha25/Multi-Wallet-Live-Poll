export function mapWalletError(error: unknown): string {
  const text = String(error ?? "").toLowerCase();

  if (text.includes("wallet") && text.includes("not") && text.includes("found")) {
    return "Wallet not found. Install or enable one supported wallet and try again.";
  }

  if (
    text.includes("rejected") ||
    text.includes("declined") ||
    text.includes("denied") ||
    text.includes("cancel")
  ) {
    return "Transaction rejected in wallet.";
  }

  if (
    text.includes("insufficient") ||
    text.includes("underfunded") ||
    text.includes("op_underfunded")
  ) {
    return "Insufficient balance for transaction fee or operation amount.";
  }

  return "Unexpected error. Check wallet and network settings, then retry.";
}
