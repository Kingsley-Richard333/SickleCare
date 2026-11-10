import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { isNative, checkNotifyPermission, ensureNotifyPermission, scheduleMedicineReminders } from "../native.js";

const today = () => new Date().toLocaleDateString("en-CA");
const minutes = (t) => { const [h, m] = t.split(":"); return +h * 60 + +m; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const pretty = (t) => { const d = new Date(); const [h, m] = t.split(":"); d.setHours(+h, +m); return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
const presets = { "Once a day": ["08:00"], "Twice a day": ["08:00", "20:00"], "Three times a day": ["08:00", "14:00", "20:00"] };
const supported = typeof Notification !== "undefined";

function notify(title, body, tag) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then((r) => r.showNotification(title, { body, tag, icon: "/icon-192.png" })).catch(() => {});
  } else { try { new Notification(title, { body, tag }); } catch {} }
}

export default function Medicines() {
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [times, setTimes] = useState(["08:00"]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [perm, setPerm] = useState(isNative ? "default" : supported ? Notification.permission : "unsupported");
  const [showNames, setShowNames] = useState(() => { try { return localStorage.getItem("sicklecare-reminder-names") === "1"; } catch { return false; } });

  const load = useCallback(async () => {
    const week = new Date(); week.setDate(week.getDate() - 6);
    const [m, l] = await Promise.all([
      supabase.from("medicines").select("*").order("created_at"),
      supabase.from("dose_logs").select("*").gte("dose_date", week.toLocaleDateString("en-CA")),
    ]);
    setMeds(m.data || []); setLogs(l.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const doses = useMemo(() => {
    const todays = logs.filter((l) => l.dose_date === today());
    return meds.filter((m) => m.active).flatMap((m) =>
      m.times.map((t) => ({ med: m, time: t, log: todays.find((l) => l.medicine_id === m.id && l.dose_time === t) }))
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [meds, logs]);

  const adherence = useMemo(() => {
    let expected = 0, taken = 0;
    const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - 6);
    meds.filter((m) => m.active).forEach((m) => {
      const created = new Date(m.created_at); created.setHours(0, 0, 0, 0);
      const start = created > weekStart ? created : weekStart;
      const days = Math.round((new Date().setHours(0, 0, 0, 0) - start) / 86400000) + 1;
      expected += days * m.times.length;
      taken += Math.min(days * m.times.length, logs.filter((l) => l.medicine_id === m.id && l.dose_date >= start.toLocaleDateString("en-CA")).length);
    });
    return { expected, taken };
  }, [meds, logs]);

  useEffect(() => {
    if (perm !== "granted" || isNative) return;
    const check = () => doses.forEach((x) => {
      const late = nowMin() - minutes(x.time);
      const key = `n-${today()}-${x.med.id}-${x.time}`;
      if (x.log || late < 0 || late > 60 || sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      notify(`Time for ${x.med.name}`, x.med.dose || "Open Sicklecare to tick it off.", key);
    });
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [doses, perm]);

  useEffect(() => { if (isNative) checkNotifyPermission().then(setPerm); }, []);
  useEffect(() => { if (isNative && perm === "granted") scheduleMedicineReminders(meds, showNames); }, [meds, perm, showNames]);
  const toggleNames = (e) => { setShowNames(e.target.checked); try { localStorage.setItem("sicklecare-reminder-names", e.target.checked ? "1" : "0"); } catch {} };
  const enable = async () => setPerm(isNative ? await ensureNotifyPermission() : await Notification.requestPermission());

  const toggleDose = async (x) => {
    if (x.log) await supabase.from("dose_logs").delete().eq("id", x.log.id);
    else await supabase.from("dose_logs").insert({ medicine_id: x.med.id, dose_date: today(), dose_time: x.time });
    load();
  };

  const add = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const clean = [...new Set(times.filter(Boolean))].sort();
    const { error } = await supabase.from("medicines").insert({ name: name.trim(), dose: dose.trim() || null, times: clean });
    setBusy(false);
    if (error) return setErr("Could not save. Please try again.");
    setName(""); setDose(""); setTimes(["08:00"]); load();
  };

  const setActive = async (m) => { await supabase.from("medicines").update({ active: !m.active }).eq("id", m.id); load(); };
  const remove = async (m) => {
    if (!window.confirm(`Delete ${m.name} and its history?`)) return;
    await supabase.from("medicines").delete().eq("id", m.id); load();
  };

  const nowM = nowMin();
  return (
    <section className="wrap page">
      <Link to="/patient" className="back">Back to my dashboard</Link>
      <h1>My medicines</h1>
      <p className="lead">Add your medicines, then tick each dose as you take it.</p>

      <div className="panel remind">
        {perm === "granted" && <p><strong>Reminders are on.</strong> You will get a notification when a dose is due{isNative ? ", even when the app is closed" : ""}.</p>}
        {perm === "default" && <><p>Get a notification when a dose is due.</p><button className="btn small" onClick={enable}>Turn on reminders</button></>}
        {perm === "denied" && <p>Notifications are blocked. Allow them for this site in your browser settings to get reminders.</p>}
        {perm === "unsupported" && <p>This browser does not support notifications.</p>}
        {perm !== "unsupported" && !isNative && <p className="hint">Reminders show while Sicklecare is open on your phone. Reminders that work when the app is closed will come with the mobile app.</p>}
      </div>

      {isNative && perm === "granted" && (
        <label className="agree"><input type="checkbox" checked={showNames} onChange={toggleNames} />
          Show the medicine name in reminders. Leave this off to keep it private on your lock screen.</label>
      )}

      <h2 className="gap">Today</h2>
      {doses.length === 0 ? (
        <div className="empty"><p>No doses scheduled. Add a medicine below.</p></div>
      ) : (
        <>
          {adherence.expected > 0 && <p className="hint">Last 7 days: {adherence.taken} of {adherence.expected} doses taken.</p>}
          <ul className="entries">
            {doses.map((x) => {
              const due = !x.log && minutes(x.time) <= nowM;
              return (
                <li key={x.med.id + x.time} className={`entry dose ${x.log ? "done" : due ? "due" : ""}`}>
                  <label className="dose-check">
                    <input type="checkbox" checked={Boolean(x.log)} onChange={() => toggleDose(x)} />
                    <span><strong>{x.med.name}</strong>{x.med.dose && <> , {x.med.dose}</>}<br />
                      <span className="hint">{pretty(x.time)}{x.log ? " · taken" : due ? " · due now" : ""}</span></span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="dash">
        <form className="panel form" onSubmit={add}>
          <h2>Add a medicine</h2>
          <div className="field"><label htmlFor="mn">Medicine name</label>
            <input id="mn" required value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Folic acid" /></div>
          <div className="field"><label htmlFor="mdz">Dose (optional)</label>
            <input id="mdz" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="For example: 5 mg, 1 tablet" /></div>
          <fieldset className="q"><legend>When do you take it?</legend>
            <div className="chips">{Object.entries(presets).map(([k, v]) => <button type="button" key={k} className="chip" onClick={() => setTimes(v)}>{k}</button>)}</div>
            <div className="times">
              {times.map((t, i) => (
                <span key={i} className="time">
                  <input type="time" aria-label={`Time ${i + 1}`} value={t} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} />
                  {times.length > 1 && <button type="button" className="link" onClick={() => setTimes(times.filter((_, j) => j !== i))}>Remove</button>}
                </span>
              ))}
            </div>
            {times.length < 6 && <button type="button" className="link" onClick={() => setTimes([...times, "12:00"])}>Add another time</button>}
          </fieldset>
          {err && <p className="msg bad" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? "Saving..." : "Add medicine"}</button>
          <p className="hint">Take medicines as your doctor has told you. Sicklecare only reminds you.</p>
        </form>

        <div className="panel">
          <h2>All my medicines</h2>
          {meds.length === 0 ? <p className="hint">None yet.</p> : (
            <ul className="mlist">
              {meds.map((m) => (
                <li key={m.id}>
                  <div><strong>{m.name}</strong>{m.dose && <> , {m.dose}</>}{!m.active && <span className="tag"> Paused</span>}
                    <br /><span className="hint">{m.times.map(pretty).join(", ")}</span></div>
                  <div><button className="link" onClick={() => setActive(m)}>{m.active ? "Pause" : "Resume"}</button> <button className="link" onClick={() => remove(m)}>Delete</button></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
