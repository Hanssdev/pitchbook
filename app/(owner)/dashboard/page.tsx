import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function OwnerDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">My Fields</h1>
      <p className="mt-1 text-zinc-500">
        Manage your football fields, availability and reservations.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center">
          <p className="text-zinc-400">No fields yet.</p>
          <button className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Add your first field
          </button>
        </div>
      </div>
    </div>
  );
}
