// Lets a signed-in person delete their own account. Deployed as an Edge Function named "delete-account".
// Leave "Verify JWT" ON for this one. All of the person's records are removed with the account.
import { createClient } from "npm:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return reply({ error: "Not signed in" }, 401);

  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") return reply({ error: "Admin accounts cannot be deleted here" }, 403);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) { console.error(error); return reply({ error: "Could not delete" }, 500); }
  return reply({ ok: true });
});
