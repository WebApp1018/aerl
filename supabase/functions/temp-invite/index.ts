// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.2/mod.ts"; // postgres
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"; // Supabase
import { corsHeaders } from "../_shared/cors.ts";

// Get the connection string from the environment variable "SUPABASE_DB_URL"
const databaseUrl = Deno.env.get("SUPABASE_DB_URL")!;

// Create a database pool with three connections that are lazily established
const pool = new postgres.Pool(databaseUrl, 3, true);

type Payload = {
  organisationId: Number;
  email: String;
  role: String;
};

interface LoggedInUSer {
  name: String,
  orgName: String,
  userId: String
}

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse Req variables
    const body = (await req.json()) as Payload;

    const pg = await pool.connect();

    const loggedinUser = await getUserId(req);

    const inOrg = await userInOrg(pg, loggedinUser?.userId, body.organisationId);


    // Ensure user is in org
    if (!(inOrg?.length > 0) || inOrg?.[0]?.role !== "owner") {
      pg.release();
      return genResponse(
        false,
        "You do not have permission to add members to this organisation.",
      );
    }

    const checkAlreadyInvited = await isAlreadyInvited(pg, body.email, body.organisationId);
    // Check user is already invited or not
    if (checkAlreadyInvited) {
      pg.release();
      return genResponse(
        false,
        "You have already invited this user. now you can change this user role from pending invite table.",
      );
    }

    // Now check if user with email exists
    const user = await userFromEmail(pg, body.email);

    if (!user) {
      pg.release();
      return genResponse(
        false,
        "There is no user with this email. Please ask them to create an account before inviting them to your organisation.",
      );
    }

    // Check if user being added is already in org
    const alreadyInOrg = await userInOrg(pg, user, body.organisationId);

    // user has already been added to org, return error
    if (alreadyInOrg.length > 0) {
      pg.release();
      return genResponse(
        false,
        "This user is already a member of this organisation.",
      );
    }

    const orgId = await addToOrgInvite(pg, body.organisationId, body.email, body.role as string);
    const origin = req.headers.get('origin');
    const ConfirmationURL = `${origin}/organization/accept-invitation?accept_invite=${orgId}`;
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get("SENDGRID_SECRET")}`,
      },
      body: JSON.stringify({
        "personalizations": [
          {
            "to": [{ "email": body.email }],
            "subject": `[AERL Cloud] You have been invited to ${loggedinUser.orgName}!`,
          }
        ],
        "from": { "email": "no-reply@aerl.com.au" },
        "content": [
          {
            "type": "text/html",
            "value": InviteEmailTemplate(ConfirmationURL, loggedinUser),
          }
        ]
      })
    })

    // Success
    pg.release();
    return genResponse(true, null);
  } catch (error) {
    console.error("Error: ", error);
    return genResponse(false, "Internal server error.");
  }
});

function genResponse(success: Boolean, error: String | null) {
  return new Response(
    JSON.stringify({
      success: success,
      error: error,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// Gets the userId associated with an email, or null if not found
async function userFromEmail(pg: any, email: String): Promise<null | String> {
  const result = await pg.queryObject`
    select
      id
    from
      auth.users
    where
      email = ${email}`;

  if (result.rows.length < 1) {
    return null;
  }

  return result.rows[0].id;
}

// Check whether a user is in an org an has permissions
async function userInOrg(
  pg: any,
  userId: String,
  orgId: Number,
): Promise<any> {
  const result = await pg.queryObject`
    select
      *
    from
      public.org_member
    where
      user_id = ${userId} AND org_id = ${orgId}
  `;
  return result.rows;
}

async function isAlreadyInvited(
  pg: any,
  invitedUserEmail: String,
  orgId: Number,
): Promise<Boolean> {
  const result = await pg.queryObject`
   select *
  from public.org_invite
  where email = ${invitedUserEmail} and org_id = ${orgId}
  `;
  return result.rows.length > 0;
}

// Get userId from JWT
async function getUserId(req: any): Promise<LoggedInUSer> {
  // Create a new Supabase client.
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    // Supabase API ANON KEY - env var exported by default.
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    // Create client with Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );

  // Get the user from the JWT in the Authorization header.
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user)
    throw new Error(
      "No user found for JWT: " + req.headers.get("Authorization")!,
    );

  return {
    name: user?.user_metadata?.name,
    orgName: user?.user_metadata?.org?.name,
    userId: user.id
  };
}

async function addToOrgInvite(pg: any, orgId: Number, email: String, role: string) {
  const result = await pg.queryObject`
    INSERT INTO PUBLIC.org_invite
      (org_id, email,role)
    VALUES
      (${orgId}, ${email},${role ?? "viewer"})
    RETURNING *;`;

  //convert BigInt to number
  return Number(result?.rows[0]?.id)
}


function InviteEmailTemplate(ConfirmationURL: string, loggedinUser: LoggedInUSer) {
  return (
    `<!DOCTYPE html>
  <html lang="en-US">
  <head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>AERL Cloud</title>
    <meta name="description" content="Invite User Email Template." />
    <style type="text/css">
        a:hover {
            text-decoration: underline !important;
        }
    </style>
  </head>

  <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #111" leftmargin="0">
    <table cellspacing="0" border="0" cellpadding="0" width="100%" style="
        @import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700);
        font-family: 'Open Sans', sans-serif;
        background-color: #111;
      ">
        <tr>
            <td>
                <table style="background-color: #111 !important; max-width: 670px; margin: 0 auto" width="100%"
                    border="0" align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="height: 80px">&nbsp;</td>
                    </tr>

                    <tr>
                        <td style="height: 20px">&nbsp;</td>
                    </tr>
                    <tr>
                        <td>
                            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="
                    max-width: 670px;
                    background: #181818;
                    border-radius: 15px;
                    border: 1px solid #212121;
                    text-align: center;
                    -webkit-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06);
                    -moz-box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06);
                    box-shadow: 0 6px 18px 0 rgba(0, 0, 0, 0.06);
                  ">
                                <tr>
                                    <td style="text-align: center">
                                        <a href="#" title="logo" target="_blank" style="display: block;">
                                            <img src="https://aerl.com.au/wp-content/uploads/2023/06/aerl-logo-v2.png"
                                                style="width: 155px">
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 40px">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 35px">
                                        <h1 style="
                          color: #ecedee;
                          font-weight: 500;
                          margin: 0;
                          font-size: 22px;
                          font-family: 'Rubik', sans-serif;
                        ">
                                            <b>Congratulations!</b>
                                            <p style="font-size: 16px; margin-top: 8px; color: rgba(236, 237, 238, 0.5); margin-bottom: 0;">You have been invited to join ${loggedinUser?.orgName} by ${loggedinUser?.name}.</p> 
                                        </h1>
                                        <span style="
                          display: inline-block;
                          vertical-align: middle;
                          margin: 29px 0 26px;
                          border-bottom: 1px solid #292929;
                          width: 100px;
                        "></span>
                                        <p style="color: #f6ad37; font-size: 18px; line-height: 24px; margin: 0";>
                                        Click the button below to accept the invitation.
                                        </p>
                                        <a href="${ConfirmationURL}" style="
                          background: #2e281b;
                          text-decoration: none !important;
                          font-weight: 500;
                          margin-top: 35px;
                          color: #f6ad37;
                          text-transform: capitalize;
                          font-size: 14px;
                          padding: 12px 24px;
                          display: inline-block;
                          border-radius: 12px;
                        ">
                        Accept Invite
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 40px">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="height: 20px">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align: center">
                            <p style="font-size: 14px; color: rgba(236, 237, 238, 0.2); line-height: 18px; margin: 0 0 0">
                                &copy; <strong>AERL Pty. Ltd. © 2023</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="height: 80px">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
  </body>
  </html>`)
}