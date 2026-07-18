# UI Components

ThuisZorgHub's design-system component library. Live reference with every
token and every component variant: **`/admin/design-system`**.

## Conventions

- **Tokens, not raw colors.** Every component reads semantic Tailwind
  classes (`bg-primary`, `text-muted-foreground`, `border-border`, ...)
  defined in `src/app/globals.css` (`:root` / `.dark` + `@theme inline`).
  Never hardcode `gray-*`/`blue-*`/etc. inside a `ui/` component.
- **`cn()` for className merging.** Import from `@/shared/utils/cn`
  (`clsx` + `tailwind-merge`) instead of string concatenation.
- **`cva` for variants.** Components with a `variant`/`size` prop use
  `class-variance-authority` (see `Button.tsx`, `Badge.tsx`, `Card.tsx`).
- **Radix UI primitives for interactive/overlay components.** Dialog,
  Dropdown Menu, Popover, Tooltip, Tabs, Avatar, Switch, Checkbox, Radio
  Group, Separator, Accordion, and Slot (`asChild`) are all built on
  `@radix-ui/react-*` for accessible focus management, keyboard nav, and
  portal rendering out of the box. `Input`/`Textarea`/`Select` stay native
  HTML elements (no accessible-primitive equivalent needed).
- **`lucide-react` is the only icon library.** Stroke width and size scale
  are defined in `@/shared/constants/icons` (`ICON_STROKE_WIDTH`,
  `ICON_SIZE`) - use them instead of ad hoc `w-*`/`h-*`/`strokeWidth`
  values.
- **z-index via CSS variables**, not arbitrary numbers: `z-(--z-dropdown)`,
  `z-(--z-popover)`, `z-(--z-tooltip)`, `z-(--z-modal)`, `z-(--z-toast)`
  (defined in `globals.css`), so overlay stacking order stays centralized.

## Components

| Component                                                                                        | Notes                                                                                                        |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Button`                                                                                         | variants: primary/secondary/destructive/ghost/outline; `asChild` for polymorphic rendering                   |
| `Card` (+Header/Title/Content/Footer)                                                            | compound pattern                                                                                             |
| `Badge`, `StatusBadge`                                                                           | `StatusBadge` maps a domain status string (active/pending/critical/...) to a `Badge` variant                 |
| `Input`, `Textarea`, `Select`                                                                    | share label/error/helperText chrome via `FieldWrapper`                                                       |
| `Modal`                                                                                          | Radix Dialog under the hood; same `isOpen/onClose/title/actions/size/closeOnEscape/closeOnBackdropClick` API |
| `Drawer`                                                                                         | same Dialog primitive, slides in from a `side`                                                               |
| `Toast`, `useToast`, `ToastProvider`                                                             | homegrown context engine (not swapped for a library), retoken only                                           |
| `Table` (+Head/Body/Row/HeaderCell/Cell)                                                         | `stickyHeader`/`sticky` opt-in props                                                                         |
| `Pagination`                                                                                     | decoupled `page`/`pageCount`/`onPageChange`                                                                  |
| `DropdownMenu`, `Popover`, `Tooltip` (needs root `TooltipProvider`, mounted in `app/layout.tsx`) | Radix-based                                                                                                  |
| `Tabs`, `Accordion`, `Separator`                                                                 | Radix-based                                                                                                  |
| `Avatar`, `InitialsAvatar`                                                                       | Radix-based, with initials fallback                                                                          |
| `Switch`, `Checkbox`, `RadioGroup`                                                               | Radix-based form controls                                                                                    |
| `Command`, `CommandDialog`                                                                       | `cmdk`-based command palette shell                                                                           |
| `Calendar`, `DatePicker`                                                                         | `react-day-picker` v10, Dutch locale                                                                         |
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`    | shadcn-pattern React Hook Form wrapper - opt-in, does not replace existing ad hoc form patterns              |
| `EmptyState`                                                                                     | also the Error State primitive (`tone="error"`)                                                              |
| `Spinner`, `Skeleton`                                                                            | loading primitives                                                                                           |
| `Breadcrumb`                                                                                     |                                                                                                              |
| `ThemeToggle`                                                                                    | `next-themes`-backed light/dark switch                                                                       |

## Theming

Dark mode is class-based (`next-themes`, `attribute="class"`,
`defaultTheme="system"`), not `prefers-color-scheme`. `ThemeProvider` is
mounted once in `src/app/layout.tsx`.
