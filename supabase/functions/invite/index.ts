import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.13.1";
import { Database } from "../_shared/types.gen.ts";
import * as postgres from 'https://deno.land/x/postgres@v0.14.2/mod.ts'

type OrgInvite = Database["public"]["Tables"]["org_invite"]["Row"]

type Payload = {
  type: 'INSERT'
  table: string
  schema: string
  record: OrgInvite
  old_record: null
}

const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!

const pool = new postgres.Pool(databaseUrl, 3, true)

serve(async (req: Request) => {
  try {
    const body = await req.json() as Payload

    if (body.schema != "public") {
      console.error("Got incorrect schema:", body.schema)
      return new Response("schema did not match expected", {
        headers: { "Content-Type": "application/json" },
        status: 500,
      })
    }

    if (body.table != "org_invite") {
      console.error("Got incorrect table:", body.table)
      return new Response("table did not match expected", {
        headers: { "Content-Type": "application/json" },
        status: 500,
      })
    }

    const email = body.record.email
    const org_id = body.record.org_id

    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL')!,
      req.headers.get('Authorization')!.replace('Bearer ', ''), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const invite = await supabase.auth.admin.inviteUserByEmail(email)

    if (invite.error) {
      if (invite.error == 'AuthApiError: A user with this email address has already been registered') {
        console.log('User already exists')
      } else {
        return new Response(JSON.stringify({ error: invite.error }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        })
      }
    }

    const pg = await pool.connect()

    try {
      // get user id from email
      const result = await pg.queryObject`
        SELECT id from auth.users
        WHERE email = ${email}
      `

      const exists = result.rows.length > 0

      if (!exists) {
        console.error("User didn't exist after invite")
        return new Response(JSON.stringify({ error: "User does not exists after invite" }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        })
      }

      const user_id = result.rows[0].id

      // add user to the org
      await pg.queryObject`
        INSERT INTO org_member(org_id, user_id, role)
        VALUES (${org_id}, ${user_id}, 'viewer')
      `

      // delete invitation
      await pg.queryObject`
        DELETE FROM org_invite
        WHERE email = ${email}
      `
    } catch (error) {
      console.error("Failed to add user to organization", error)
      pg.release() // release connection back to the pool
      return new Response(JSON.stringify({ error: "Failed to add user to organization" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ message: "success" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error(error)

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
});
