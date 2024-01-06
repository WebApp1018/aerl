import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// This is a very simple function that always returns a healthy status code.
// Used by our status page and monitoring to check the general health of
// supabase funcitons.
serve(async () => {
  return new Response(
    JSON.stringify({ status: "ok" }),
    { headers: { "Content-Type": "application/json" } },
  )
})
