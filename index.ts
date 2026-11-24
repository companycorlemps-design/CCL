import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return json({ error: "Non authentifié" }, 401);
    const { data: me } = await admin.from("ccl_profiles").select("company_id,role,is_active").eq("id", user.id).single();
    if (!me?.is_active || !["owner", "admin", "super_admin", "supervisor"].includes(me.role)) return json({ error: "Accès refusé" }, 403);

    const b = await req.json();
    const username = String(b.username || "").trim().toLowerCase();
    if (!username || !b.password || String(b.password).length < 6) return json({ error: "Nom d'utilisateur et mot de passe (6+) requis" }, 400);
    const role = ["seller", "cashier", "supervisor"].includes(b.role) ? b.role : "seller";
    if (role === "supervisor" && !["owner", "admin", "super_admin"].includes(me.role)) return json({ error: "Seul un administrateur peut créer un superviseur" }, 403);
    const email = username.includes("@") ? username : `${username}@login.ccl.local`;

    const { data: created, error: e1 } = await admin.auth.admin.createUser({ email, password: b.password, email_confirm: true });
    if (e1) return json({ error: e1.message }, 400);
    const { error: e2 } = await admin.from("ccl_profiles").insert({
      id: created.user.id, company_id: me.company_id, role, username,
      full_name: b.full_name, first_name: b.first_name, last_name: b.last_name,
      serie: b.serie, sex: b.sex, phone: b.phone, commission_rate: b.commission_rate ?? 0,
      country: b.country, city: b.city, branch: b.point_label, address: b.address,
    });
    if (e2) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: e2.message }, 400); }
    return json({ ok: true, id: created.user.id });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
