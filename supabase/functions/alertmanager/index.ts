import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { service_client as supabase } from "../_shared/supabase.ts"
import { Database } from "../_shared/types.gen.ts"

type Alert = {
  labels: {
    alertname: string;
    [key: string]: string;
  };
  annotations?: {
    [key: string]: string;
  };
  startsAt?: string; // should be in RFC3339 format
  endsAt?: string; // should be in RFC3339 format
  generatorURL?: string;
};

type RequestBody = Alert[];

serve(async (req: Request) => {
  try {
    // verify basic auth credentials
    if (!verifyAuthentication(req.headers)) {
      return new Response(
        JSON.stringify({ message: "Authentication failed." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    let orgKey = extractOrgKey(req.headers)

    if (!orgKey) {
      return new Response(
        JSON.stringify({ message: "Authorization failed." }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    let { data: org, error } = await supabase
      .from('org')
      .select('id, key')
      .eq('key', orgKey)
      .maybeSingle()

    if (error) {
      return new Response(
        JSON.stringify({ message: "Error querying organizations." }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const alerts = await req.json() as RequestBody

    let rows = alerts.map((alert) => ({
      org_id: org.id,
      metadata: alert
    }))

    let { error: insert_error } = await supabase
      .from('alert')
      .insert(rows)

    if (insert_error) {
      if (insert_error.message != 'duplicate key value violates unique constraint "unique_alert"') {
        console.error(insert_error)
        return new Response(
          JSON.stringify({ message: "Error adding alerts." }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }
    }

    console.info(`Added ${rows.length} alerts for organization: ${org.id}`)

    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: { message: "Internal server error" } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

function verifyAuthentication(headers: Headers): boolean {
  const authorizationHeader = headers.get('authorization')

  if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) {
    console.error("Authentication: Malformed or missing header.")
    return false
  }

  const encodedCredentials = authorizationHeader.slice('Basic '.length)
  const decodedCredentials = atob(encodedCredentials).trimEnd()
  const [username, password] = decodedCredentials.split(':')

  if (username == Deno.env.get("ALERTMANAGER_USERNAME")!) {
    if (password == Deno.env.get("ALERTMANAGER_PASSWORD")!) {
      return true
    } else {
      console.error("Authentication: Incorrect password.")
      return false
    }
  } else {
    console.error("Authentication: Incorrect username.")
    return false
  }
}

function extractOrgKey(headers: Headers): string | null {
  const orgIdHeader = headers.get('x-scope-orgid')

  if (!orgIdHeader || !orgIdHeader.startsWith('org-')) {
    console.error('Authorization: X-Scope-OrgID header is malformed or missing.')
    return null
  }

  const [_, key] = orgIdHeader.trim().split('-')

  if (!key) {
    console.error('Authorization: Failed parsing OrgID.')
    return null
  }

  return key
}
