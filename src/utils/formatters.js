/**
 * Format Currency (THB)
 */
export function formatCurrency(amount) {
  if (isNaN(amount)) return "฿0";

  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format DateTime
 */
export function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date);

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(d);
}
