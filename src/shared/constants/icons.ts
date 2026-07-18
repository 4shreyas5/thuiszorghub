// lucide-react is the sole icon library across the app. One canonical
// stroke width and a 3-step Tailwind size scale keep every icon visually
// consistent instead of each component picking its own ad hoc size/weight.
export const ICON_STROKE_WIDTH = 1.75;

export const ICON_SIZE = {
  sm: "w-4 h-4", // 16px - inline text, inputs, badges
  md: "w-5 h-5", // 20px - buttons, toasts, modal close
  lg: "w-6 h-6", // 24px - empty states, page-level
} as const;
