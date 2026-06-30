import { AdminLayout } from "@/components/admin/AdminLayout";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
