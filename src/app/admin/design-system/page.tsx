"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Settings,
  FileText,
  Calendar as CalendarIcon,
  Inbox,
  AlertTriangle,
  Plus,
  Mail,
  Smile,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/DropdownMenu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Avatar, AvatarImage, AvatarFallback, InitialsAvatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Separator } from "@/components/ui/Separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/Command";
import { Calendar } from "@/components/ui/Calendar";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="space-y-1.5">
      <div
        className="h-14 w-full rounded-md border border-border"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <p className="text-xs font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{varName}</p>
    </div>
  );
}

function ToastDemoButtons() {
  const { addToast } = useToast();
  return (
    <Row>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          addToast({
            type: "success",
            message: "Care plan saved",
            description: "All changes were saved successfully.",
          })
        }
      >
        Success
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          addToast({
            type: "error",
            message: "Failed to save",
            description: "Please check the required fields.",
          })
        }
      >
        Error
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          addToast({
            type: "warning",
            message: "Review overdue",
            description: "This care plan review is 3 days overdue.",
          })
        }
      >
        Warning
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          addToast({
            type: "info",
            message: "New assignment",
            description: "You were assigned to a new client.",
          })
        }
      >
        Info
      </Button>
    </Row>
  );
}

const STATUS_EXAMPLES = [
  "active",
  "pending",
  "completed",
  "cancelled",
  "critical",
  "low",
  "medium",
  "high",
  "expired",
  "scheduled",
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(3);

  return (
    <div className="space-y-12 pb-24">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Design System</h1>
          <p className="text-sm text-muted-foreground">
            Tokens and component primitives for ThuisZorgHub. Phase 1 approval reference.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/design-system/docs"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Design Handbook &rarr;
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      <h1 className="sr-only">Foundations</h1>

      <Section
        title="Colors"
        description="Semantic tokens - resolve differently in light vs dark, never reference raw grays directly."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <Swatch name="Background" varName="--background" />
          <Swatch name="Foreground" varName="--foreground" />
          <Swatch name="Card" varName="--card" />
          <Swatch name="Popover" varName="--popover" />
          <Swatch name="Primary" varName="--primary" />
          <Swatch name="Secondary" varName="--secondary" />
          <Swatch name="Muted" varName="--muted" />
          <Swatch name="Accent" varName="--accent" />
          <Swatch name="Success" varName="--success" />
          <Swatch name="Warning" varName="--warning" />
          <Swatch name="Danger" varName="--danger" />
          <Swatch name="Info" varName="--info" />
          <Swatch name="Border" varName="--border" />
          <Swatch name="Ring" varName="--ring" />
          <Swatch name="Chart 1" varName="--chart-1" />
          <Swatch name="Chart 2" varName="--chart-2" />
          <Swatch name="Chart 3" varName="--chart-3" />
          <Swatch name="Chart 4" varName="--chart-4" />
          <Swatch name="Chart 5" varName="--chart-5" />
          <Swatch name="Chart 6" varName="--chart-6" />
        </div>
      </Section>

      <Section title="Typography" description="Inter, self-hosted via next/font.">
        <div className="space-y-3">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            Heading / 3xl semibold
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            Heading / 2xl semibold
          </p>
          <p className="text-xl font-semibold text-foreground">Heading / xl semibold</p>
          <p className="text-lg font-semibold text-foreground">Heading / lg semibold</p>
          <p className="text-base font-medium text-foreground">Body / base medium</p>
          <p className="text-sm text-foreground">Body / sm regular</p>
          <p className="text-sm text-muted-foreground">Body / sm muted</p>
          <p className="text-xs text-muted-foreground">Caption / xs muted</p>
        </div>
      </Section>

      <Section title="Radius & Elevation">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="space-y-2">
            <div className="h-16 rounded-sm border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">radius-sm</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">radius-md</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">radius-lg (default)</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-xl border border-border bg-muted" />
            <p className="text-xs text-muted-foreground">radius-xl</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-sm" />
            <p className="text-xs text-muted-foreground">shadow-sm</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-md" />
            <p className="text-xs text-muted-foreground">shadow-md</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-lg" />
            <p className="text-xs text-muted-foreground">shadow-lg</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-md bg-card shadow-xl" />
            <p className="text-xs text-muted-foreground">shadow-xl</p>
          </div>
        </div>
      </Section>

      <Section
        title="Icons"
        description="lucide-react only. Stroke 1.75, 3-step size scale (16/20/24px)."
      >
        <Row>
          {[Users, Search, Settings, FileText, CalendarIcon, Inbox, AlertTriangle, Mail, Smile].map(
            (Icon, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-md border border-border p-3"
              >
                <Icon className="h-6 w-6 text-foreground" strokeWidth={1.75} />
                <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              </div>
            )
          )}
        </Row>
      </Section>

      <Section title="Z-index scale" description="Portal-rendered layers, referenced as z-(--z-x).">
        <Row>
          <Badge>dropdown: 30</Badge>
          <Badge>popover: 40</Badge>
          <Badge>tooltip: 45</Badge>
          <Badge>modal: 50</Badge>
          <Badge>toast: 60</Badge>
        </Row>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <h1 className="sr-only">Components</h1>

      <Section title="Buttons">
        <div className="space-y-4">
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </Row>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row>
            <Button icon={<Plus className="h-4 w-4" />}>With icon</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </Row>
        </div>
      </Section>

      <Section title="Badges & Status">
        <div className="space-y-4">
          <Row>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </Row>
          <Row>
            {STATUS_EXAMPLES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </Row>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card bordered>
            <CardHeader>
              <CardTitle size="sm">Simple card</CardTitle>
            </CardHeader>
            <CardContent>Bordered, no hover elevation.</CardContent>
          </Card>
          <Card hover>
            <CardHeader>
              <CardTitle size="sm">Interactive card</CardTitle>
            </CardHeader>
            <CardContent>Hover to see elevation change.</CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                Action
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input label="Client name" placeholder="Jane Doe" required helperText="Full legal name" />
          <Input label="Email" placeholder="jane@example.com" error="Invalid email address" />
          <Select
            label="Branch"
            placeholder="Select a branch"
            options={[
              { value: "1", label: "Amsterdam" },
              { value: "2", label: "Rotterdam" },
            ]}
          />
          <DatePicker label="Start date" value={date} onChange={setDate} required />
          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            charLimit={200}
            className="sm:col-span-2"
          />
        </div>
      </Section>

      <Section title="Dialogs & Drawers">
        <Row>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            Open Drawer
          </Button>
        </Row>
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Archive care plan"
          actions={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setModalOpen(false)}>
                Archive
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            This care plan will be archived and hidden from active lists. This can be undone later.
          </p>
        </Modal>
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Client details"
          side="right"
        >
          <p className="text-sm text-muted-foreground">Drawer content goes here.</p>
        </Drawer>
      </Section>

      <Section title="Dropdown, Popover, Tooltip">
        <Row>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open dropdown</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Edit
                <DropdownMenuShortcut>E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem destructive>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <p className="text-sm text-foreground">Popover content, anchored to its trigger.</p>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>

          <Button variant="outline" onClick={() => setCommandOpen(true)}>
            Open command palette (demo)
          </Button>
          <CommandDialog isOpen={commandOpen} onClose={() => setCommandOpen(false)}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>New Care Plan</CommandItem>
                <CommandItem>New Client</CommandItem>
                <CommandItem>New Assignment</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                <CommandItem>
                  Dashboard
                  <CommandShortcut>D</CommandShortcut>
                </CommandItem>
                <CommandItem>Settings</CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </Row>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-muted-foreground">Overview tab content.</p>
          </TabsContent>
          <TabsContent value="goals">
            <p className="text-sm text-muted-foreground">Goals tab content.</p>
          </TabsContent>
          <TabsContent value="tasks">
            <p className="text-sm text-muted-foreground">Tasks tab content.</p>
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Avatar">
        <Row>
          <Avatar size="sm">
            <AvatarImage src="/nonexistent.jpg" alt="" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <InitialsAvatar name="Jane Doe" size="md" />
          <InitialsAvatar name="Pieter van der Berg" size="lg" />
        </Row>
      </Section>

      <Section title="Selection controls">
        <div className="space-y-6">
          <Row>
            <Switch defaultChecked />
            <Switch />
          </Row>
          <Row>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked /> Send email notifications
            </label>
          </Row>
          <RadioGroup defaultValue="active" className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <RadioGroupItem value="active" /> Active
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <RadioGroupItem value="inactive" /> Inactive
            </label>
          </RadioGroup>
        </div>
      </Section>

      <Section title="Separator & Accordion">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-foreground">Above</p>
            <Separator className="my-3" />
            <p className="text-sm text-foreground">Below</p>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Is this care plan template editable?</AccordionTrigger>
              <AccordionContent>Yes, every field can be customized per client.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I duplicate a care plan?</AccordionTrigger>
              <AccordionContent>Duplication is planned for a later phase.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      <Section title="Calendar">
        <Calendar mode="single" className="inline-block rounded-md border border-border" />
      </Section>

      <Section title="Table">
        <Table stickyHeader>
          <TableHead sticky>
            <tr>
              <TableHeaderCell>Client</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell sortable sortDirection="asc">
                Start date
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Jane Doe</TableCell>
              <TableCell>
                <StatusBadge status="active" />
              </TableCell>
              <TableCell>12 Jan 2026</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pieter van der Berg</TableCell>
              <TableCell>
                <StatusBadge status="pending" />
              </TableCell>
              <TableCell>03 Feb 2026</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="mt-4">
          <Pagination page={page} pageCount={8} onPageChange={setPage} />
        </div>
      </Section>

      <Section title="Loading states">
        <div className="space-y-4">
          <Row>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="rectangular" className="h-24 w-full" />
          </div>
        </div>
      </Section>

      <Section title="Empty & Error states">
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyState
            icon={Users}
            title="No Employees Yet"
            description="Invite your first employee to begin assigning care visits."
            action={<Button size="sm">Invite Employee</Button>}
          />
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Failed to load clients"
            description="Something went wrong while fetching the client list."
            action={
              <Button size="sm" variant="outline">
                Retry
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="Breadcrumb">
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Clients", href: "/admin/clients" },
            { label: "Jane Doe" },
          ]}
        />
      </Section>

      <Section title="Toast">
        <ToastDemoButtons />
      </Section>
    </div>
  );
}
