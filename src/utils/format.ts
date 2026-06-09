export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);

export const formatDate = (date?: string) => {
  if (!date) return "Pending";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Pending";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
};

export const formatShortDate = (date?: string) => {
  if (!date || date === "Pending") return "Pending";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date.split(",")[0] || "Pending";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
  }).format(parsedDate);
};

export const maskAccountNumber = (accountNumber: string) => (accountNumber ? `**** ${accountNumber.slice(-4)}` : "");
