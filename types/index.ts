export type UserRole = "owner" | "player";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Field {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  price_per_hour: number;
  photos: string[];
  schedule: FieldSchedule;
  created_at: string;
}

export interface FieldSchedule {
  days: DaySchedule[];
}

export interface DaySchedule {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  open: string;  // "08:00"
  close: string; // "22:00"
  slot_duration_minutes: number;
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export interface Reservation {
  id: string;
  field_id: string;
  player_id: string;
  date: string;        // ISO date "2026-03-15"
  time_block: string;  // "18:00-19:00"
  status: ReservationStatus;
  share_slug: string;
  created_at: string;
  field?: Field;
}

export interface ReservationPlayer {
  id: string;
  reservation_id: string;
  player_id: string;
  position: string | null;
  joined_at: string;
  user?: User;
}
