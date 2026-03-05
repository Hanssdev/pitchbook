import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OwnerSidebar } from "@/components/layout/OwnerSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { FieldProvider } from "@/lib/contexts/FieldContext";
import { ToastProvider } from "@/components/ui/Toast";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "owner") redirect("/player/search");

  return (
    <ToastProvider>
      <FieldProvider>
        <div className="flex min-h-screen bg-background">
          <OwnerSidebar />
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            {children}
          </main>
          <BottomNav role="owner" />
        </div>
      </FieldProvider>
    </ToastProvider>
  );
}
