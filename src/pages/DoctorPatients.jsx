import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function DoctorPatients() {
  const [list, setList] = useState(null);
  useEffect(() => {
    supabase.from("patient_access").select("*").order("patient_name").then(({ data }) => setList(data || []));
  }, []);

  return (
    <section className="wrap page">
      <Link to="/doctor" className="back">Back to my dashboard</Link>
      <h1>My patients</h1>
      <p className="lead">Patients who have chosen to share their records with you.</p>
      {list === null ? <p className="hint">Loading...</p> : list.length === 0 ? (
        <div className="empty"><p>No patients have shared records with you yet.</p></div>
      ) : (
        <ul className="entries">
          {list.map((a) => (
            <li key={a.id} className="entry">
              <div><strong>{a.patient_name || "Patient"}</strong><p>Sharing since {new Date(a.granted_at).toLocaleDateString()}</p></div>
              <Link to={`/doctor/patients/${a.patient_id}`} className="btn small">View records</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
