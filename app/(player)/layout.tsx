import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PlayerNavbar } from "@/components/layout/PlayerNavbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <PlayerNavbar />
        <main className="pb-20 lg:pb-0">{children}</main>
        <BottomNav role="player" />
      </div>
    </ToastProvider>
  );
}
