// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts" // std
import totp from "https://esm.sh/totp-generator@0.0.14" // generates a TOTP
import * as postgres from 'https://deno.land/x/postgres@v0.14.2/mod.ts' // postgres
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"; // Supabase
import twilio from "https://esm.sh/twilio@4.13.0"
import { corsHeaders } from '../_shared/cors.ts'

// Get the connection string from the environment variable "SUPABASE_DB_URL"
const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!

// Create a database pool with three connections that are lazily established
const pool = new postgres.Pool(databaseUrl, 3, true)

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Get the id of the OTP factor from the request body
  const { factorId } = await req.json()
  if (factorId === undefined) {
    console.error("Failed to parse the factorId from the request body");
    return new Response(
      JSON.stringify({ error: "Failed to parse the factorId from the request body" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
  }

  // Get userId from JWT
  const userId = await getUserId(req)
    .catch((error) => {
      console.error("Error while parsing JWT", error);
    });

  if (userId === undefined) {
    return new Response(
      JSON.stringify({ error: "Invalid JWT" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
  }

  // Query factors
  const factor = await queryFactors(userId, factorId)
    .catch((error) => {
      console.error("Error while querying factors", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    });

  if (factor.length === 0 || factor === undefined) {
    console.error(`Error: Factor ${factorId} not found for user ${userId}`);
    return new Response(
      JSON.stringify({ error: "No factor found for the user" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }

  // Sent OTP via SMS
  const smsStatus = await sendOTPSMS(factor.phone_number, factor.secret)
    .catch((error) => {
      console.error("Error while sending SMS", error);
      return { error: "Failed to send SMS" }
    });

  // Return the response with the correct content type header
  return new Response(JSON.stringify(smsStatus), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
)

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

// Query factors
async function queryFactors(userId: string, factorId: string) {
  // Grab a connection from the pool
  const connection = await pool.connect()

  const factorResult = await connection.queryObject`
  SELECT
    auth.mfa_factors.id, auth.mfa_factors.status, auth.mfa_factors.secret, public.phone_mfa.phone_number
  FROM auth.mfa_factors
    FULL OUTER JOIN public.phone_mfa
  ON 
    auth.mfa_factors.id = public.phone_mfa.factor AND auth.mfa_factors.user_id = public.phone_mfa.user
  WHERE
    auth.mfa_factors.user_id = ${userId}::uuid AND auth.mfa_factors.id = ${factorId}::uuid;`

  connection.release()

  const factors = factorResult.rows[0]

  return factors;

}

// Sent an OTP via SMS
async function sendOTPSMS(phoneNumber: string, secret: string): Promise<{ error: string | null }> {
  // Generate the OTP
  const token = totp(secret);

  // Send the OTP via SMS
  const client = new twilio(
    Deno.env.get('TWILIO_ACCOUNT_SID') ?? '',
    Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
  );

  const message = await client.messages.create({
    body: `AERL verification code: ${token}`,
    messagingServiceSid: 'MGc4d7491a4038786a30f98e4a4420e47f',
    to: phoneNumber
  });

  console.log(message);
  console.log("Sent SMS OTP to " + phoneNumber);

  return { error: null };
}

// To Invoke:
//  curl -L -X POST 'https://mzynufuthvghqanlkluf.supabase.co/functions/v1/phone-mfa' \
//    -H 'Authorization: Bearer <JWT>' \
//    --data '{"factorId": "<Factor ID>"}'