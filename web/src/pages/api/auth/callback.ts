import { NextApiHandler } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

/** Code-to-token exchange handler */
const handler: NextApiHandler = async (req, res) => {
  const { code } = req.query
  const next = (req.query.next as string) ?? "/";

  if (code) {
    const supabase = createPagesServerClient({ req, res });
    try {
      await supabase.auth.exchangeCodeForSession(String(code));
    } catch (error: any) { }
  }

  return res.redirect(next);
}

export default handler;
