import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { Provider } from "@supabase/supabase-js";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    const provider = req.query.provider as Provider;
    const redirectTo = req.query.redirectTo as string;

    const supabase = createPagesServerClient({ req, res });

    let options: { redirectTo?: string; scopes?: string } = {
        ...redirectTo ? { redirectTo: redirectTo } : {},
    };

    if (provider == "azure") {
        options.scopes = "email";
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
    });

    if (error) throw error;

    return res.redirect(data.url);
}