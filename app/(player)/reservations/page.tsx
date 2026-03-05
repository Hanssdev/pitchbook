import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Reservations",
};

export default function ReservationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">My Reservations</h1>
      <p className="mt-1 text-zinc-500">
        View and manage your upcoming and past reservations.
      </p>

      <div className="mt-8 space-y-4">
        <p className="text-center text-zinc-400">
          No reservations yet. Find a field to get started.
        </p>
      </div>
    </div>
  );
}
