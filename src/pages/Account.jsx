import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { cancelAllReminders } from "../native.js";

export default function Account() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [alerts, setAlerts] = useState(profile?.email_alerts !== false);
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState("");
  const role = profile?.role;

  const toggleAlerts = async (e) => {
    const v = e.target.checked;
    setAlerts(v);
    const { error } = await supabase.from("profiles").update({ email_alerts: v }).eq("id", user.id);
    if (error) { setAlerts(!v); setMsg({ bad: true, text: "Could not change that. Please try again." }); }
  };

  const download = async () => {
    setBusy("dl"); setMsg(null);
    const me = user.id;
    const mine = (t, col) => supabase.from(t).select("*").eq(col, me);
    const both = (t) => supabase.from(t).select("*").or(`patient_id.eq.${me},doctor_id.eq.${me}`);
    const [p, d, e, m, l, a, ms, g] = await Promise.all([
      supabase.from("profiles").select("full_name, email, role, license_no, created_at").eq("id", me).maybeSingle(),
      mine("patient_details", "id"), mine("pain_entries", "user_id"), mine("medicines", "user_id"), mine("dose_logs", "user_id"),
      both("appointments"), both("messages"), both("patient_access"),
    ]);
    const data = {
      exported_at: new Date().toISOString(), account: p.data, health_details: d.data, pain_diary: e.data,
      medicines: m.data, dose_log: l.data, appointments: a.data, messages: ms.data, sharing: g.data,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const file = new File([blob], "sicklecare-my-data.json", { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "My Sicklecare data" });
      else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = file.name; link.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* sharing was cancelled */ }
    setBusy("");
  };

  const remove = async () => {
    if (confirm.trim().toUpperCase() !== "DELETE") return;
    setBusy("del"); setMsg(null);
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) { setBusy(""); return setMsg({ bad: true, text: "Could not delete your account. Please try again, or contact us." }); }
    try { localStorage.removeItem("sicklecare-card"); } catch {}
    cancelAllReminders();
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    window.alert("Your account and records have been deleted.");
    nav("/", { replace: true });
  };

  return (
    <section className="wrap page auth">
      <h1>My account</h1>
      <div className="panel">
        <p><strong>{profile?.full_name}</strong><br />{user.email}<br /><span className="hint">{role === "doctor" ? "Doctor account" : role === "admin" ? "Administrator" : "Patient account"}</span></p>
      </div>

      <div className="panel gap">
        <h2>Email alerts</h2>
        <label className="agree"><input type="checkbox" checked={alerts} onChange={toggleAlerts} />
          Email me when I have a new message or an appointment update. Emails never include message text or health details.</label>
      </div>

      <div className="panel gap">
        <h2>Download my data</h2>
        <p className="hint">Get a copy of everything stored about you, as one file.</p>
        <button className="btn ghost" onClick={download} disabled={busy === "dl"}>{busy === "dl" ? "Preparing..." : "Download my data"}</button>
      </div>

      {msg && <p className={msg.bad ? "msg bad gap" : "msg gap"} role="alert">{msg.text}</p>}

      <div className="panel danger gap">
        <h2>Delete my account</h2>
        {role === "admin" ? <p>Administrator accounts cannot be deleted here.</p> : (
          <>
            <p>This permanently deletes your account and everything in it: your details, diary, medicines, appointments, messages, and sharing. It cannot be undone.</p>
            {role === "doctor"
              ? <p>Your appointments and messages with patients will be deleted for them too.</p>
              : <p>Messages and appointments with your doctors will be deleted for them too.</p>}
            <div className="field"><label htmlFor="del">Type DELETE to confirm</label>
              <input id="del" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <button className="btn danger-btn" onClick={remove} disabled={busy === "del" || confirm.trim().toUpperCase() !== "DELETE"}>
              {busy === "del" ? "Deleting..." : "Delete my account"}</button>
          </>
        )}
      </div>
    </section>
  );
}
