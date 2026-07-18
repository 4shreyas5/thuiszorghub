/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, UserRound, Building2, ArrowRight } from "lucide-react";
import { supabaseBrowserClient } from "@/core/auth/clients";
import { useDebounce } from "@/hooks/useDebounce";
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
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";
import { QUICK_ACTIONS } from "./QuickActions";
import { SECTIONS } from "@/components/admin/AdminSidebar";

const NAV_LINKS = [
  { label: "Dashboard", href: "/admin" },
  ...SECTIONS.flatMap((section) =>
    section.links.map((link) => ({ label: `${section.label} · ${link.label}`, href: link.href }))
  ),
];

interface SearchResult {
  id: string;
  type: "employee" | "client" | "branch";
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
}

const RESULT_ICON = { employee: User, client: UserRound, branch: Building2 };

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  // Same multi-table lookup the shell has always used - only the presentation moved.
  const performSearch = useCallback(async () => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    try {
      const [employees, clients, branches] = await Promise.all([
        supabaseBrowserClient
          .from("employees")
          .select("id, first_name, last_name, email")
          .ilike("first_name", `%${debouncedQuery}%`)
          .limit(5),
        supabaseBrowserClient
          .from("clients")
          .select("id, first_name, last_name, email")
          .ilike("first_name", `%${debouncedQuery}%`)
          .limit(5),
        supabaseBrowserClient
          .from("branches")
          .select("id, name")
          .ilike("name", `%${debouncedQuery}%`)
          .limit(5),
      ]);

      const found: SearchResult[] = [];
      if (employees.data)
        found.push(...(employees.data as any[]).map((e) => ({ ...e, type: "employee" as const })));
      if (clients.data)
        found.push(...(clients.data as any[]).map((c) => ({ ...c, type: "client" as const })));
      if (branches.data)
        found.push(...(branches.data as any[]).map((b) => ({ ...b, type: "branch" as const })));
      setResults(found);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const goTo = (href: string) => {
    close();
    router.push(href);
  };

  const resultHref = (result: SearchResult) =>
    result.type === "employee"
      ? `/admin/employees/${result.id}`
      : result.type === "client"
        ? `/admin/clients/${result.id}`
        : `/admin/branches/${result.id}`;

  return (
    <>
      {/* Compact trigger - mobile only, keeps search reachable below the sm breakpoint */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
      >
        <Search className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
      </button>

      {/* Wide input-style trigger - tablet/desktop */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-56 items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex lg:w-72"
      >
        <Search className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
        <span className="flex-1 truncate text-left">Search...</span>
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog isOpen={open} onClose={close}>
        <CommandInput
          placeholder="Search employees, clients, branches..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {query ? "No results found." : "Type to search, or pick a quick action below."}
          </CommandEmpty>

          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => {
                const Icon = RESULT_ICON[result.type];
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => goTo(resultHref(result))}
                  >
                    <Icon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                    <span>
                      {result.first_name
                        ? `${result.first_name} ${result.last_name ?? ""}`.trim()
                        : result.name}
                    </span>
                    {result.email && (
                      <span className="ml-auto text-xs text-muted-foreground">{result.email}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {!query && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Go to">
                {NAV_LINKS.map((link) => (
                  <CommandItem key={link.href} value={link.label} onSelect={() => goTo(link.href)}>
                    <ArrowRight className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                    {link.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Quick Actions">
                {QUICK_ACTIONS.map((action) => (
                  <CommandItem
                    key={action.href}
                    value={action.label}
                    onSelect={() => goTo(action.href)}
                  >
                    <action.icon className={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} />
                    {action.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
        <div className="flex items-center justify-end border-t border-border px-4 py-2">
          <CommandShortcut>Ctrl K to toggle</CommandShortcut>
        </div>
      </CommandDialog>
    </>
  );
}
