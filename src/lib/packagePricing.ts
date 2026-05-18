const USD_PRICE_PATTERN = /^\s*\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*$/;

export function getIndiaMarketPrice(amount: string, discount = 10) {
  const match = amount.match(USD_PRICE_PATTERN);

  if (!match) {
    return undefined;
  }

  const numericAmount = Number.parseFloat(match[1].replace(/,/g, ""));

  if (!Number.isFinite(numericAmount) || numericAmount <= discount) {
    return undefined;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount - discount);
}
