"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import type { Reservation, Field, ReservationPlayer } from "@/types";

const FIELD_SLOTS = [
  { id: "gk",   x: 50, y: 88 },
  { id: "cb-l", x: 25, y: 70 },
  { id: "cb-r", x: 75, y: 70 },
  { id: "cm-l", x: 20, y: 45 },
  { id: "cm-c", x: 50, y: 48 },
  { id: "cm-r", x: 80, y: 45 },
  { id: "st-l", x: 28, y: 18 },
  { id: "st-c", x: 50, y: 12 },
  { id: "st-r", x: 72, y: 18 },
];

interface Props {
  reservation: Reservation & { field: Field };
  players: ReservationPlayer[];
}

export default function PublicReservationView({ reservation, players: initialPlayers }: Props) {
  const { success, error: toastError } = useToast();
  const [players, setPlayers] = useState(initialPlayers);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Create anonymous player record
    const tempId = crypto.randomUUID();

    await supabase.from("users").upsert({
      id: tempId,
      role: "player" as const,
      name: form.name.trim(),
      email: `${tempId}@anonymous.pitchbook`,
      phone: form.phone.trim() || null,
    });

    const { error } = await supabase.from("reservation_players").insert({
      reservation_id: reservation.id,
      player_id: tempId,
      position: null,
    });

    setSubmitting(false);

    if (error) {
      toastError("No se pudo agregar. Intentá de nuevo.");
    } else {
      success("¡Te agregaste al equipo!");
      setPlayers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          reservation_id: reservation.id,
          player_id: tempId,
          position: null,
          joined_at: new Date().toISOString(),
          user: { id: tempId, role: "player", name: form.name, email: "", phone: form.phone || null, created_at: new Date().toISOString() },
        },
      ]);
      setShowForm(false);
      setForm({ name: "", phone: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="font-display font-bold text-2xl text-text">
            Pitch<span className="text-accent">Book</span>
          </span>
          <p className="text-muted text-sm">Invitación a partido</p>
        </div>

        {/* Info reserva */}
        <Card variant="glow" padding="md">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display font-bold text-lg text-text">
                  {reservation.field.name}
                </h1>
                <p className="text-xs text-muted mt-0.5">{reservation.field.location}</p>
              </div>
              <Badge
                status={
                  reservation.status === "confirmed"
                    ? "approved"
                    : reservation.status === "pending"
                    ? "pending"
                    : "rejected"
                }
              />
            </div>

            <div className="flex gap-4 text-xs font-mono text-muted pt-1 border-t border-border">
              <span className="text-text font-medium">
                {new Date(reservation.date + "T12:00:00").toLocaleDateString("es-AR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </span>
              <span>·</span>
              <span className="text-text font-medium">{reservation.time_block}</span>
            </div>

            <div className="text-xs text-muted">
              <span className="text-accent font-mono font-semibold text-sm">
                ${reservation.field.price_per_hour.toLocaleString("es-AR")}
              </span>{" "}
              por hora
            </div>
          </div>
        </Card>

        {/* Cancha readonly */}
        <div>
          <h2 className="font-display font-semibold text-text mb-3">
            Equipo ({players.length} jugador{players.length !== 1 ? "es" : ""})
          </h2>
          <div
            className="relative w-full rounded-2xl overflow-hidden border border-border"
            style={{ aspectRatio: "2/3", background: "#1a3d1a" }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150" preserveAspectRatio="none">
              <rect x="1" y="1" width="98" height="148" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" rx="2" />
              <line x1="1" y1="75" x2="99" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
              <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
              <rect x="20" y="1" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
              <rect x="20" y="129" width="60" height="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
            </svg>

            {/* Players en posiciones (readonly) */}
            {FIELD_SLOTS.slice(0, players.length).map((slot, i) => {
              const player = players[i];
              return (
                <div
                  key={slot.id}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: "translate(-50%, -50%)" }}
                  className="absolute flex flex-col items-center"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-accent/20 text-accent font-bold text-sm shadow-lg">
                    {(player.user?.name ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="mt-1 text-[9px] text-white/70 text-center w-14 truncate">
                    {(player.user?.name ?? "?").split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista jugadores */}
        {players.length > 0 && (
          <Card variant="bordered" padding="sm">
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                    {(p.user?.name ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-text">{p.user?.name ?? "Jugador"}</span>
                  {p.user?.phone && (
                    <a href={`tel:${p.user.phone}`} className="ml-auto text-xs text-muted hover:text-text font-mono">
                      {p.user.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* CTA agregar */}
        {!showForm ? (
          <Button variant="primary" size="lg" className="w-full" onClick={() => setShowForm(true)}>
            Agregarme como jugador
          </Button>
        ) : (
          <Card variant="bordered" padding="md">
            <CardHeader><CardTitle>Tus datos</CardTitle></CardHeader>
            <CardBody>
              <form onSubmit={handleJoin} className="space-y-4">
                <Input
                  label="Nombre"
                  placeholder="Juan Pérez"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label="Teléfono (opcional)"
                  type="tel"
                  placeholder="+54 9 11 1234 5678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
                    Unirme
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
