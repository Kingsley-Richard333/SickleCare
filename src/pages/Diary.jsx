import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const places = ["Chest", "Back", "Belly", "Arms or legs", "Joints", "Head"];
const triggerList = ["Not enough water", "Cold", "Infection", "Stress", "Tiredness", "Hard exercise", "Other"];
const moods = ["Good", "Okay", "Low", "Anxious"];
const levelClass = (n) => (n >= 7 ? "hi" : n >= 4 ? "mid" : "lo");

function toggle(list, v) { return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]; }

export function Chart({ entries }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i)); return d;
  });
  const bars = days.map((d) => {
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const today = entries.filter((e) => { const t = new Date(e.logged_at); return t >= d && t < next; });
    return { d, max: today.length ? Math.max(...today.map((e) => e.pain_level)) : null };
  });
  return (
    <svg className="chart" viewBox="0 0 420 170" role="img" aria-label="Highest pain level for each of the last 14 days">
      {[0, 5, 10].map((n) => (
        <g key={n}>
          <line x1="28" x2="416" y1={140 - n * 12} y2={140 - n * 12} className="grid" />
          <text x="22" y={144 - n * 12} textAnchor="end" className="axis">{n}</text>
        </g>
      ))}
      {bars.map((b, i) => (
        <g key={i}>
          {b.max !== null && <rect x={34 + i * 27.5} y={140 - Math.max(b.max, 0.4) * 12} width="20" height={Math.max(b.max, 0.4) * 12} rx="3" className={`bar ${levelClass(b.max)}`} />}
          <text x={44 + i * 27.5} y="158" textAnchor="middle" className="axis">{b.d.getDate()}</text>
        </g>
      ))}
    </svg>
  );
}

export default function Diary() {
  const [entries, setEntries] = useState([]);
  const [pain, setPain] = useState(0);
  const [where, setWhere] = useState([]);
  const [trig, setTrig] = useState([]);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("pain_entries").select("*").order("logged_at", { ascending: false }).limit(60);
    setEntries(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("pain_entries").insert({
      pain_level: pain, locations: pain ? where : [], triggers: trig, mood: mood || null, notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return setMsg({ bad: true, text: "Could not save. Please try again." });
    setMsg(pain >= 7
      ? { bad: true, text: "Saved. Your pain is high. Contact your doctor or go to the hospital now." }
      : { text: "Saved to your diary." });
    setPain(0); setWhere([]); setTrig([]); setMood(""); setNotes("");
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from("pain_entries").delete().eq("id", id);
    load();
  };

  const fmt = (t) => new Date(t).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <section className="wrap page">
      <Link to="/patient" className="back">Back to my dashboard</Link>
      <h1>My pain diary</h1>
      <p className="lead">A quick note each day helps you and your doctor spot patterns and triggers.</p>

      <div className="dash">
        <form className="panel form" onSubmit={save}>
          <h2>How are you now?</h2>
          <div className="field">
            <label htmlFor="dp">Pain level: <strong>{pain}</strong> out of 10</label>
            <input id="dp" type="range" min="0" max="10" value={pain} onChange={(e) => setPain(+e.target.value)} />
          </div>
          {pain > 0 && (
            <fieldset className="q"><legend>Where does it hurt?</legend>
              <div className="chips">{places.map((p) => (
                <button type="button" key={p} className={where.includes(p) ? "chip on" : "chip"} aria-pressed={where.includes(p)} onClick={() => setWhere(toggle(where, p))}>{p}</button>
              ))}</div>
            </fieldset>
          )}
          <fieldset className="q"><legend>Possible triggers</legend>
            <div className="chips">{triggerList.map((t) => (
              <button type="button" key={t} className={trig.includes(t) ? "chip on" : "chip"} aria-pressed={trig.includes(t)} onClick={() => setTrig(toggle(trig, t))}>{t}</button>
            ))}</div>
          </fieldset>
          <div className="field"><label htmlFor="dm">Mood</label>
            <select id="dm" value={mood} onChange={(e) => setMood(e.target.value)}>
              <option value="">Choose</option>{moods.map((m) => <option key={m}>{m}</option>)}
            </select></div>
          <div className="field"><label htmlFor="dn">Notes (optional)</label>
            <textarea id="dn" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Medicine taken, what you were doing, how you slept" /></div>
          {msg && <p className={msg.bad ? "msg bad" : "msg"} role="status">{msg.text}</p>}
          <button className="btn" disabled={busy}>{busy ? "Saving..." : "Save entry"}</button>
        </form>

        <div>
          <div className="panel">
            <h2>Last 14 days</h2>
            <p className="hint">Highest pain level each day.</p>
            <Chart entries={entries} />
          </div>
        </div>
      </div>

      <h2 className="gap">Recent entries</h2>
      {entries.length === 0 ? (
        <div className="empty"><p>No entries yet. Your first one will show here.</p></div>
      ) : (
        <ul className="entries">
          {entries.slice(0, 20).map((e) => (
            <li key={e.id} className="entry">
              <span className={`level ${levelClass(e.pain_level)}`}>{e.pain_level}</span>
              <div>
                <strong>{fmt(e.logged_at)}</strong>
                <p>
                  {e.locations.length > 0 && <>Pain in: {e.locations.join(", ")}. </>}
                  {e.triggers.length > 0 && <>Triggers: {e.triggers.join(", ")}. </>}
                  {e.mood && <>Mood: {e.mood}.</>}
                </p>
                {e.notes && <p className="note">{e.notes}</p>}
              </div>
              <button className="link" onClick={() => remove(e.id)} aria-label={`Delete entry from ${fmt(e.logged_at)}`}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
