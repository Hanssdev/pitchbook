"use client";

import { useFieldContext } from "@/lib/contexts/FieldContext";

export function useOwnerField() {
  return useFieldContext();
}
