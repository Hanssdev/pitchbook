"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@clerk/nextjs";
import type { Field, FieldSchedule } from "@/types";

/* ── Mock Data ── */
const MOCK_FIELD: Field = {
  id: "field-001",
  owner_id: "owner-clerk-id",
  name: "Cancha El Barrio",
  location: "Av. Corrientes 1234, Buenos Aires",
  price_per_hour: 15000,
  photos: [],
  schedule: {
    days: [
      { day: 1, open: "08:00", close: "22:00", slot_duration_minutes: 60 },
      { day: 2, open: "08:00", close: "22:00", slot_duration_minutes: 60 },
      { day: 3, open: "08:00", close: "22:00", slot_duration_minutes: 60 },
      { day: 4, open: "08:00", close: "22:00", slot_duration_minutes: 60 },
      { day: 5, open: "08:00", close: "22:00", slot_duration_minutes: 60 },
      { day: 6, open: "09:00", close: "20:00", slot_duration_minutes: 60 },
      { day: 0, open: "09:00", close: "20:00", slot_duration_minutes: 60 },
    ],
  },
  created_at: new Date().toISOString(),
};

/* ── Context ── */
interface FieldContextValue {
  field: Field | null;
  schedule: FieldSchedule | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function FieldProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [field, setField] = useState<Field | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchField = useCallback(async () => {
    if (!userId) {
      setField(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // TODO: replace with real Supabase query
    await new Promise((r) => setTimeout(r, 400));
    setField(MOCK_FIELD);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchField();
  }, [fetchField]);

  return (
    <FieldContext.Provider
      value={{
        field,
        schedule: field?.schedule ?? null,
        isLoading,
        refetch: fetchField,
      }}
    >
      {children}
    </FieldContext.Provider>
  );
}

export function useFieldContext(): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) throw new Error("useFieldContext must be used inside <FieldProvider>");
  return ctx;
}
