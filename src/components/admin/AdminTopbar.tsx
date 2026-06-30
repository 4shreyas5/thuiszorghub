/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "@/hooks/useSession";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/core/database/client";
import { Search, Bell, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "employee" | "client" | "branch";
  [key: string]: string;
}

export function AdminTopbar() {
  const { session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const performSearch = useCallback(async () => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }
    try {
      const [employees, clients, branches] = await Promise.all([
        supabase
          .from("employees")
          .select("id, first_name, last_name, email")
          .ilike("first_name", `%${debouncedSearch}%`)
          .limit(5),
        supabase
          .from("clients")
          .select("id, first_name, last_name, email")
          .ilike("first_name", `%${debouncedSearch}%`)
          .limit(5),
        supabase
          .from("branches")
          .select("id, name")
          .ilike("name", `%${debouncedSearch}%`)
          .limit(5)
      ]);

      const results: SearchResult[] = [];

      if (employees.data) {
        results.push(...(employees.data as any[]).map((e) => ({ ...e, type: "employee" as const })));
      }
      if (clients.data) {
        results.push(...(clients.data as any[]).map((c) => ({ ...c, type: "client" as const })));
      }
      if (branches.data) {
        results.push(...(branches.data as any[]).map((b) => ({ ...b, type: "branch" as const })));
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div ref={searchRef} className="flex-1 max-w-md relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                {searchResults.map((result: any) => (
                  <a
                    key={result.id}
                    href={result.type === "employee" ? `/admin/employees/${result.id}` : result.type === "client" ? `/admin/clients/${result.id}` : `/admin/branches/${result.id}`}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {result.first_name || result.last_name || result.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.type === "employee" && result.email}
                      {result.type === "client" && result.email}
                      {result.type === "branch" && "Branch"}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 ml-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <Bell className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{(session as any)?.user?.user_metadata?.first_name || "User"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 first:rounded-t-lg last:rounded-b-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
