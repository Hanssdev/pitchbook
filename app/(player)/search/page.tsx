import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Fields",
};

export default function SearchPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Find a Field</h1>
      <p className="mt-1 text-zinc-500">
        Search for available football fields near you.
      </p>

      <div className="mt-6 flex gap-3">
        <input
          type="text"
          placeholder="Search by location or field name..."
          className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700">
          Search
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <p className="col-span-full text-center text-zinc-400">
          No fields found. Try a different search.
        </p>
      </div>
    </div>
  );
}
