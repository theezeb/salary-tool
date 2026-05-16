export function formatSalary(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}