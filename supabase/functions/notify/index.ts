// Sends short, private email alerts. Deployed as a Supabase Edge Function named "notify".
// Emails never include message text, reasons, or health details. They only say something is waiting.
import { createClient } from "npm:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
const SITE = env("SITE_URL").replace(/\/$/, "");
const clean = (s?: string | null) => (s ?? "").replace(/[\r\n]+/g, " ").slice(0, 80);

type To = { id: string; path: string };
type Mail = { to: To[]; subject: string; lines: string[] };

async function nameOf(id: string) {
  const { data } = await admin.from("profiles").select("full_name").eq("id", id).maybeSingle();
  return clean(data?.full_name) || "Someone";
}

async function build(body: any): Promise<Mail | null> {
  const { table, type, record: r, old_record: o } = body;

  if (table === "messages" && type === "INSERT") {
    const toDoctor = r.sender_id === r.patient_id;
    // Do not send another email if an earlier message from this person is still unread.
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count } = await admin.from("messages").select("id", { count: "exact", head: true })
      .eq("patient_id", r.patient_id).eq("doctor_id", r.doctor_id).eq("sender_id", r.sender_id)
      .is("read_at", null).gte("created_at", since).neq("id", r.id);
    if ((count ?? 0) > 0) return null;
    return {
      to: [{ id: toDoctor ? r.doctor_id : r.patient_id, path: toDoctor ? "/doctor/messages" : "/patient/messages" }],
      subject: "You have a new message on Sicklecare",
      lines: [`${await nameOf(r.sender_id)} sent you a message.`, "For your privacy, the message is not in this email."],
    };
  }

  if (table === "appointments" && type === "INSERT") {
    return {
      to: [{ id: r.doctor_id, path: "/doctor" }],
      subject: "New appointment request on Sicklecare",
      lines: [`${clean(r.patient_name) || "A patient"} asked for an appointment.`, "Log in to see the time and reason, and to confirm or decline."],
    };
  }

  if (table === "appointments" && type === "UPDATE" && o?.status !== r.status) {
    if (r.status === "confirmed" || r.status === "declined") {
      return {
        to: [{ id: r.patient_id, path: "/patient/appointments" }],
        subject: `Your appointment request was ${r.status}`,
        lines: [`${clean(r.doctor_name) || "Your doctor"} ${r.status} your appointment request.`, "Log in to see the details."],
      };
    }
    if (r.status === "cancelled") {
      return {
        to: [{ id: r.patient_id, path: "/patient/appointments" }, { id: r.doctor_id, path: "/doctor" }],
        subject: "An appointment was cancelled",
        lines: ["An appointment on Sicklecare was cancelled.", "Log in to see the details."],
      };
    }
  }

  if (table === "profiles" && type === "UPDATE" && !o?.verified && r.verified) {
    return {
      to: [{ id: r.id, path: "/doctor" }],
      subject: "Your Sicklecare doctor account is approved",
      lines: ["Your doctor account has been approved.", "You can now receive appointment requests and messages."],
    };
  }
  return null;
}

async function send(mail: Mail) {
  const { data: people } = await admin.from("profiles").select("id, email, full_name, email_alerts").in("id", mail.to.map((t) => t.id));
  for (const t of mail.to) {
    const p = people?.find((x) => x.id === t.id);
    if (!p?.email || p.email_alerts === false) continue;
    const first = clean(p.full_name).split(" ")[0] || "there";
    const text = `Hello ${first},\n\n${mail.lines.join("\n")}\n\nLog in: ${SITE}${t.path}\n\n` +
      "Sicklecare is not an emergency service. If you are very unwell, go to the nearest hospital.\n";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env("MAIL_FROM"), to: [p.email], subject: mail.subject, text }),
    });
    if (!res.ok) console.error("Email failed", res.status, await res.text());
  }
}

Deno.serve(async (req) => {
  const secret = env("WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) return new Response("Unauthorized", { status: 401 });
  try {
    const mail = await build(await req.json());
    if (mail) await send(mail);
    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});
