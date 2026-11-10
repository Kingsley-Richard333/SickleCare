import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

const blank = { name: "", type: "Hospital", specialty: "", facility: "", area: "", address: "", phone: "", hours: "", emergency: false };
const tabs = ["Overview", "Doctors", "Directory"];

export default function Admin() {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [providers, setProviders] = useState([]);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [s, d, p] = await Promise.all([
      supabase.rpc("admin_stats"),
      supabase.from("profiles").select("id, full_name, email, license_no, verified, created_at").eq("role", "doctor").order("verified").order("created_at", { ascending: false }),
      supabase.from("providers").select("*").order("name"),
    ]);
    setStats(s.data); setDoctors(d.data || []); setProviders(p.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setVerified = async (d, verified) => {
    await supabase.from("profiles").update({ verified }).eq("id", d.id);
    load();
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const add = async (e) => {
    e.preventDefault(); setErr("");
    const row = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === "" ? null : v]));
    row.emergency = f.emergency;
    const { error } = await supabase.from("providers").insert(row);
    if (error) return setErr("Could not add. Please check the details.");
    setF(blank); load();
  };
  const remove = async (p) => {
    if (!window.confirm(`Remove ${p.name} from the directory?`)) return;
    await supabase.from("providers").delete().eq("id", p.id); load();
  };

  const pending = doctors.filter((d) => !d.verified);
  const tiles = stats ? [
    ["Patients", stats.patients], ["Doctors", stats.doctors], ["Verified doctors", stats.verified],
    ["Waiting for approval", stats.doctors - stats.verified], ["Appointments", stats.appointments],
  ] : [];

  return (
    <section className="wrap page">
      <h1>Admin</h1>
      <div className="chips lchips" role="group" aria-label="Admin sections">
        {tabs.map((t) => (
          <button key={t} className={tab === t ? "chip on" : "chip"} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}{t === "Doctors" && pending.length > 0 ? ` (${pending.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="stats">
          {tiles.map(([k, v]) => <div key={k} className="panel stat"><strong>{v}</strong><span>{k}</span></div>)}
          <p className="hint">Counts only. Admins cannot see patient health records.</p>
        </div>
      )}

      {tab === "Doctors" && (
        doctors.length === 0 ? <div className="empty"><p>No doctors have signed up yet.</p></div> : (
          <ul className="entries">
            {doctors.map((d) => (
              <li key={d.id} className="entry">
                <div>
                  <strong>{d.full_name || "No name"}</strong> <span className={d.verified ? "tag" : "tag er"}>{d.verified ? "Verified" : "Waiting"}</span>
                  <p>{d.email}</p>
                  <p>Registration no: {d.license_no || "not given"}</p>
                </div>
                {d.verified
                  ? <button className="link" onClick={() => setVerified(d, false)}>Revoke</button>
                  : <button className="btn small" onClick={() => setVerified(d, true)}>Approve</button>}
              </li>
            ))}
          </ul>
        )
      )}

      {tab === "Directory" && (
        <div className="dash">
          <form className="panel form" onSubmit={add}>
            <h2>Add to directory</h2>
            <div className="field"><label htmlFor="pn">Name</label><input id="pn" required value={f.name} onChange={set("name")} /></div>
            <div className="field"><label htmlFor="pt">Type</label>
              <select id="pt" value={f.type} onChange={set("type")}><option>Hospital</option><option>Clinic</option><option>Doctor</option></select></div>
            <div className="field"><label htmlFor="ps">Specialty</label><input id="ps" value={f.specialty} onChange={set("specialty")} /></div>
            <div className="field"><label htmlFor="pf">Facility (for doctors)</label><input id="pf" value={f.facility} onChange={set("facility")} /></div>
            <div className="field"><label htmlFor="pa">Area or city</label><input id="pa" required value={f.area} onChange={set("area")} /></div>
            <div className="field"><label htmlFor="pad">Address</label><input id="pad" value={f.address} onChange={set("address")} /></div>
            <div className="field"><label htmlFor="pp">Phone</label><input id="pp" type="tel" required value={f.phone} onChange={set("phone")} /></div>
            <div className="field"><label htmlFor="ph">Opening hours</label><input id="ph" value={f.hours} onChange={set("hours")} /></div>
            <label className="agree"><input type="checkbox" checked={f.emergency} onChange={set("emergency")} />Offers 24-hour emergency care</label>
            {err && <p className="msg bad" role="alert">{err}</p>}
            <button className="btn">Add</button>
          </form>
          <div className="panel">
            <h2>Listed ({providers.length})</h2>
            {providers.length === 0 ? <p className="hint">Nothing added yet. Until you add some, Find doctors shows sample listings.</p> : (
              <ul className="mlist">
                {providers.map((p) => (
                  <li key={p.id}><div><strong>{p.name}</strong><br /><span className="hint">{p.type} · {p.area}</span></div>
                    <button className="link" onClick={() => remove(p)}>Remove</button></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
