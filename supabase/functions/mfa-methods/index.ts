// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as postgres from 'https://deno.land/x/postgres@v0.14.2/mod.ts' // postgres
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"; // Supabase
import { corsHeaders } from '../_shared/cors.ts'


// Get the connection string from the environment variable "SUPABASE_DB_URL"
const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!

// Create a database pool with three connections that are lazily established
const pool = new postgres.Pool(databaseUrl, 3, true)

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userId = await getUserId(req)

    const factors = await queryFactors(userId)

    return new Response(
      JSON.stringify({ data: factors, error: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, },
    );
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ data: null, error: "Internal server error" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, },
    )
  }
})

// Get userId from JWT
async function getUserId(req): Promise<string> {
  // Create a new Supabase client.
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase API ANON KEY - env var exported by default.
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    // Create client with Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  // Get the user from the JWT in the Authorization header.
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) throw new Error("No user found for JWT: " + req.headers.get('Authorization')!);

  return user.id;
}

async function queryFactors(userId: string) {
  // Grab a connection from the pool
  const connection = await pool.connect()

  const factorResult = await connection.queryObject`
  SELECT
    auth.mfa_factors.id, auth.mfa_factors.status, public.phone_mfa.phone_number
  FROM auth.mfa_factors
    FULL OUTER JOIN public.phone_mfa
  ON 
    auth.mfa_factors.id = public.phone_mfa.factor AND auth.mfa_factors.user_id = public.phone_mfa.user
  WHERE
    auth.mfa_factors.user_id = ${userId}::uuid;`

  connection.release()

  return factorResult.rows
}
