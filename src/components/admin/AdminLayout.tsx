"use client";

import { ReactNode, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { AdminSidebar, SidebarContent, OrgIdentity } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Drawer } from "@/components/ui/Drawer";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isLoading } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <AdminSidebar />

      <Drawer isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Menu">
        <div className="-m-6">
          <OrgIdentity />
          <div className="py-2">
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      </Drawer>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden pt-4 pr-4 pb-4">
        <AdminTopbar onOpenMobileNav={() => setMobileNavOpen(true)} elevated={scrolled} />

        <main
          className="flex-1 overflow-y-auto"
          onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
        >
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
