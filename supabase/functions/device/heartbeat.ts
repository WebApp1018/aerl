import { createClient } from "https://esm.sh/@supabase/supabase-js@2.13.1";
import { corsHeaders } from "../_shared/cors.ts";
import { Database } from "../_shared/types.gen.ts";

interface Body {
  machine_id: string;
}

export default async function handler(
  req: Request,
): Promise<Response> {
  // create a service role client
  const supabase = createClient<Database>(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: {
      persistSession: false
    }
  });

  const body = await req.json() as Body;

  console.log("Heartbeat from: ", body.machine_id);

  const { data, error } = await supabase
    .from("hub")
    .select("id")
    .eq("machine_id", body.machine_id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("machine_id not found");

  // update last_seen timestamp
  const now = new Date().toISOString();

  const { error: update_error } = await supabase
    .from("device")
    .update({ last_seen: now })
    .eq("hub_id", data.id);

  if (update_error) throw update_error;

  return new Response("ok", {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
