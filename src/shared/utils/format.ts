export const formatCurrency = (amount: number, currency = "EUR", locale = "nl-NL"): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+31 ${cleaned.slice(1).replace(/(\d{2})(?=\d)/g, "$1 ")}`;
  }
  return phone;
};

export const formatPostalCode = (postalCode: string): string => {
  const cleaned = postalCode.replace(/\s/g, "").toUpperCase();
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return postalCode;
};

export const truncate = (text: string, length: number): string => {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, length)}...`;
};

export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .trim();
};
