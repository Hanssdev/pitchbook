"use client";

import Link from "next/link";
import { useOwnerField } from "@/hooks/useOwnerField";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabaseUntyped as supabase } from "@/lib/supabase/untyped";
import { useEffect, useState } from "react";
import type { Reservation } from "@/types";

/* ── Stat Card ── */
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card variant={accent ? "glow" : "bordered"} padding="md">
      <p className="text-xs text-muted uppercase tracking-widest font-mono mb-2">{label}</p>
      <p className={`font-display font-bold text-3xl ${accent ? "text-accent" : "text-text"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </Card>
  );
}

/* ── Quick Action ── */
function QuickAction({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card variant="bordered" padding="md" hoverable className="h-full">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-text text-sm">{label}</p>
            <p className="text-xs text-muted mt-0.5">{description}</p>
          </div>
          <svg className="ml-auto shrink-0 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}

export default function OwnerDashboardPage() {
  const { field, isLoading: fieldLoading } = useOwnerField();
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [resLoading, setResLoading] = useState(true);

  useEffect(() => {
    if (!field) return;
    const today = new Date().toISOString().split("T")[0];

    supabase
      .from("reservations")
      .select("*")
      .eq("field_id", field.id)
      .eq("date", today)
      .then(({ data }) => {
        setTodayReservations((data as Reservation[]) ?? []);
        setResLoading(false);
      });
  }, [field]);

  const confirmed = todayReservations.filter((r) => r.status === "confirmed").length;
  const pending = todayReservations.filter((r) => r.status === "pending").length;
  const estimatedRevenue = confirmed * (field?.price_per_hour ?? 0);

  if (fieldLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" rounded="lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-text">
          {field ? `Hola, ${field.name}` : "Bienvenido"}
        </h1>
        <p className="text-muted text-sm mt-1">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Sin cancha → CTA */}
      {!field && (
        <EmptyState
          title="Todavía no registraste tu cancha"
          description="Configurá tu cancha para empezar a recibir reservas."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="3" />
              <line x1="12" y1="3" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="21" />
            </svg>
          }
          action={
            <Link href="/owner/field/setup">
              <Button variant="primary">Registrar mi cancha</Button>
            </Link>
          }
        />
      )}

      {field && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <StatCard label="Reservas hoy" value={todayReservations.length} accent />
            <StatCard label="Confirmadas" value={confirmed} sub="hoy" />
            <StatCard label="Pendientes" value={pending} sub="sin revisar" />
            <StatCard
              label="Ingresos est."
              value={`$${estimatedRevenue.toLocaleString("es-AR")}`}
              sub="hoy"
            />
          </div>

          {/* Accesos rápidos */}
          <div>
            <h2 className="font-display font-semibold text-text mb-4">Accesos rápidos</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <QuickAction
                href="/owner/field/setup"
                label="Mi Cancha"
                description="Editar datos, fotos y horarios"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="3" />
                  </svg>
                }
              />
              <QuickAction
                href="/owner/calendar"
                label="Calendario"
                description="Ver disponibilidad y bloquear horas"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
              <QuickAction
                href="/owner/reservations"
                label="Solicitudes"
                description={`${pending} pendiente${pending !== 1 ? "s" : ""} por revisar`}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Reservas de hoy */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-text">Reservas de hoy</h2>
              <Link href="/owner/reservations" className="text-xs text-accent hover:underline">
                Ver todas
              </Link>
            </div>

            {resLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" rounded="lg" />)}
              </div>
            ) : todayReservations.length === 0 ? (
              <EmptyState
                title="Sin reservas para hoy"
                description="Cuando lleguen solicitudes aparecerán aquí."
              />
            ) : (
              <div className="space-y-2">
                {todayReservations.map((r) => (
                  <Card key={r.id} variant="default" padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-text font-medium">{r.time_block}</span>
                        <Badge status={r.status === "confirmed" ? "approved" : r.status === "pending" ? "pending" : "rejected"} />
                      </div>
                      <Link href={`/owner/reservations`} className="text-xs text-muted hover:text-text">
                        Ver →
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
