import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function Sharing() {
  const [doctors, setDoctors] = useState([]);
  const [grants, setGrants] = useState([]);
  const [views, setViews] = useState([]);
  const [pick, setPick] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [v, d, g] = await Promise.all([
      supabase.from("record_views").select("*").order("viewed_at", { ascending: false }).limit(15),
      supabase.rpc("verified_doctors"),
      supabase.from("patient_access").select("*").order("granted_at", { ascending: false }),
    ]);
    setViews(v.data || []); setDoctors(d.data || []); setGrants(g.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const choices = doctors.filter((d) => !grants.some((g) => g.doctor_id === d.id));

  const grant = async (e) => {
    e.preventDefault(); setErr("");
    const d = doctors.find((x) => x.id === pick);
    if (!window.confirm(`Share your health details, pain diary, and medicines with ${d?.full_name}?`)) return;
    const { error } = await supabase.from("patient_access").insert({ doctor_id: pick });
    if (error) return setErr("Could not share. Please try again.");
    setPick(""); load();
  };
  const stop = async (g) => {
    if (!window.confirm(`Stop sharing with ${g.doctor_name}?`)) return;
    await supabase.from("patient_access").delete().eq("id", g.id); load();
  };

  return (
    <section className="wrap page">
      <Link to="/patient" className="back">Back to my dashboard</Link>
      <h1>Sharing with doctors</h1>
      <p className="lead">You decide who sees your records. A doctor you share with can read your health details, pain diary, and medicines. They cannot change anything, and you can stop at any time.</p>

      <div className="dash">
        <form className="panel form" onSubmit={grant}>
          <h2>Share with a doctor</h2>
          {choices.length === 0 ? (
            <p className="hint">{doctors.length === 0 ? "No verified doctors are available yet." : "You are already sharing with every available doctor."}</p>
          ) : (
            <>
              <div className="field"><label htmlFor="sd">Doctor</label>
                <select id="sd" required value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Choose a doctor</option>
                  {choices.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select></div>
              {err && <p className="msg bad" role="alert">{err}</p>}
              <button className="btn">Share my records</button>
            </>
          )}
        </form>

        <div className="panel">
          <h2>Sharing now</h2>
          {grants.length === 0 ? <p className="hint">You are not sharing with anyone.</p> : (
            <ul className="mlist">
              {grants.map((g) => (
                <li key={g.id}>
                  <div><strong>{g.doctor_name}</strong><br /><span className="hint">Since {new Date(g.granted_at).toLocaleDateString()}</span></div>
                  <button className="link" onClick={() => stop(g)}>Stop sharing</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="gap">Who has looked at my records</h2>
      {views.length === 0 ? <div className="empty"><p>No doctor has opened your records yet.</p></div> : (
        <ul className="entries">
          {views.map((x) => (
            <li key={x.id} className="entry">
              <div><strong>{x.doctor_name || "A doctor"}</strong>
                <p>{new Date(x.viewed_at).toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
