import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/core/context/auth-context";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "ThuisZorgHub - Smart Software for Modern Homecare",
  description:
    "ThuisZorgHub is a modern, cloud-based SaaS platform for homecare agencies in the Netherlands",
  keywords: ["homecare", "SaaS", "Netherlands", "scheduling", "management"],
  authors: [{ name: "ThuisZorgHub" }],
  openGraph: {
    title: "ThuisZorgHub",
    description: "Smart Software for Modern Homecare",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
