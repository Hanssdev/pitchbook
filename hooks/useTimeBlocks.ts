"use client";

import { useMemo } from "react";

export interface TimeBlock {
  id: string;        // "18:00-19:00"
  startTime: string; // "18:00"
  endTime: string;   // "19:00"
  startLabel: string; // "6:00 PM"
  endLabel: string;   // "7:00 PM"
  startMinutes: number; // total minutes from midnight
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = m.toString().padStart(2, "0");
  return `${hour}:${min} ${period}`;
}

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

interface UseTimeBlocksOptions {
  open: string;                  // "08:00"
  close: string;                 // "22:00"
  slotDurationMinutes?: number;  // default 60
}

export function useTimeBlocks({
  open,
  close,
  slotDurationMinutes = 60,
}: UseTimeBlocksOptions): TimeBlock[] {
  return useMemo(() => {
    const startMinutes = parseTime(open);
    const endMinutes = parseTime(close);
    const blocks: TimeBlock[] = [];

    for (
      let current = startMinutes;
      current + slotDurationMinutes <= endMinutes;
      current += slotDurationMinutes
    ) {
      const next = current + slotDurationMinutes;
      const startH = String(Math.floor(current / 60)).padStart(2, "0");
      const startM = String(current % 60).padStart(2, "0");
      const endH = String(Math.floor(next / 60)).padStart(2, "0");
      const endM = String(next % 60).padStart(2, "0");

      const startTime = `${startH}:${startM}`;
      const endTime = `${endH}:${endM}`;

      blocks.push({
        id: `${startTime}-${endTime}`,
        startTime,
        endTime,
        startLabel: minutesToLabel(current),
        endLabel: minutesToLabel(next),
        startMinutes: current,
      });
    }

    return blocks;
  }, [open, close, slotDurationMinutes]);
}
