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

export const formatFullDate = (date?: string) => {
  if (!date || date === "Pending") return "Pending";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date.split(",")[0] || "Pending";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(parsedDate);
};

export const formatReadableDate = (date?: string) => {
  if (!date || date === "Pending") return "Pending";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date.split(",")[0] || "Pending";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
};

export const maskAccountNumber = (accountNumber: string) => (accountNumber ? `**** ${accountNumber.slice(-4)}` : "");

export const formatRequestStatus = (status?: string, label?: string) => {
  const value = (label || status || "Pending").trim();
  const key = value.toUpperCase().replaceAll(" ", "_");
  const labels: Record<string, string> = {
    SUBMITTED: "Pending approval",
    PENDING_APPROVAL: "Pending approval",
    UNDER_REVIEW: "Under review",
    EMPLOYER_APPROVED: "Employer approved",
    ADMIN_APPROVED: "Admin approved",
    READY_FOR_DISBURSAL: "Ready for payout",
    DISBURSED: "Disbursed",
    PAYMENT_SCHEDULED: "Payment scheduled",
    REPAYMENT_SCHEDULED: "Payment scheduled",
    PAID: "Repaid",
    REPAID: "Repaid",
    RECOVERED: "Repaid",
    EMPLOYER_REJECTED: "Rejected",
    REJECTED: "Rejected",
  };
  return labels[key] ?? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};
