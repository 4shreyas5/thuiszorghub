"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/Badge";

// ---------------------------------------------------------------------------
// Layout primitives (documentation-only, not part of the ui/ kit)
// ---------------------------------------------------------------------------

function DocSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-6 rounded-lg border border-border bg-card p-6">{children}</div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function TokenRow({
  name,
  varName,
  light,
  dark,
  usage,
}: {
  name: string;
  varName: string;
  light: string;
  dark: string;
  usage: string;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="whitespace-nowrap py-2 pr-4 align-top">
        <div className="flex items-center gap-2">
          {varName.startsWith("--") && (
            <span
              className="h-4 w-4 shrink-0 rounded border border-border"
              style={{ backgroundColor: `var(${varName})` }}
            />
          )}
          <span className="font-medium text-foreground">{name}</span>
        </div>
      </td>
      <td className="whitespace-nowrap py-2 pr-4 align-top font-mono text-xs text-muted-foreground">
        {varName}
      </td>
      <td className="whitespace-nowrap py-2 pr-4 align-top font-mono text-xs text-muted-foreground">
        {light}
      </td>
      <td className="whitespace-nowrap py-2 pr-4 align-top font-mono text-xs text-muted-foreground">
        {dark}
      </td>
      <td className="py-2 align-top text-xs text-muted-foreground">{usage}</td>
    </tr>
  );
}

function TokenTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Token</th>
            <th className="py-2 pr-4 font-medium">Variable</th>
            <th className="py-2 pr-4 font-medium">Light</th>
            <th className="py-2 pr-4 font-medium">Dark</th>
            <th className="py-2 font-medium">Use for</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function DoDont({ dos, donts }: { dos: string[]; donts: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-md border border-success/30 bg-success/5 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
          <Check className="h-4 w-4" strokeWidth={1.75} /> Do
        </p>
        <ul className="space-y-1.5 text-sm text-foreground">
          {dos.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-success">&bull;</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-danger/30 bg-danger/5 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-danger">
          <X className="h-4 w-4" strokeWidth={1.75} /> Don&apos;t
        </p>
        <ul className="space-y-1.5 text-sm text-foreground">
          {donts.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-danger">&bull;</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const NAV = [
  { id: "colors", label: "Color Tokens" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "elevation", label: "Elevation" },
  { id: "grid", label: "Grid" },
  { id: "radius", label: "Radius" },
  { id: "icons", label: "Icons" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "tables", label: "Tables" },
  { id: "cards", label: "Cards" },
  { id: "modals", label: "Modals" },
  { id: "animations", label: "Animations" },
  { id: "usage", label: "Usage Guidelines" },
  { id: "accessibility", label: "Accessibility" },
];

export default function DesignDocsPage() {
  return (
    <div className="space-y-12 pb-24">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/design-system"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
              Live components
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Design Handbook</h1>
          <p className="text-sm text-muted-foreground">
            The internal reference for how ThuisZorgHub looks, feels and behaves. Every future
            component must follow this handbook.
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* In-page nav ------------------------------------------------------ */}
      <nav className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-4">
        {NAV.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {n.label}
          </a>
        ))}
      </nav>

      {/* -------------------------------------------------------------- */}
      <DocSection
        id="colors"
        title="Color Tokens"
        description="A muted, clinical healthcare palette - deep medical blue, soft slate, warm white. Never pure black/white, never bright saturated color. All color is expressed as a semantic CSS custom property, switched by a .dark class (next-themes). Components read Tailwind utility classes like bg-primary, never raw grays or hex values."
      >
        <TokenTable>
          <TokenRow
            name="Background"
            varName="--background"
            light="#fafbfc"
            dark="#0a0f1a"
            usage="Page background (warm white / deep navy)"
          />
          <TokenRow
            name="Foreground"
            varName="--foreground"
            light="#1b2430"
            dark="#e7eaef"
            usage="Default text - never pure black/white"
          />
          <TokenRow
            name="Card"
            varName="--card"
            light="#ffffff"
            dark="#121a28"
            usage="Card / panel / dialog surfaces"
          />
          <TokenRow
            name="Popover"
            varName="--popover"
            light="#ffffff"
            dark="#121a28"
            usage="Popover, dropdown, tooltip surfaces"
          />
          <TokenRow
            name="Primary"
            varName="--primary"
            light="#1d4e89"
            dark="#5b93c7"
            usage="Primary actions, links, focus accents (deep medical blue)"
          />
          <TokenRow
            name="Secondary"
            varName="--secondary"
            light="#f1f3f6"
            dark="#1a2333"
            usage="Secondary buttons, subtle fills (soft slate)"
          />
          <TokenRow
            name="Muted"
            varName="--muted"
            light="#f4f5f7"
            dark="#1a2333"
            usage="Disabled/low-emphasis backgrounds"
          />
          <TokenRow
            name="Muted foreground"
            varName="--muted-foreground"
            light="#6b7685"
            dark="#9aa5b4"
            usage="Secondary/caption text"
          />
          <TokenRow
            name="Accent"
            varName="--accent"
            light="#f1f3f6"
            dark="#1a2333"
            usage="Hover states on interactive rows/items"
          />
          <TokenRow
            name="Success"
            varName="--success"
            light="#3c8c6e"
            dark="#5aae8c"
            usage="Completed, active, positive confirmation (soft emerald)"
          />
          <TokenRow
            name="Warning"
            varName="--warning"
            light="#c4894a"
            dark="#d9a867"
            usage="Pending, overdue, needs-attention (muted amber)"
          />
          <TokenRow
            name="Danger"
            varName="--danger"
            light="#b34b5c"
            dark="#d9838c"
            usage="Destructive actions, errors, critical status (muted rose)"
          />
          <TokenRow
            name="Info"
            varName="--info"
            light="#3e8e89"
            dark="#5bafa8"
            usage="Informational banners, scheduled status (muted teal)"
          />
          <TokenRow
            name="Border / Input"
            varName="--border / --input"
            light="#edeff2 / #dfe3e8"
            dark="#1e2836 / #26313f"
            usage="Dividers, input borders, table borders - almost invisible"
          />
          <TokenRow
            name="Ring"
            varName="--ring"
            light="#1d4e89"
            dark="#5b93c7"
            usage="Focus ring on interactive elements"
          />
        </TokenTable>
        <p className="text-xs text-muted-foreground">
          Chart categorical palette (<code className="font-mono">--chart-1</code> through{" "}
          <code className="font-mono">--chart-6</code>) is drawn from the same muted brand family
          and reserved for analytics/reporting visualizations - not UI chrome.
        </p>
        <p className="text-xs text-muted-foreground">
          Shadows are token-driven too: <code className="font-mono">shadow-xs/sm/md/lg/xl</code>{" "}
          resolve to a soft, diffuse, low-contrast elevation scale (no hard drop shadows, no glass
          effects), with darker/more diffuse values in dark mode.
        </p>
      </DocSection>

      <DocSection
        id="typography"
        title="Typography"
        description="Inter, self-hosted via next/font/google, exposed as --font-sans. One typeface for the entire product - no secondary/decorative font. Headings lean semibold with tightened tracking rather than bold, for an elegant, considered feel over a shouty admin-template one - text-xl/2xl/3xl carry a small negative letter-spacing by default (see --text-*--letter-spacing in globals.css)."
      >
        <div className="space-y-3">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            Heading / 3xl semibold - page titles
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            Heading / 2xl semibold - section titles
          </p>
          <p className="text-xl font-semibold tracking-tight text-foreground">
            Heading / xl semibold - card/panel titles
          </p>
          <p className="text-lg font-semibold text-foreground">
            Heading / lg semibold - subsection titles
          </p>
          <p className="text-base font-medium text-foreground">
            Body / base medium - emphasized body text
          </p>
          <p className="text-sm text-foreground">Body / sm regular - default UI text</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Body / sm muted - secondary text, helper text
          </p>
          <p className="text-xs text-muted-foreground">
            Caption / xs muted - table meta, timestamps, labels
          </p>
        </div>
        <DoDont
          dos={[
            "Use text-foreground / text-muted-foreground for color, never text-gray-*.",
            "Keep to the scale above - reuse an existing size before introducing a new one.",
            "Prefer font-semibold over font-bold for headings - restraint reads as premium.",
          ]}
          donts={[
            'Mix a second typeface in for "emphasis" or icons-as-text.',
            "Use font-bold - it reads as shouting; reserve it for nothing in this system.",
          ]}
        />
      </DocSection>

      <DocSection
        id="spacing"
        title="Spacing"
        description="Tailwind's default 4px-based scale (1 = 4px). No custom spacing tokens - consistency comes from reusing a small set of the scale, not from inventing new values."
      >
        <TokenTable>
          <TokenRow
            name="Inline gaps"
            varName="gap-2 / gap-3"
            light="8px / 12px"
            dark="—"
            usage="Icon-to-label, inline controls (Row pattern)"
          />
          <TokenRow
            name="Field stacks"
            varName="space-y-1.5"
            light="6px"
            dark="—"
            usage="Label -> control -> helper/error text"
          />
          <TokenRow
            name="Form grids"
            varName="gap-6"
            light="24px"
            dark="—"
            usage="Between fields in a form grid"
          />
          <TokenRow
            name="Card padding"
            varName="p-6"
            light="24px"
            dark="—"
            usage="Card / panel internal padding"
          />
          <TokenRow
            name="Page rhythm"
            varName="space-y-12"
            light="48px"
            dark="—"
            usage="Between major page sections"
          />
        </TokenTable>
        <Code>{`// Standard two-column form grid (used across every admin form)
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Input label="First name" />
  <Input label="Last name" />
</div>`}</Code>
      </DocSection>

      <DocSection
        id="elevation"
        title="Elevation"
        description="Shadows communicate surfaces that float above the page (cards on hover, popovers, dialogs). Portal-rendered layers additionally use a z-index token scale."
      >
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-sm" />
            <p className="text-xs text-muted-foreground">shadow-sm - resting card</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-md" />
            <p className="text-xs text-muted-foreground">shadow-md - hovered card</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-lg" />
            <p className="text-xs text-muted-foreground">shadow-lg - popover/dropdown</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-xl" />
            <p className="text-xs text-muted-foreground">shadow-xl - modal/drawer</p>
          </div>
        </div>
        <TokenTable>
          <TokenRow
            name="Dropdown"
            varName="--z-dropdown"
            light="30"
            dark="—"
            usage="DropdownMenu, Select popover"
          />
          <TokenRow
            name="Popover"
            varName="--z-popover"
            light="40"
            dark="—"
            usage="Popover, Command palette"
          />
          <TokenRow name="Tooltip" varName="--z-tooltip" light="45" dark="—" usage="Tooltip" />
          <TokenRow name="Modal" varName="--z-modal" light="50" dark="—" usage="Dialog, Drawer" />
          <TokenRow
            name="Toast"
            varName="--z-toast"
            light="60"
            dark="—"
            usage="Toast notifications - always topmost"
          />
        </TokenTable>
        <Code>{`// Reference z-index tokens via Tailwind v4 arbitrary-value-with-CSS-var syntax
<div className="z-(--z-modal)">...</div>`}</Code>
      </DocSection>

      <DocSection
        id="grid"
        title="Grid"
        description="Admin shell is a fixed sidebar + fluid content area, not a CSS grid page layout. Within page content, use Tailwind's grid utilities directly - no custom grid config."
      >
        <TokenTable>
          <TokenRow
            name="Sidebar"
            varName="w-64"
            light="256px"
            dark="—"
            usage="Fixed-width admin navigation rail"
          />
          <TokenRow
            name="Search / narrow control"
            varName="max-w-md"
            light="448px"
            dark="—"
            usage="Topbar search, narrow single-purpose inputs"
          />
          <TokenRow
            name="Form layout"
            varName="grid-cols-1 md:grid-cols-2"
            light="1 col mobile / 2 col desktop"
            dark="—"
            usage="Every standard entity form (Employee, Client, Care Plan, Assignment)"
          />
          <TokenRow
            name="Dense form layout"
            varName="grid-cols-1 md:grid-cols-3"
            light="1 col mobile / 3 col desktop"
            dark="—"
            usage="Short-field groups (e.g. date + time + duration)"
          />
        </TokenTable>
        <DoDont
          dos={[
            "Reuse grid-cols-1 md:grid-cols-2 gap-6 for new entity forms - it's the established convention.",
            "Let content reflow to a single column below md - never a fixed-width form.",
          ]}
          donts={[
            "Introduce a new breakpoint or column count without a real content reason.",
            "Hardcode pixel widths for layout containers.",
          ]}
        />
      </DocSection>

      <DocSection
        id="radius"
        title="Radius"
        description="One base token (--radius: 0.625rem / 10px), with sm/md/lg/xl derived via calc(). lg is the default for cards, inputs and buttons."
      >
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="space-y-2">
            <div className="h-16 rounded-sm border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">radius-sm (6px) - badges, chips</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">radius-md (8px) - inputs, buttons</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">
              radius-lg (10px) - cards, modals (default)
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-xl border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">
              radius-xl (14px) - large feature surfaces
            </p>
          </div>
        </div>
      </DocSection>

      <DocSection
        id="icons"
        title="Icons"
        description="lucide-react is the only icon library. Stroke width and sizes are shared constants in @/shared/constants/icons - never pass ad hoc strokeWidth or w-*/h-* values."
      >
        <TokenTable>
          <TokenRow
            name="Stroke width"
            varName="ICON_STROKE_WIDTH"
            light="1.75"
            dark="—"
            usage="Every icon, everywhere (slightly lighter than lucide's default 2, for a refined look)"
          />
          <TokenRow
            name="Small"
            varName="ICON_SIZE.sm"
            light="16px (w-4 h-4)"
            dark="—"
            usage="Inputs, badges, inline text icons"
          />
          <TokenRow
            name="Medium"
            varName="ICON_SIZE.md"
            light="20px (w-5 h-5)"
            dark="—"
            usage="Buttons, toasts, nav items"
          />
          <TokenRow
            name="Large"
            varName="ICON_SIZE.lg"
            light="24px (w-6 h-6)"
            dark="—"
            usage="Empty states, page-level accents"
          />
        </TokenTable>
        <Code>{`import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

<Users className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />`}</Code>
      </DocSection>

      <DocSection
        id="buttons"
        title="Buttons"
        description="One Button component, five variants, three sizes. Variant communicates intent, not emphasis-by-color-choice."
      >
        <TokenTable>
          <TokenRow
            name="primary"
            varName={'variant="primary"'}
            light="Filled, primary color"
            dark="—"
            usage="The single main action on a page/form"
          />
          <TokenRow
            name="secondary"
            varName={'variant="secondary"'}
            light="Filled, neutral"
            dark="—"
            usage="Secondary actions alongside a primary"
          />
          <TokenRow
            name="destructive"
            varName={'variant="destructive"'}
            light="Filled, danger color"
            dark="—"
            usage="Delete/archive/irreversible actions"
          />
          <TokenRow
            name="outline"
            varName={'variant="outline"'}
            light="Bordered, transparent fill"
            dark="—"
            usage="Lower-emphasis actions, toolbar buttons"
          />
          <TokenRow
            name="ghost"
            varName={'variant="ghost"'}
            light="No border, no fill"
            dark="—"
            usage="Icon-only actions, table row actions"
          />
        </TokenTable>
        <DoDont
          dos={[
            "One primary button per view/section - it's the thing you want the user to do.",
            "Pair a destructive action with a secondary Cancel, never destructive alone.",
          ]}
          donts={[
            "Use two primary buttons side by side - forces the user to guess which one matters.",
            "Use color alone to convey destructiveness on a non-destructive variant.",
          ]}
        />
      </DocSection>

      <DocSection
        id="inputs"
        title="Inputs"
        description="Input, Textarea, Select and DatePicker share label/error/helperText chrome via a common FieldWrapper - always label + control + optional helper/error, never a bare control."
      >
        <DoDont
          dos={[
            "Always pass a label - inputs are never placeholder-only.",
            "Use error to show validation feedback inline, next to the field it belongs to.",
            "Use helperText for guidance that isn't an error (format hints, examples).",
          ]}
          donts={[
            "Rely on placeholder text as a label substitute - it disappears on input and fails accessibility.",
            'Show a global "form has errors" banner instead of per-field errors.',
          ]}
        />
        <Code>{`<Input label="Email" placeholder="jane@example.com" error="Invalid email address" required />`}</Code>
      </DocSection>

      <DocSection
        id="tables"
        title="Tables"
        description="The Table primitive (Head/Body/Row/HeaderCell/Cell) is the only tabular pattern - do not hand-roll table markup in feature pages."
      >
        <DoDont
          dos={[
            "Use stickyHeader for tables that scroll independently of the page.",
            "Pair a table with Pagination rather than rendering unbounded rows.",
            "Use StatusBadge in a status column instead of raw text.",
          ]}
          donts={[
            "Mix custom <table> markup with the Table primitive in the same page.",
            "Sort silently client-side without a visible sortDirection indicator on the header.",
          ]}
        />
      </DocSection>

      <DocSection
        id="cards"
        title="Cards"
        description="Card (+Header/Title/Content/Footer) is the standard content-grouping surface. bordered for static content, hover for anything clickable/navigable."
      >
        <DoDont
          dos={[
            "Use hover only when the whole card is a navigation/click target.",
            "Keep CardFooter actions right-aligned and limited to 1-2 buttons.",
          ]}
          donts={[
            "Nest a Card inside another Card - flatten the hierarchy instead.",
            "Put a form's primary submit button inside a CardFooter that isn't the outermost card.",
          ]}
        />
      </DocSection>

      <DocSection
        id="modals"
        title="Modals"
        description="Modal (Dialog) for focused, blocking tasks that must be resolved before returning to the page. Drawer for supplementary detail/context that doesn't need to block."
      >
        <TokenTable>
          <TokenRow
            name="Modal"
            varName="Modal"
            light="Centered, blocking"
            dark="—"
            usage="Confirmations, short forms, destructive-action confirmation"
          />
          <TokenRow
            name="Drawer"
            varName="Drawer"
            light="Slides from side, blocking"
            dark="—"
            usage="Record detail panels, longer forms, side-by-side reference while editing"
          />
        </TokenTable>
        <DoDont
          dos={[
            "Always give a destructive Modal an explicit Cancel action.",
            "Keep Modal content short - if it needs its own scroll area, it should probably be a Drawer or a page.",
          ]}
          donts={[
            "Stack a Modal on top of another Modal.",
            "Disable closeOnEscape/closeOnBackdropClick without a strong reason (in-progress irreversible action).",
          ]}
        />
      </DocSection>

      <DocSection
        id="animations"
        title="Animations"
        description="Motion is subtle and fast - tailwindcss-animate utility classes plus Radix's own data-state driven transitions. No framer-motion, no bespoke keyframes beyond what Radix components already need (e.g. accordion height)."
      >
        <DoDont
          dos={[
            "Keep transitions under ~200ms - this is a data-dense admin tool, not a marketing site.",
            "Let Radix primitives (Dialog, Dropdown, Popover, Accordion) drive their own enter/exit via data-state - don't wrap them in extra animation.",
          ]}
          donts={[
            "Add bounce/spring easing - it reads as playful, not clinical/trustworthy.",
            "Animate layout-affecting properties (height/width) outside of Radix's own measured transitions.",
          ]}
        />
      </DocSection>

      <DocSection
        id="usage"
        title="Usage Guidelines"
        description="How every component in src/components/ui/ is built, and how new ones must be built."
      >
        <DoDont
          dos={[
            "Read tokens via semantic Tailwind classes (bg-primary, text-muted-foreground, border-border) - never gray-*/blue-*/hex literals.",
            "Use cn() (@/shared/utils/cn) for all conditional/merged className logic.",
            "Use cva for any component with variant/size props (see Button.tsx, Badge.tsx, Card.tsx as reference).",
            "Build new interactive/overlay components on Radix UI primitives for accessible focus management and portal rendering.",
            "Add new components to /admin/design-system (live gallery) and this handbook in the same change.",
          ]}
          donts={[
            "Hardcode a color, spacing, radius or shadow value that isn't backed by a token.",
            "Add a second component library (Radix + one homegrown set is the standard - not three).",
            "Introduce a new icon library alongside lucide-react.",
            'Duplicate an existing primitive\'s job under a new name (e.g. a second "Chip" component - extend Badge instead).',
          ]}
        />
      </DocSection>

      <DocSection
        id="accessibility"
        title="Accessibility"
        description="Radix primitives provide the mechanics (focus trap, roving tabindex, ARIA wiring); these are the product-level rules on top of them."
      >
        <DoDont
          dos={[
            "Every input has an associated <label> (FieldWrapper handles this via useId()).",
            "Every icon-only button has an aria-label or visually-hidden text.",
            "Focus rings (ring token) stay visible - never suppress :focus-visible styling.",
            "Color is never the only signal - StatusBadge pairs color with text, not a bare dot.",
            "Verify both light and dark mode meet WCAG AA contrast for text on its background token.",
          ]}
          donts={[
            "Set tabIndex={-1} or outline-none on a focusable element without an alternative focus indicator.",
            "Build custom keyboard handling for a pattern Radix already provides (Dialog focus trap, DropdownMenu arrow-key nav, etc.).",
            "Convey required/error state with color alone - pair with text (required, error message).",
          ]}
        />
        <div className="flex items-center gap-2">
          <Badge variant="info">WCAG AA</Badge>
          <span className="text-xs text-muted-foreground">
            Minimum bar for all new UI - verify contrast when introducing a new token.
          </span>
        </div>
      </DocSection>
    </div>
  );
}
