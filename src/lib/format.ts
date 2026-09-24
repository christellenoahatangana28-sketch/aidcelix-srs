export function formatPickupCode(code: string) {
  const clean = code.replace(/\s+/g, "");
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

export function formatMoney(amount: number, currency = "XAF"): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
