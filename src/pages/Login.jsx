import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth, homeFor } from "../auth/AuthContext.jsx";
import { isConfigured } from "../lib/supabase.js";
import { useT } from "../i18n/index.jsx";

export default function Login({ role }) {
  const { t } = useT();
  const { user, profile, signIn, signUp } = useAuth();
  const [mode, setMode] = useState("in");
  const [f, setF] = useState({ name: "", email: "", password: "", license: "", agree: false });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const isDoctor = role === "doctor";
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  if (user && profile) return <Navigate to={homeFor(profile.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (mode === "up" && f.password.length < 8) return setMsg({ bad: true, text: t("login.short") });
    setBusy(true);
    const res = mode === "in" ? await signIn(f.email, f.password) : await signUp(f.email, f.password, f.name, role, f.license.trim());
    setBusy(false);
    if (res.error) return setMsg({ bad: true, text: res.error.message });
    if (mode === "up" && !res.data.session) setMsg({ text: t("login.created") });
  };

  return (
    <section className="wrap page auth">
      <h1>{isDoctor ? t("login.doctorTitle") : t("login.patientTitle")}</h1>
      <p className="lead">{isDoctor ? t("login.doctorLead") : t("login.patientLead")}</p>

      {!isConfigured && <p className="notice">Accounts are not switched on yet. Add your Supabase keys to enable login (see the README).</p>}

      <div className="chips" role="group" aria-label={t("login.group")}>
        <button className={mode === "in" ? "chip on" : "chip"} aria-pressed={mode === "in"} onClick={() => setMode("in")}>{t("login.in")}</button>
        <button className={mode === "up" ? "chip on" : "chip"} aria-pressed={mode === "up"} onClick={() => setMode("up")}>{t("login.up")}</button>
      </div>

      <form onSubmit={submit} className="form">
        {mode === "up" && (
          <div className="field"><label htmlFor="name">{t("login.name")}</label>
            <input id="name" required autoComplete="name" value={f.name} onChange={set("name")} /></div>
        )}
        {mode === "up" && isDoctor && (
          <div className="field"><label htmlFor="lic">{t("login.license")}</label>
            <input id="lic" required autoComplete="off" value={f.license} onChange={set("license")} /></div>
        )}
        <div className="field"><label htmlFor="email">{t("login.email")}</label>
          <input id="email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} /></div>
        <div className="field"><label htmlFor="pw">{t("login.password")}</label>
          <input id="pw" type="password" required autoComplete={mode === "in" ? "current-password" : "new-password"} value={f.password} onChange={set("password")} /></div>
        {mode === "up" && (
          <label className="agree"><input type="checkbox" required checked={f.agree} onChange={set("agree")} />
            <span>{t("login.agree1")} <Link to="/privacy" target="_blank">{t("footer.privacy")}</Link> {t("login.and")} <Link to="/terms" target="_blank">{t("footer.terms")}</Link>. {t("login.agree2")}</span></label>
        )}
        {mode === "up" && isDoctor && <p className="hint">{t("login.doctorHint")}</p>}
        {msg && <p className={msg.bad ? "msg bad" : "msg"} role="alert">{msg.text}</p>}
        <button className="btn big" disabled={busy || !isConfigured}>{busy ? t("login.wait") : mode === "in" ? t("login.in") : t("login.up")}</button>
      </form>
    </section>
  );
}
