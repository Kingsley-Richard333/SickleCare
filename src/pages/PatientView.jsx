import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { Chart } from "./Diary.jsx";

const levelClass = (n) => (n >= 7 ? "hi" : n >= 4 ? "mid" : "lo");
const fmt = (t) => new Date(t).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const day = (d) => d.toLocaleDateString("en-CA");

export default function PatientView() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    (async () => {
      const week = new Date(); week.setDate(week.getDate() - 6);
      const access = await supabase.from("patient_access").select("*").eq("patient_id", id).maybeSingle();
      if (!access.data) return setState({ loading: false, denied: true });
      const [det, ent, med, logs] = await Promise.all([
        supabase.from("patient_details").select("*").eq("id", id).maybeSingle(),
        supabase.from("pain_entries").select("*").eq("user_id", id).order("logged_at", { ascending: false }).limit(60),
        supabase.from("medicines").select("*").eq("user_id", id).eq("active", true).order("created_at"),
        supabase.from("dose_logs").select("*").eq("user_id", id).gte("dose_date", day(week)),
      ]);
      supabase.from("record_views").insert({ patient_id: id }).then(() => {});
      setState({ loading: false, name: access.data.patient_name, d: det.data, entries: ent.data || [], meds: med.data || [], logs: logs.data || [] });
    })();
  }, [id]);

  if (state.loading) return <section className="wrap page"><p className="lead">Loading...</p></section>;
  if (state.denied) return (
    <section className="wrap page">
      <h1>No access</h1>
      <p className="lead">This patient is not sharing records with you.</p>
      <Link to="/doctor/patients" className="btn">My patients</Link>
    </section>
  );

  const { name, d, entries, meds, logs } = state;
  const adherence = (m) => {
    const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - 6);
    const created = new Date(m.created_at); created.setHours(0, 0, 0, 0);
    const start = created > weekStart ? created : weekStart;
    const days = Math.round((new Date().setHours(0, 0, 0, 0) - start) / 86400000) + 1;
    const expected = days * m.times.length;
    const taken = Math.min(expected, logs.filter((l) => l.medicine_id === m.id && l.dose_date >= day(start)).length);
    return `${taken} of ${expected} doses in the last 7 days`;
  };
  const rows = d ? [["Genotype", d.genotype], ["Blood group", d.blood_group], ["Allergies", d.allergies], ["Medicines (patient's list)", d.medicines],
    ["Emergency contact", [d.emergency_contact_name, d.emergency_contact_phone].filter(Boolean).join(", ")]].filter(([, v]) => v) : [];

  return (
    <section className="wrap page">
      <Link to="/doctor/patients" className="back">Back to my patients</Link>
      <h1>{name || "Patient"}</h1>
      <p className="hint">Shared by the patient. Read only.</p>

      <div className="dash">
        <div className="panel">
          <h2>Health details</h2>
          {rows.length === 0 ? <p className="hint">No details added.</p> : (
            <dl className="ecard-dl">{rows.map(([k, v]) => <div key={k} className="c-row"><dt>{k}</dt><dd className="pre">{v}</dd></div>)}</dl>
          )}
        </div>
        <div className="panel">
          <h2>Pain, last 14 days</h2>
          <p className="hint">Highest level each day.</p>
          <Chart entries={entries} />
        </div>
      </div>

      <h2 className="gap">Medicines</h2>
      {meds.length === 0 ? <div className="empty"><p>No active medicines.</p></div> : (
        <ul className="entries">{meds.map((m) => (
          <li key={m.id} className="entry"><div><strong>{m.name}</strong>{m.dose && <> , {m.dose}</>}<p>{adherence(m)}</p></div></li>
        ))}</ul>
      )}

      <h2 className="gap">Recent diary entries</h2>
      {entries.length === 0 ? <div className="empty"><p>No diary entries.</p></div> : (
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
