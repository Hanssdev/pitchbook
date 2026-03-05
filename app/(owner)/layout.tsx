import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "owner") {
    redirect("/search");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-xl font-bold text-green-600">PitchBook</span>
          <span className="text-sm text-zinc-500">Owner Dashboard</span>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
