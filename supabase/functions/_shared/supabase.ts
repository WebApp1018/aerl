import { createClient } from "https://esm.sh/@supabase/supabase-js@2.13.1";
import { Database } from "../_shared/types.gen.ts";

export const service_client = createClient<Database>(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
