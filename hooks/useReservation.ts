"use client";

import { useReservationContext } from "@/lib/contexts/ReservationContext";

export function useReservation() {
  return useReservationContext();
}
