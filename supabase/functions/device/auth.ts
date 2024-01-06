import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { Database } from "../_shared/types.gen.ts";
import { createHash } from "https://deno.land/std@0.119.0/hash/mod.ts";
import { create as createJwt, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

export default async function handler(req: Request): Promise<Response> {
  const { machine_id, machine_secret } = await req.json();

  console.info("Got auth request from: ", machine_id);

  const supabase = createClient<Database>(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: {
      persistSession: false
    }
  });

  const { data, error } = await supabase
    .from("hub")
    .select("id,machine_id,machine_secret_hash")
    .eq("machine_id", machine_id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    console.info("Could not find device witch matching machine_id.");

    return new Response(JSON.stringify({ error: "not found" }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
    });
  }

  // hash the secret provided by the device
  const secret_hash = createHash("sha256")
    .update(machine_secret)
    .toString("hex");

  // compare hashes
  if (data.machine_secret_hash != secret_hash) {
    console.info("Machine secret did not match.");

    return new Response(JSON.stringify({ error: "not found" }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
    });
  }

  const jwt_key = await importKey();

  const exp = getNumericDate(60 * 60)

  const token = await createJwt({ alg: "HS256", typ: "JWT" }, {
    role: "device",
    sub: data.machine_id,
    hub: data.id,
    exp,
  }, jwt_key);

  return new Response(
    JSON.stringify({
      token,
      token_type: "Bearer",
      expires_in: exp - getNumericDate(new Date()),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

/**
 * Import the JWT secret from the environment variable `JWT_SECRET`.
 *
 * @returns CryptoKey
 */
export async function importKey() {
  const secret = Deno.env.get("SUPABASE_JWT_SECRET");

  if (!secret) {
    console.log(secret);
    throw Error("Unable to source JWT secret for signing new token.");
  }

  const secret_data = new TextEncoder().encode(secret);

  const key = await crypto.subtle.importKey(
    "raw",
    secret_data,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"],
  );

  return key;
}
