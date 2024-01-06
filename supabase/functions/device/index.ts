import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import authHandler from "./auth.ts";
import configHandler from "./config.ts";
import heartbeatHandler from "./heartbeat.ts";
import notifyHandler from "./notify.ts";

serve(async (req: Request) => {
  try {
    const pathname = new URL(req.url).pathname;

    switch (pathname) {
      case "/device/auth": return await authHandler(req)
      case "/device/config": return await configHandler(req)
      case "/device/heartbeat": return await heartbeatHandler(req)
      case "/device/notify": return await notifyHandler(req)
    }

    return new Response(JSON.stringify({ error: `no route for path ${new URL(req.url).pathname} found` }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
    });
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
