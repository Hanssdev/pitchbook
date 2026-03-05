"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { supabaseUntyped as supabase } from "@/lib/supabase/untyped";
import { useShareLink } from "@/hooks/useShareLink";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Reservation, ReservationPlayer, Field } from "@/types";

/* ── Types ── */
type TeamId = "A" | "B";

interface BoardSlot {
  id: string;
  team: TeamId;
  x: number;
  y: number;
  playerId: string | null;
}

interface TeamConfig {
  color: string;
  label: string;
}

const TEAM_COLORS: Record<string, string> = {
  "#00e676": "Verde",
  "#2979ff": "Azul",
  "#ff1744": "Rojo",
  "#ffea00": "Amarillo",
  "#ff6d00": "Naranja",
  "#e040fb": "Violeta",
  "#ffffff": "Blanco",
  "#000000": "Negro",
};

/* Slots equipo A (mitad inferior) */
const SLOTS_A: Omit<BoardSlot, "playerId">[] = [
  { id: "a-gk",   team: "A", x: 50, y: 88 },
  { id: "a-cb-l", team: "A", x: 22, y: 72 },
  { id: "a-cb-r", team: "A", x: 78, y: 72 },
  { id: "a-cm-l", team: "A", x: 22, y: 55 },
  { id: "a-cm-c", team: "A", x: 50, y: 57 },
  { id: "a-cm-r", team: "A", x: 78, y: 55 },
  { id: "a-st-l", team: "A", x: 30, y: 40 },
  { id: "a-st-c", team: "A", x: 50, y: 38 },
  { id: "a-st-r", team: "A", x: 70, y: 40 },
];

/* Slots equipo B (mitad superior) */
const SLOTS_B: Omit<BoardSlot, "playerId">[] = [
  { id: "b-gk",   team: "B", x: 50, y: 12 },
  { id: "b-cb-l", team: "B", x: 78, y: 28 },
  { id: "b-cb-r", team: "B", x: 22, y: 28 },
  { id: "b-cm-l", team: "B", x: 78, y: 45 },
  { id: "b-cm-c", team: "B", x: 50, y: 43 },
  { id: "b-cm-r", team: "B", x: 22, y: 45 },
  { id: "b-st-l", team: "B", x: 70, y: 60 },
  { id: "b-st-c", team: "B", x: 50, y: 62 },
  { id: "b-st-r", team: "B", x: 30, y: 60 },
];

const ALL_SLOTS = [...SLOTS_A, ...SLOTS_B].map((s) => ({ ...s, playerId: null }));

/* ── Draggable Player Chip ── */
function PlayerChip({
  player,
  team,
  teamColor,
  isCreator,
  onRemove,
}: {
  player: ReservationPlayer;
  team: TeamId;
  teamColor: string;
  isCreator: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.player_id,
    data: { team },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ borderColor: teamColor }}
      className={`group relative flex items-center gap-2 rounded-full border-2 bg-surface px-3 py-1.5 cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? "opacity-30" : "opacity-100"
      }`}
    >
      <span
        style={{ backgroundColor: teamColor + "30", color: teamColor }}
        className="h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
      >
        {(player.user?.name ?? "?")[0].toUpperCase()}
      </span>
      <span className="text-xs text-text font-medium truncate max-w-[80px]">
        {player.user?.name ?? "Jugador"}
      </span>
      {isCreator && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 ml-1 text-muted hover:text-red-400 transition-opacity"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Droppable Slot ── */
function FieldSlot({
  slot,
  player,
  teamColor,
}: {
  slot: BoardSlot;
  player: ReservationPlayer | undefined;
  teamColor: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

  return (
    <div
      ref={setNodeRef}
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: "translate(-50%, -50%)" }}
      className="absolute"
    >
      {player ? (
        <div
          style={{ borderColor: teamColor, backgroundColor: teamColor + "25" }}
          className={`flex flex-col items-center justify-center h-11 w-11 rounded-full border-2 shadow-lg transition-transform ${
            isOver ? "scale-110" : "scale-100"
          }`}
        >
          <span style={{ color: teamColor }} className="text-[11px] font-bold leading-none">
            {(player.user?.name ?? "?")[0].toUpperCase()}
          </span>
          <span className="text-[8px] text-white/60 truncate w-9 text-center leading-none mt-0.5">
            {(player.user?.name ?? "?").split(" ")[0]}
          </span>
        </div>
      ) : (
        <div
          style={{
            borderColor: isOver ? teamColor : "rgba(255,255,255,0.15)",
            backgroundColor: isOver ? teamColor + "15" : "transparent",
          }}
          className={`h-9 w-9 rounded-full border-2 border-dashed transition-all ${
            isOver ? "scale-110" : "scale-100"
          }`}
        />
      )}
    </div>
  );
}

