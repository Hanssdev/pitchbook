import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-xl font-bold text-green-600">PitchBook</span>
          <div className="flex gap-4 text-sm font-medium">
            <a href="/search" className="text-zinc-700 hover:text-green-600">
              Find Fields
            </a>
            <a
              href="/reservations"
              className="text-zinc-700 hover:text-green-600"
            >
              My Reservations
            </a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
