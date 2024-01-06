import { createClient } from "https://esm.sh/@supabase/supabase-js@2.13.1";
import { Database } from "../_shared/types.gen.ts";

export default async function handler(_req: Request): Promise<Response> {
  // create a service role client
  const _supabase = createClient<Database>(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  return new Response("ok", {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
