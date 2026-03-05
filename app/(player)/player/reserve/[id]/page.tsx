"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { supabaseUntyped as supabase } from "@/lib/supabase/untyped";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Field } from "@/types";

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: fieldId } = use(params);
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();

  const date = searchParams.get("date") ?? "";
  const block = searchParams.get("block") ?? "";

  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    players_per_team: "5",
    message: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    supabase
      .from("fields")
      .select("*")
      .eq("id", fieldId)
      .single()
      .then(({ data }) => {
        setField(data as Field);
        setLoading(false);
      });
  }, [fieldId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !field) return;
    setSubmitting(true);

    const slug = generateSlug();

    // Upsert user profile
    await supabase.from("users").upsert({
      id: userId,
      role: "player",
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
    });

    // Create reservation
    const { data: resData, error } = await supabase
      .from("reservations")
      .insert({
        field_id: field.id,
        player_id: userId,
        date,
        time_block: block,
        status: "pending",
        share_slug: slug,
      })
      .select()
      .single();

    if (error || !resData) {
      setSubmitting(false);
      toastError("Error al crear la reserva");
      return;
    }

    // Add creator as first player
    await supabase.from("reservation_players").insert({
      reservation_id: resData.id,
      player_id: userId,
      position: null,
    });

    success("¡Reserva enviada! Aguardá la confirmación del dueño.");
    router.push(`/player/reserve/${resData.id}/lineup`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" rounded="lg" />)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-text">Confirmar reserva</h1>
        {field && (
          <p className="text-muted text-sm mt-1">
            {field.name} · <span className="font-mono">{date} · {block}</span>
          </p>
        )}
      </div>

      {/* Resumen */}
      {field && (
        <Card variant="glow" padding="md" className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-text">{field.name}</p>
              <p className="text-xs text-muted mt-0.5">{field.location}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-accent text-lg">
                ${field.price_per_hour.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-muted">por hora</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs font-mono text-muted">
            <span>{new Date(date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</span>
            <span>·</span>
            <span>{block}</span>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card variant="bordered" padding="md">
          <CardHeader><CardTitle>Tus datos</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
              <Input
                label="Teléfono"
                type="tel"
                placeholder="+54 9 11 1234 5678"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="juan@mail.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
          </CardBody>
        </Card>

        <Card variant="bordered" padding="md">
          <CardHeader><CardTitle>Equipo</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Jugadores por equipo</label>
                <div className="flex gap-2">
                  {["5", "6", "7", "8", "11"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set("players_per_team", n)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-mono font-medium transition-all ${
                        form.players_per_team === n
                          ? "bg-accent/10 border-accent/40 text-accent"
                          : "border-border bg-surface-2 text-muted hover:text-text"
                      }`}
                    >
                      {n}v{n}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                label="Mensaje al dueño (opcional)"
                placeholder="Cualquier consulta o detalle especial..."
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                rows={3}
              />
            </div>
          </CardBody>
        </Card>

        <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
          Enviar reserva
        </Button>
        <p className="text-center text-xs text-muted">
          La reserva queda pendiente hasta que el dueño la apruebe.
        </p>
      </form>
    </div>
  );
}
