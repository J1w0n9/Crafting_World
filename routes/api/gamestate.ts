import { Handlers } from "$fresh/server.ts";
import { supabase } from "../../utils/supabase.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const userId = url.searchParams.get("user_id");

      if (!userId) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("game_state")
        .select("discovered_elements, discovered_recipes") // Fetch both fields
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") { // No rows found
          return new Response(JSON.stringify(null), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  async POST(req) {
    try {
      const { user_id, discovered_elements, discovered_recipes } = await req.json();

      if (!user_id) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const saveData = {
        user_id: user_id,
        discovered_elements: discovered_elements ?? [],
        discovered_recipes: discovered_recipes ?? [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("game_state").upsert(saveData);

      if (error) {
        console.error("POST /api/gamestate: Supabase upsert error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("POST /api/gamestate: Unexpected error:", e.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
