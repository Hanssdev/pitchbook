"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase/client";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { TimeBlock } from "@/components/ui/TimeBlock";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Field, Reservation, DaySchedule } from "@/types";

const DAYS_ES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function toDateStr(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function FieldDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { userId } = useAuth();
  const router = useRouter();

  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("fields")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setField(data as Field);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!field) return;
    supabase
      .from("reservations")
      .select("time_block, status")
      .eq("field_id", field.id)
      .eq("date", selectedDate)
      .in("status", ["pending", "confirmed"])
      .then(({ data }) => setReservations((data as Reservation[]) ?? []));
  }, [field, selectedDate]);

  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay() as DaySchedule["day"];
  const daySchedule = field?.schedule.days.find((d) => d.day === dayOfWeek);

  const blocks = useTimeBlocks({
    open: daySchedule?.open ?? "08:00",
    close: daySchedule?.close ?? "22:00",
    slotDurationMinutes: daySchedule?.slot_duration_minutes ?? 60,
  });

  const takenBlocks = new Set(reservations.map((r) => r.time_block));

  // Next 7 days selector
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <Skeleton className="aspect-video w-full" rounded="lg" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted">Cancha no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      {/* Fotos */}
      {field.photos.length > 0 ? (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-2">
          <Image src={field.photos[photoIndex]} alt={field.name} fill className="object-cover" />
          {field.photos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {field.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === photoIndex ? "w-5 bg-text" : "w-1.5 bg-text/40"}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video rounded-xl bg-surface-2 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text">{field.name}</h1>
          <p className="text-muted text-sm mt-1 flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {field.location}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="font-mono font-bold text-xl text-accent">
            ${field.price_per_hour.toLocaleString("es-AR")}
          </span>
          <p className="text-xs text-muted">por hora</p>
        </div>
      </div>

      {/* Horarios por día */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="font-display font-semibold text-sm text-text mb-3">Disponibilidad semanal</h3>
        <div className="grid grid-cols-7 gap-1">
          {[0,1,2,3,4,5,6].map((day) => {
            const s = field.schedule.days.find((d) => d.day === day);
            return (
              <div key={day} className="text-center">
                <p className="text-[10px] font-mono text-muted mb-1">{DAYS_ES[day].slice(0, 3)}</p>
                {s ? (
                  <div className="text-[10px] text-text space-y-0.5">
                    <p>{s.open}</p>
                    <p className="text-muted">—</p>
                    <p>{s.close}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted/40">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selector de fecha */}
      <div>
        <h3 className="font-display font-semibold text-text mb-3">Elegí una fecha</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {next7Days.map((date) => {
            const str = toDateStr(date);
            const isSelected = str === selectedDate;
            const dow = date.getDay();
            const hasSched = field.schedule.days.some((d) => d.day === dow);

            return (
              <button
                key={str}
                onClick={() => { setSelectedDate(str); setSelectedBlock(null); }}
                disabled={!hasSched}
                className={`shrink-0 flex flex-col items-center rounded-xl px-3 py-2.5 border transition-all ${
                  isSelected
                    ? "bg-accent/10 border-accent/40 text-accent"
                    : hasSched
                    ? "border-border bg-surface-2 text-text hover:border-accent/30"
                    : "border-border/50 bg-surface-2/50 text-muted/40 cursor-not-allowed"
                }`}
              >
                <span className="text-[10px] font-mono uppercase">{DAYS_ES[dow].slice(0, 3)}</span>
                <span className="font-bold text-lg leading-none mt-0.5">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de hora */}
      {daySchedule ? (
        <div>
          <h3 className="font-display font-semibold text-text mb-3">Elegí un horario</h3>
          <div className="flex flex-wrap gap-2">
            {blocks.map((block) => {
              const taken = takenBlocks.has(block.id);
              const isSelected = selectedBlock === block.id;

              return (
                <TimeBlock
                  key={block.id}
                  startTime={block.startLabel}
                  endTime={block.endLabel}
                  price={field.price_per_hour}
                  state={taken ? "taken" : isSelected ? "selected" : "available"}
                  onClick={() => !taken && setSelectedBlock(isSelected ? null : block.id)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted text-center py-4">
          La cancha está cerrada el{" "}
          {DAYS_ES[new Date(selectedDate + "T12:00:00").getDay()].toLowerCase()}.
        </p>
      )}

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!selectedBlock}
        onClick={() => {
          if (selectedBlock && userId) {
            router.push(
              `/player/reserve/${field.id}?date=${selectedDate}&block=${encodeURIComponent(selectedBlock)}`
            );
          }
        }}
      >
        {selectedBlock ? `Reservar ${selectedBlock}` : "Seleccioná un horario"}
      </Button>
    </div>
  );
}
