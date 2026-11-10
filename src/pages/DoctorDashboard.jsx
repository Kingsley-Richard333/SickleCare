import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { fmt, statusLabel } from "./Appointments.jsx";
import { useUnread } from "../useUnread.js";

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const unread = useUnread();
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    const { data } = await supabase.from("appointments").select("*").order("starts_at");
    setItems(data || []);
  }, []);
  useEffect(() => { if (profile?.verified) load(); }, [profile?.verified, load]);

  const decide = async (a, status) => {
    await supabase.from("appointments").update({ status, doctor_note: (notes[a.id] || "").trim() || null }).eq("id", a.id);
    load();
  };

  const now = new Date();
  const requests = items.filter((a) => a.status === "requested" && new Date(a.starts_at) >= now);
  const confirmed = items.filter((a) => a.status === "confirmed" && new Date(a.starts_at) >= now);

  return (
    <section className="wrap page">
      <h1>Hello{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>

      {!profile?.verified ? (
        <p className="notice">Your account is waiting to be verified. You will be able to receive appointment requests once an administrator confirms your details.</p>
      ) : (
        <>
          <p className="lead">Review appointment requests and see the records patients choose to share.</p>
          <div className="actions">
            <Link to="/doctor/patients" className="btn">My patients</Link>
            <Link to="/doctor/messages" className="btn ghost">Messages{unread > 0 && ` (${unread} new)`}</Link>
          </div>

          <h2 className="gap">Requests ({requests.length})</h2>
          {requests.length === 0 ? <div className="empty"><p>No new requests.</p></div> : (
            <ul className="entries">
              {requests.map((a) => (
                <li key={a.id} className="entry req">
                  <div>
                    <strong>{a.patient_name || "Patient"}</strong>
                    <p>{fmt(a.starts_at)}</p>
                    {a.reason && <p className="note">Reason: {a.reason}</p>}
                    <div className="field"><label htmlFor={`n${a.id}`}>Note to patient (optional)</label>
                      <input id={`n${a.id}`} value={notes[a.id] || ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} placeholder="For example: please arrive 15 minutes early" /></div>
                    <div className="actions">
                      <button className="btn small" onClick={() => decide(a, "confirmed")}>Confirm</button>
                      <button className="btn small ghost" onClick={() => decide(a, "declined")}>Decline</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h2 className="gap">Confirmed</h2>
          {confirmed.length === 0 ? <div className="empty"><p>No confirmed appointments.</p></div> : (
            <ul className="entries">
              {confirmed.map((a) => (
                <li key={a.id} className="entry">
                  <div><strong>{fmt(a.starts_at)}</strong><p>{a.patient_name || "Patient"} · {statusLabel[a.status]}</p>{a.reason && <p>Reason: {a.reason}</p>}</div>
                  <button className="link" onClick={() => decide(a, "cancelled")}>Cancel</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="panel gap">
        <h2>Coming next</h2>
        <p className="hint">More tools are on the way.</p>
        <Link to="/learn" className="btn small ghost">Read the patient guides</Link>
      </div>
    </section>
  );
}
