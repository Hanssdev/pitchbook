"use client";

import { useState, useEffect, useCallback } from "react";
import { useOwnerField } from "@/hooks/useOwnerField";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Reservation, ReservationStatus } from "@/types";

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

const STATUS_COLORS: Record<ReservationStatus | "blocked", string> = {
  pending:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-accent-2/20 text-accent-2 border-accent-2/30",
  cancelled: "bg-border text-muted border-border",
  blocked:   "bg-surface-2 text-muted border-border",
};

interface BlockedSlot {
  date: string;
  time_block: string;
}

export default function OwnerCalendarPage() {
  const { field, schedule, isLoading: fieldLoading } = useOwnerField();
  const { success, error: toastError } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(today));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedDayOfWeek = new Date(selectedDate + "T12:00:00").getDay() as 0|1|2|3|4|5|6;
  const daySchedule = schedule?.days.find((d) => d.day === selectedDayOfWeek);

  const blocks = useTimeBlocks({
    open: daySchedule?.open ?? "08:00",
    close: daySchedule?.close ?? "22:00",
    slotDurationMinutes: daySchedule?.slot_duration_minutes ?? 60,
  });

  const fetchDayData = useCallback(async () => {
    if (!field) return;
    setLoading(true);

    const [{ data: resData }, { data: blockedData }] = await Promise.all([
      supabase
        .from("reservations")
        .select("*")
        .eq("field_id", field.id)
        .eq("date", selectedDate),
      supabase
        .from("blocked_slots")
        .select("date, time_block")
        .eq("field_id", field.id)
        .eq("date", selectedDate),
    ]);

    setReservations((resData as Reservation[]) ?? []);
    setBlocked((blockedData as BlockedSlot[]) ?? []);
    setLoading(false);
  }, [field, selectedDate]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

  const toggleBlock = async (timeBlock: string) => {
    if (!field) return;
    const isBlocked = blocked.some((b) => b.time_block === timeBlock);

    if (isBlocked) {
      const { error } = await supabase
        .from("blocked_slots")
        .delete()
        .eq("field_id", field.id)
        .eq("date", selectedDate)
        .eq("time_block", timeBlock);

      if (!error) {
        setBlocked((prev) => prev.filter((b) => b.time_block !== timeBlock));
        success("Horario desbloqueado");
      } else {
        toastError("Error al desbloquear");
      }
    } else {
      const { error } = await supabase.from("blocked_slots").insert({
        field_id: field.id,
        date: selectedDate,
        time_block: timeBlock,
      });

      if (!error) {
        setBlocked((prev) => [...prev, { date: selectedDate, time_block: timeBlock }]);
        success("Horario bloqueado");
      } else {
        toastError("Error al bloquear");
      }
    }
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  if (fieldLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-40" /><Skeleton className="h-64" rounded="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <h1 className="font-display font-bold text-2xl text-text mb-6">Calendario</h1>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendario mensual */}
        <div className="rounded-xl border border-border bg-surface p-5">
          {/* Nav mes */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h2 className="font-display font-semibold text-text">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Header días */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[11px] text-muted font-mono uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Días */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateStr === toDateStr(today);
              const isSelected = dateStr === selectedDate;
              const isPast = new Date(dateStr) < new Date(toDateStr(today));

              return (
                <button
                  key={day}
                  onClick={() => !isPast && setSelectedDate(dateStr)}
                  disabled={isPast}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm transition-all duration-150",
                    isSelected && "bg-accent text-background font-bold",
                    isToday && !isSelected && "border border-accent/50 text-accent",
                    !isSelected && !isToday && !isPast && "text-text hover:bg-surface-2",
                    isPast && "text-muted/30 cursor-not-allowed"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            {[
              { color: "bg-accent/70", label: "Libre" },
              { color: "bg-amber-500/70", label: "Pendiente" },
              { color: "bg-accent-2/70", label: "Confirmado" },
              { color: "bg-surface-2", label: "Bloqueado" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel del día seleccionado */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display font-semibold text-text mb-1">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-AR", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </h3>
          {!daySchedule ? (
            <p className="text-sm text-muted mt-4">La cancha está cerrada este día.</p>
          ) : loading ? (
            <div className="space-y-2 mt-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" rounded="lg" />)}
            </div>
          ) : (
            <div className="space-y-2 mt-3">
              {blocks.map((block) => {
                const reservation = reservations.find((r) => r.time_block === block.id);
                const isBlockedSlot = blocked.some((b) => b.time_block === block.id);

                let state: "free" | "pending" | "confirmed" | "blocked" = "free";
                if (isBlockedSlot) state = "blocked";
                else if (reservation?.status === "pending") state = "pending";
                else if (reservation?.status === "confirmed") state = "confirmed";

                return (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
                      state === "free"
                        ? "border-border bg-surface-2 hover:border-accent/30"
                        : STATUS_COLORS[state]
                    )}
                  >
                    <span className="font-mono text-sm text-text">
                      {block.startLabel}
                    </span>
                    {state === "free" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBlock(block.id)}
                        className="text-xs"
                      >
                        Bloquear
                      </Button>
                    ) : state === "blocked" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBlock(block.id)}
                        className="text-xs"
                      >
                        Desbloquear
                      </Button>
                    ) : (
                      <Badge
                        status={state === "pending" ? "pending" : "approved"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
