import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hdtgpcywnkxjajithjap.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdGdwY3l3bmt4amFqaXRoamFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTgyODgsImV4cCI6MjA3Nzk3NDI4OH0.TAB8r-i6edxMxgu_-bYpntuv2Ajg8zA7lgljFNf4kjc";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
