/**
 * Untyped Supabase client for use in pages where the strict Database type
 * causes false-positive TypeScript errors (e.g. tables not yet in schema,
 * or complex join return types). Use sparingly.
 */
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseUntyped = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
