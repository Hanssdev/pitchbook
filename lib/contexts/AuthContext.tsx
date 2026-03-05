"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import type { UserRole } from "@/types";

interface AuthContextValue {
  user: ReturnType<typeof useUser>["user"];
  role: UserRole | null;
  isOwner: boolean;
  isPlayer: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_ROUTES = ["/sign-in", "/sign-up"];
const ROLE_REDIRECT: Record<UserRole, string> = {
  owner: "/owner/dashboard",
  player: "/player/search",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { sessionClaims } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  const rawRole = (sessionClaims?.metadata as { role?: string })?.role;
  const role: UserRole | null =
    rawRole === "owner" || rawRole === "player" ? rawRole : null;

  const isOwner = role === "owner";
  const isPlayer = role === "player";
  const isLoading = !isLoaded;

  // Redirect on login based on role
  useEffect(() => {
    if (!isLoaded || !user || !role) return;
    if (hasRedirected.current) return;

    const onAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));
    const onRoot = pathname === "/";

    if (onAuthPage || onRoot) {
      hasRedirected.current = true;
      router.replace(ROLE_REDIRECT[role]);
    }
  }, [isLoaded, user, role, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, role, isOwner, isPlayer, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
