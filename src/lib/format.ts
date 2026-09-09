export function formatMoney(amount: number, currency = "XAF"): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
