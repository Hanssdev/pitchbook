export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: "owner" | "player";
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: "owner" | "player";
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "owner" | "player";
          name?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
        };
      };
      fields: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          location: string;
          price_per_hour: number;
          photos: string[];
          schedule: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          location: string;
          price_per_hour: number;
          photos?: string[];
          schedule: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          location?: string;
          price_per_hour?: number;
          photos?: string[];
          schedule?: Json;
          created_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          field_id: string;
          player_id: string;
          date: string;
          time_block: string;
          status: "pending" | "confirmed" | "cancelled";
          share_slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          player_id: string;
          date: string;
          time_block: string;
          status?: "pending" | "confirmed" | "cancelled";
          share_slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          player_id?: string;
          date?: string;
          time_block?: string;
          status?: "pending" | "confirmed" | "cancelled";
          share_slug?: string;
          created_at?: string;
        };
      };
      blocked_slots: {
        Row: {
          id: string;
          field_id: string;
          date: string;
          time_block: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          date: string;
          time_block: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          date?: string;
          time_block?: string;
          created_at?: string;
        };
      };
      reservation_players: {
        Row: {
          id: string;
          reservation_id: string;
          player_id: string;
          position: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          player_id: string;
          position?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          player_id?: string;
          position?: string | null;
          joined_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "owner" | "player";
      reservation_status: "pending" | "confirmed" | "cancelled";
    };
  };
}
