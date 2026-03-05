"use client";

import { useState, useEffect, useCallback } from "react";
import { useOwnerField } from "@/hooks/useOwnerField";
import { supabaseUntyped as supabase } from "@/lib/supabase/untyped";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Reservation, ReservationStatus } from "@/types";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

type Filter = "all" | ReservationStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "cancelled", label: "Rechazadas" },
];

interface ReservationWithUser extends Reservation {
  player_name?: string;
  player_phone?: string;
  player_email?: string;
}

export default function OwnerReservationsPage() {
  const { field, isLoading: fieldLoading } = useOwnerField();
  const { success, error: toastError } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [reservations, setReservations] = useState<ReservationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!field) return;
    setLoading(true);

    const { data } = await supabase
      .from("reservations")
      .select("*, player:users(name, phone, email)")
      .eq("field_id", field.id)
      .order("date", { ascending: false })
      .order("time_block", { ascending: true });

    setReservations(
      ((data ?? []) as unknown[]).map((r: unknown) => {
        const row = r as Record<string, unknown>;
        const player = row.player as Record<string, string> | null;
        return {
          ...(row as unknown as Reservation),
          player_name: player?.name,
          player_phone: player?.phone,
          player_email: player?.email,
        };
      })
    );
    setLoading(false);
  }, [field]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Realtime updates
  useEffect(() => {
    if (!field) return;
    const channel = supabase
      .channel(`reservations:${field.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations", filter: `field_id=eq.${field.id}` },
        () => fetchReservations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [field, fetchReservations]);

  const updateStatus = async (id: string, status: ReservationStatus) => {
    setActionId(id);
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id);

    setActionId(null);

    if (error) {
      toastError("Error al actualizar la reserva");
    } else {
      success(status === "confirmed" ? "Reserva aprobada" : "Reserva rechazada");
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
  };

  const filtered = filter === "all"
    ? reservations
    : reservations.filter((r) => r.status === filter);

  const counts = {
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  if (fieldLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" rounded="lg" />)}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-text">Solicitudes</h1>
          <p className="text-muted text-sm mt-1">
            {counts.pending} pendiente{counts.pending !== 1 ? "s" : ""} · {counts.confirmed} confirmada{counts.confirmed !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              filter === f.value
                ? "bg-accent/10 text-accent border border-accent/30"
                : "bg-surface-2 text-muted border border-border hover:text-text"
            )}
          >
            {f.label}
            {f.value !== "all" && counts[f.value as ReservationStatus] > 0 && (
              <span className="ml-1.5 text-xs opacity-70">
                {counts[f.value as ReservationStatus]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" rounded="lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin reservas"
          description={filter === "all" ? "Todavía no llegaron solicitudes." : `No hay reservas ${filter === "pending" ? "pendientes" : filter === "confirmed" ? "confirmadas" : "rechazadas"}.`}
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {filtered.map((r) => (
            <Card key={r.id} variant="bordered" padding="none">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text text-sm">
                        {r.player_name ?? "Jugador"}
                      </span>
                      <Badge status={r.status === "confirmed" ? "approved" : r.status === "pending" ? "pending" : "rejected"} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted font-mono">
                      <span>{new Date(r.date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</span>
                      <span>·</span>
                      <span>{r.time_block}</span>
                    </div>
                    {r.player_phone && (
                      <a href={`tel:${r.player_phone}`} className="text-xs text-accent hover:underline">
                        {r.player_phone}
                      </a>
                    )}
                  </div>

                  {r.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actionId === r.id}
                        onClick={() => updateStatus(r.id, "cancelled")}
                      >
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        loading={actionId === r.id}
                        onClick={() => updateStatus(r.id, "confirmed")}
                      >
                        Aprobar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
