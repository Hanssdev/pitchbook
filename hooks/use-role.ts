"use client";

import { useAuth } from "@clerk/nextjs";

type Role = "owner" | "player" | null;

export function useRole(): Role {
  const { sessionClaims } = useAuth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role === "owner" || role === "player") return role;
  return null;
}
