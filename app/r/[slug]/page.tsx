import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Reservation, Field, ReservationPlayer } from "@/types";
import PublicReservationView from "./PublicReservationView";

const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabaseServer
    .from("reservations")
    .select("*, field:fields(name)")
    .eq("share_slug", slug)
    .single();

  if (!data) return { title: "Reserva" };
  const r = data as unknown as Reservation & { field: Field };
  return {
    title: `Reserva en ${r.field?.name ?? "cancha"} — PitchBook`,
  };
}

export default async function PublicReservationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [{ data: resData }, ] = await Promise.all([
    supabaseServer
      .from("reservations")
      .select("*, field:fields(*)")
      .eq("share_slug", slug)
      .single(),
  ]);

  if (!resData) notFound();

  const { data: playersData } = await supabaseServer
    .from("reservation_players")
    .select("*, user:users(*)")
    .eq("reservation_id", (resData as unknown as Reservation).id);

  return (
    <PublicReservationView
      reservation={resData as unknown as Reservation & { field: Field }}
      players={(playersData ?? []) as unknown as ReservationPlayer[]}
    />
  );
}