/* ── Add Player Modal ── */
function AddPlayerModal({
  onAdd,
  onClose,
  reservationId,
}: {
  onAdd: (player: ReservationPlayer) => void;
  onClose: () => void;
  reservationId: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tempId = crypto.randomUUID();
    await supabase.from("users").upsert({
      id: tempId,
      role: "player" as const,
      name: name.trim(),
      email: `${tempId}@manual.pitchbook`,
      phone: phone.trim() || null,
    });

    const { data, error } = await supabase
      .from("reservation_players")
      .insert({ reservation_id: reservationId, player_id: tempId, position: null })
      .select("*, user:users(*)")
      .single();

    setLoading(false);

    if (error) {
      toastError("Error al agregar jugador");
    } else {
      onAdd(data as unknown as ReservationPlayer);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card variant="bordered" padding="md" className="w-full max-w-sm">
        <h3 className="font-display font-semibold text-text mb-4">Agregar jugador</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nombre" placeholder="Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Teléfono (opcional)" type="tel" placeholder="+54 9 11..." value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={loading}>Agregar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ── Main Page ── */
export default function LineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { userId } = useAuth();
  const { success, error: toastError } = useToast();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [players, setPlayers] = useState<ReservationPlayer[]>([]);
  const [slots, setSlots] = useState<BoardSlot[]>(ALL_SLOTS);
  const [teams, setTeams] = useState<Record<TeamId, TeamConfig>>({
    A: { color: "#00e676", label: "Local" },
    B: { color: "#2979ff", label: "Visitante" },
  });
  const [playerTeams, setPlayerTeams] = useState<Record<string, TeamId>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const isCreator = userId === reservation?.player_id;
  const { url, copied, copy } = useShareLink({ slug: reservation?.share_slug ?? "" });

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    const [{ data: resData }, { data: playersData }] = await Promise.all([
      supabase.from("reservations").select("*, field:fields(*)").eq("id", id).single(),
      supabase.from("reservation_players").select("*, user:users(*)").eq("reservation_id", id),
    ]);

    if (resData) {
      const r = resData as unknown as Reservation & { field: Field };
      setReservation(r);
      setField(r.field);
    }
    if (playersData) {
      const ps = playersData as unknown as ReservationPlayer[];
      setPlayers(ps);

      // Distribute players evenly: first half → A, second half → B
      const teamMap: Record<string, TeamId> = {};
      ps.forEach((p, i) => { teamMap[p.player_id] = i % 2 === 0 ? "A" : "B"; });
      setPlayerTeams(teamMap);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Realtime ── */
  useEffect(() => {
    const channel = supabase
      .channel(`lineup:${id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reservation_players",
        filter: `reservation_id=eq.${id}`,
      }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchData]);

  /* ── DnD ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const playerId = String(active.id);
    const toSlotId = String(over.id);
    const targetSlot = slots.find((s) => s.id === toSlotId);
    if (!targetSlot) return;

    // Update player team based on target slot
    setPlayerTeams((prev) => ({ ...prev, [playerId]: targetSlot.team }));

    setSlots((prev) =>
      prev.map((s) => {
        if (s.playerId === playerId) return { ...s, playerId: null };
        if (s.id === toSlotId) return { ...s, playerId };
        return s;
      })
    );
  };

  /* ── Remove player ── */
  const removePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from("reservation_players")
      .delete()
      .eq("reservation_id", id)
      .eq("player_id", playerId);

    if (!error) {
      setPlayers((prev) => prev.filter((p) => p.player_id !== playerId));
      setSlots((prev) => prev.map((s) => s.playerId === playerId ? { ...s, playerId: null } : s));
      setPlayerTeams((prev) => { const next = { ...prev }; delete next[playerId]; return next; });
    } else {
      toastError("Error al quitar jugador");
    }
  };

  const handlePlayerAdded = (player: ReservationPlayer) => {
    setPlayers((prev) => [...prev, player]);
    setPlayerTeams((prev) => ({ ...prev, [player.player_id]: "A" }));
    success("Jugador agregado");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4 animate-pulse">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "2/3" }} />
      </div>
    );
  }

  const playersA = players.filter((p) => playerTeams[p.player_id] === "A");
  const playersB = players.filter((p) => playerTeams[p.player_id] === "B");
  const unplacedPlayers = players.filter((p) => !slots.some((s) => s.playerId === p.player_id));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-text">Tablero de equipo</h1>
          {field && <p className="text-sm text-muted mt-0.5">{field.name}</p>}
          {reservation && (
            <p className="text-xs text-muted font-mono mt-0.5">
              {reservation.date} · {reservation.time_block}
            </p>
          )}
        </div>
        {reservation && (
          <Badge status={reservation.status === "confirmed" ? "approved" : reservation.status === "pending" ? "pending" : "rejected"} />
        )}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Cancha */}
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-border select-none"
          style={{ aspectRatio: "2/3", background: "linear-gradient(180deg, #1a3a1a 0%, #1e4020 50%, #1a3a1a 100%)" }}
        >
          {/* SVG cancha */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            {/* Borde */}
            <rect x="2" y="2" width="96" height="146" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.7" rx="1" />
            {/* Línea del medio */}
            <line x1="2" y1="75" x2="98" y2="75" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            {/* Círculo central */}
            <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <circle cx="50" cy="75" r="0.8" fill="rgba(255,255,255,0.3)" />
            {/* Área grande arriba */}
            <rect x="22" y="2" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            {/* Área chica arriba */}
            <rect x="36" y="2" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            {/* Arco arriba */}
            <rect x="42" y="2" width="16" height="2" fill="rgba(255,255,255,0.1)" />
            {/* Área grande abajo */}
            <rect x="22" y="130" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            {/* Área chica abajo */}
            <rect x="36" y="140" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
            {/* Arco abajo */}
            <rect x="42" y="146" width="16" height="2" fill="rgba(255,255,255,0.1)" />
            {/* Punto penal arriba */}
            <circle cx="50" cy="14" r="0.6" fill="rgba(255,255,255,0.25)" />
            {/* Punto penal abajo */}
            <circle cx="50" cy="136" r="0.6" fill="rgba(255,255,255,0.25)" />
          </svg>

          {/* Separador equipos (línea visual) */}
          <div className="absolute left-2 right-2 top-1/2 -translate-y-px h-px bg-white/10 pointer-events-none" />

          {/* Label equipos */}
          <div className="absolute top-2 left-2 right-2 flex justify-between px-1 pointer-events-none">
            <span style={{ color: teams.B.color }} className="text-[9px] font-mono font-bold uppercase opacity-60">
              {teams.B.label}
            </span>
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex justify-between px-1 pointer-events-none">
            <span style={{ color: teams.A.color }} className="text-[9px] font-mono font-bold uppercase opacity-60">
              {teams.A.label}
            </span>
          </div>

          {/* Slots */}
          {slots.map((slot) => {
            const player = players.find((p) => p.player_id === slot.playerId);
            const teamColor = teams[slot.team].color;
            return <FieldSlot key={slot.id} slot={slot} player={player} teamColor={teamColor} />;
          })}
        </div>

        {/* Jugadores sin posición */}
        {unplacedPlayers.length > 0 && (
          <Card variant="bordered" padding="sm">
            <p className="text-[10px] text-muted font-mono uppercase tracking-widest mb-2">
              Arrastrá a la cancha
            </p>
            <div className="flex flex-wrap gap-2">
              {unplacedPlayers.map((p) => (
                <PlayerChip
                  key={p.player_id}
                  player={p}
                  team={playerTeams[p.player_id] ?? "A"}
                  teamColor={teams[playerTeams[p.player_id] ?? "A"].color}
                  isCreator={isCreator}
                  onRemove={() => removePlayer(p.player_id)}
                />
              ))}
            </div>
          </Card>
        )}
      </DndContext>

      {/* Equipos + color pickers */}
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B"] as TeamId[]).map((teamId) => (
          <Card key={teamId} variant="bordered" padding="sm">
            <div className="flex items-center justify-between mb-2">
              <input
                type="text"
                value={teams[teamId].label}
                onChange={(e) => setTeams((prev) => ({ ...prev, [teamId]: { ...prev[teamId], label: e.target.value } }))}
                className="font-display font-semibold text-sm text-text bg-transparent border-none outline-none w-full"
                maxLength={12}
              />
              <span className="text-xs text-muted font-mono shrink-0 ml-1">
                {teamId === "A" ? playersA.length : playersB.length}
              </span>
            </div>
            {/* Color picker */}
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(TEAM_COLORS).map((color) => (
                <button
                  key={color}
                  onClick={() => setTeams((prev) => ({ ...prev, [teamId]: { ...prev[teamId], color } }))}
                  style={{ backgroundColor: color, border: color === "#ffffff" ? "1px solid #252830" : "none" }}
                  className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
                    teams[teamId].color === color
                      ? "ring-2 ring-white ring-offset-1 ring-offset-background scale-110"
                      : ""
                  }`}
                  title={TEAM_COLORS[color]}
                />
              ))}
            </div>
            {/* Lista jugadores del equipo */}
            {(teamId === "A" ? playersA : playersB).length > 0 && (
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                {(teamId === "A" ? playersA : playersB).map((p) => (
                  <div key={p.player_id} className="flex items-center justify-between">
                    <span className="text-xs text-text truncate">{p.user?.name ?? "Jugador"}</span>
                    {isCreator && (
                      <button
                        onClick={() => removePlayer(p.player_id)}
                        className="text-muted hover:text-red-400 transition-colors ml-2 shrink-0"
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        {isCreator && (
          <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar jugador
          </Button>
        )}
        <Button variant="primary" className="flex-1" onClick={copy}>
          {copied ? "¡Link copiado!" : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16,6 12,2 8,6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Compartir
            </>
          )}
        </Button>
      </div>

      {/* Link compartible */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
        <span className="flex-1 text-xs font-mono text-muted truncate">{url}</span>
      </div>

      {showAddModal && (
        <AddPlayerModal
          reservationId={id}
          onAdd={handlePlayerAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
