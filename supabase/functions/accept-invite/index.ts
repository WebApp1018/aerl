// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"; // Supabase
import { corsHeaders } from "../_shared/cors.ts";
import { service_client } from "../_shared/supabase.ts";

type Payload = {
  orgInviteId: Number;
};

interface LoggedInUSer {
  name: String,
  orgName: String,
  userId: String,
  email: string
}

interface inviteUser {
  id: Number,
  created_at: Date,
  org_id: Number,
  email: string,
  role: string
}

serve(async (req: any) => {

   if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse Req variables
    const body = (await req.json()) as Payload;

    const loggedinUser = await getUserId(req);

    // check is correct user with invite id 
    const orgInviteUser = await userInOrgInvite(loggedinUser?.email, body.orgInviteId);

    if (!orgInviteUser?.length) {
      return genResponse(
        false,
        "You are not authorized OR you have already accepted invitation",
      );
    }

    // //remove user from the invite_member table 
    const removeUserFromOrgInvite = await RemoveUserFromOrgInvite(body.orgInviteId);

    if (removeUserFromOrgInvite?.length > 0) {
      const addedOrgMember = await addToOrgMember(removeUserFromOrgInvite[0], loggedinUser.userId);

      if (addedOrgMember?.length > 0) {
        return genResponse(
          true,
          "you have been  Accepted Invitation Successfully!",
        );
      }
      return genResponse(false, "Invitation Accepted failed");
    }

  }
  catch (error) {
    return genResponse(false, "Internal server error.");
  }
}
);

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
    userId: user.id,
    email: user.email
  };
}

// Check whether a user is in an org an has permissions
async function userInOrgInvite(
  email: String,
  org_inviteId: Number,
): Promise<any> {
  const { data } = await service_client
    .from('org_invite')
    .select('*')
    .eq('email', email)
    .eq('id', org_inviteId);
  return data;
}
async function RemoveUserFromOrgInvite(
  org_inviteId: Number,
): Promise<any> {
  const { data } = await service_client
    .from('org_invite')
    .delete('*')
    .eq('id', org_inviteId).select('*');
  return data;

}

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

async function addToOrgMember(removeUserInOrgInvite: inviteUser, userId: String) {
  const { data } = await service_client
    .from('org_member')
    .insert([{ 'org_id': Number(removeUserInOrgInvite.org_id), 'user_id': userId, 'role': removeUserInOrgInvite.role ?? "viewer" }]).select('*');
  return data;
}
