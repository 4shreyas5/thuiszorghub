export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatTime = (date: Date | string, format24h = true): string => {
  const d = new Date(date);
  return d.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !format24h,
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const getWeekNumber = (date: Date | string): number => {
  const d = new Date(date);
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const getDaysDifference = (from: Date | string, to: Date | string): number => {
  const d1 = new Date(from);
  const d2 = new Date(to);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isToday = (date: Date | string): boolean => {
  const today = new Date();
  const d = new Date(date);
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

export const isPast = (date: Date | string): boolean => {
  return new Date(date) < new Date();
};

export const isFuture = (date: Date | string): boolean => {
  return new Date(date) > new Date();
};
