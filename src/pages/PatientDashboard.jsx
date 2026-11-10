import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { useUnread } from "../useUnread.js";

const genotypes = ["", "AA", "AS", "SS", "SC", "Other", "Not sure"];
const bloods = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not sure"];
const empty = { genotype: "", blood_group: "", emergency_contact_name: "", emergency_contact_phone: "", medicines: "", allergies: "", doctor_name: "", doctor_phone: "" };

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const unread = useUnread();
  const [d, setD] = useState(empty);
  const [status, setStatus] = useState("");

  useEffect(() => {
    supabase.from("patient_details").select("*").eq("id", user.id).maybeSingle()
      .then(({ data }) => data && setD({ ...empty, ...data }));
  }, [user.id]);

  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setStatus("Saving...");
    const { error } = await supabase.from("patient_details").upsert({
      id: user.id, genotype: d.genotype || null, blood_group: d.blood_group || null,
      emergency_contact_name: d.emergency_contact_name || null, emergency_contact_phone: d.emergency_contact_phone || null,
      medicines: d.medicines || null, allergies: d.allergies || null, doctor_name: d.doctor_name || null, doctor_phone: d.doctor_phone || null,
    });
    setStatus(error ? "Could not save. Please try again." : "Saved.");
  };

  return (
    <section className="wrap page">
      <h1>Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
      <p className="lead">This is your space. Your details are private to you.</p>

      <div className="dash">
        <form className="panel form" onSubmit={save}>
          <h2>Your health details</h2>
          <div className="field"><label htmlFor="g">Genotype</label>
            <select id="g" value={d.genotype} onChange={set("genotype")}>{genotypes.map((g) => <option key={g} value={g}>{g || "Choose"}</option>)}</select></div>
          <div className="field"><label htmlFor="b">Blood group</label>
            <select id="b" value={d.blood_group} onChange={set("blood_group")}>{bloods.map((g) => <option key={g} value={g}>{g || "Choose"}</option>)}</select></div>
          <div className="field"><label htmlFor="en">Emergency contact name</label>
            <input id="en" autoComplete="off" value={d.emergency_contact_name} onChange={set("emergency_contact_name")} /></div>
          <div className="field"><label htmlFor="ep">Emergency contact phone</label>
            <input id="ep" type="tel" autoComplete="off" value={d.emergency_contact_phone} onChange={set("emergency_contact_phone")} /></div>
          <div className="field"><label htmlFor="al">Allergies</label>
            <input id="al" autoComplete="off" value={d.allergies} onChange={set("allergies")} placeholder="For example: penicillin, or none" /></div>
          <div className="field"><label htmlFor="md">Medicines you take</label>
            <textarea id="md" rows="3" value={d.medicines} onChange={set("medicines")} placeholder="Name and dose, one per line" /></div>
          <div className="field"><label htmlFor="dn2">Your doctor's name</label>
            <input id="dn2" autoComplete="off" value={d.doctor_name} onChange={set("doctor_name")} /></div>
          <div className="field"><label htmlFor="dp2">Your doctor's phone</label>
            <input id="dp2" type="tel" autoComplete="off" value={d.doctor_phone} onChange={set("doctor_phone")} /></div>
          <button className="btn">Save details</button>
          {status && <p className="hint" role="status">{status}</p>}
        </form>

        <div className="panel">
          <h2>Quick links</h2>
          <ul className="links">
            <li><Link to="/patient/messages">Messages{unread > 0 && ` (${unread} new)`}</Link></li>
            <li><Link to="/patient/sharing">Sharing with doctors</Link></li>
            <li><Link to="/patient/appointments">My appointments</Link></li>
            <li><Link to="/patient/medicines">My medicines</Link></li>
            <li><Link to="/patient/card">My emergency card</Link></li>
            <li><Link to="/patient/diary">My pain diary</Link></li>
            <li><Link to="/symptom-check">Check my symptoms</Link></li>
            <li><Link to="/find-doctors">Find a doctor or hospital</Link></li>
            <li><Link to="/learn">Read a guide</Link></li>
          </ul>
          <h3>Coming next</h3>
          <p className="hint">More tools are on the way.</p>
        </div>
      </div>
    </section>
  );
}
