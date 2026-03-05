"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { Reservation, ReservationPlayer } from "@/types";

/* ── Team Board Types ── */
export interface BoardSlot {
  id: string;
  x: number;        // percentage 0–100 on pitch width
  y: number;        // percentage 0–100 on pitch height
  playerId: string | null;
}

export interface TeamBoard {
  color: string;
  slots: BoardSlot[];
}

const DEFAULT_SLOTS: Omit<BoardSlot, "playerId">[] = [
  { id: "slot-gk",   x: 50, y: 90 },
  { id: "slot-cb-l", x: 25, y: 70 },
  { id: "slot-cb-r", x: 75, y: 70 },
  { id: "slot-cm-l", x: 25, y: 45 },
  { id: "slot-cm-c", x: 50, y: 45 },
  { id: "slot-cm-r", x: 75, y: 45 },
  { id: "slot-st-l", x: 30, y: 15 },
  { id: "slot-st-c", x: 50, y: 15 },
  { id: "slot-st-r", x: 70, y: 15 },
];

function buildDefaultBoard(color = "#00e676"): TeamBoard {
  return {
    color,
    slots: DEFAULT_SLOTS.map((s) => ({ ...s, playerId: null })),
  };
}

/* ── Mock Data ── */
const MOCK_RESERVATION: Reservation = {
  id: "res-001",
  field_id: "field-001",
  player_id: "player-clerk-id",
  date: "2026-03-10",
  time_block: "18:00-19:00",
  status: "pending",
  share_slug: "abc123xyz",
  created_at: new Date().toISOString(),
};

const MOCK_PLAYERS: ReservationPlayer[] = [
  {
    id: "rp-1",
    reservation_id: "res-001",
    player_id: "player-clerk-id",
    position: null,
    joined_at: new Date().toISOString(),
    user: {
      id: "player-clerk-id",
      role: "player",
      name: "Matías López",
      email: "matias@mail.com",
      phone: null,
      created_at: new Date().toISOString(),
    },
  },
];

/* ── Context ── */
interface ReservationContextValue {
  reservation: Reservation | null;
  players: ReservationPlayer[];
  teamBoard: TeamBoard;
  isLoading: boolean;
  addPlayer: (player: ReservationPlayer) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  movePlayerOnBoard: (playerId: string, toSlotId: string) => void;
  setTeamColor: (color: string) => void;
}

const ReservationContext = createContext<ReservationContextValue | null>(null);

interface ReservationProviderProps {
  reservationId: string;
  children: ReactNode;
}

export function ReservationProvider({
  reservationId,
  children,
}: ReservationProviderProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [players, setPlayers] = useState<ReservationPlayer[]>([]);
  const [teamBoard, setTeamBoard] = useState<TeamBoard>(buildDefaultBoard());
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // TODO: replace with real Supabase query
    await new Promise((r) => setTimeout(r, 400));

    if (reservationId === MOCK_RESERVATION.id || true) {
      setReservation(MOCK_RESERVATION);
      setPlayers(MOCK_PLAYERS);
    }

    setIsLoading(false);
  }, [reservationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Methods ── */
  const addPlayer = useCallback(async (player: ReservationPlayer) => {
    // TODO: insert into reservation_players
    await new Promise((r) => setTimeout(r, 200));
    setPlayers((prev) => {
      if (prev.some((p) => p.player_id === player.player_id)) return prev;
      return [...prev, player];
    });
  }, []);

  const removePlayer = useCallback(async (playerId: string) => {
    // TODO: delete from reservation_players
    await new Promise((r) => setTimeout(r, 200));
    setPlayers((prev) => prev.filter((p) => p.player_id !== playerId));
    setTeamBoard((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.playerId === playerId ? { ...s, playerId: null } : s
      ),
    }));
  }, []);

  const movePlayerOnBoard = useCallback(
    (playerId: string, toSlotId: string) => {
      setTeamBoard((prev) => ({
        ...prev,
        slots: prev.slots.map((s) => {
          if (s.playerId === playerId) return { ...s, playerId: null };
          if (s.id === toSlotId) return { ...s, playerId };
          return s;
        }),
      }));
    },
    []
  );

  const setTeamColor = useCallback((color: string) => {
    setTeamBoard((prev) => ({ ...prev, color }));
  }, []);

  return (
    <ReservationContext.Provider
      value={{
        reservation,
        players,
        teamBoard,
        isLoading,
        addPlayer,
        removePlayer,
        movePlayerOnBoard,
        setTeamColor,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservationContext(): ReservationContextValue {
  const ctx = useContext(ReservationContext);
  if (!ctx)
    throw new Error(
      "useReservationContext must be used inside <ReservationProvider>"
    );
  return ctx;
}
