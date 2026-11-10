import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export const statusLabel = { requested: "Waiting for doctor", confirmed: "Confirmed", declined: "Declined", cancelled: "Cancelled" };
export const statusClass = { requested: "mid", confirmed: "lo", declined: "hi", cancelled: "hi" };
export const fmt = (t) => new Date(t).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function Appointments() {
  const [doctors, setDoctors] = useState([]);
  const [items, setItems] = useState([]);
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, a] = await Promise.all([
      supabase.rpc("verified_doctors"),
      supabase.from("appointments").select("*").order("starts_at", { ascending: false }),
    ]);
    setDoctors(d.data || []); setItems(a.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const book = async (e) => {
    e.preventDefault();
    setMsg(null);
    const starts = new Date(`${date}T${time}`);
    if (starts <= new Date()) return setMsg({ bad: true, text: "Please choose a date and time in the future." });
    setBusy(true);
    const { error } = await supabase.from("appointments").insert({ doctor_id: doctor, starts_at: starts.toISOString(), reason: reason.trim() || null });
    setBusy(false);
    if (error) return setMsg({ bad: true, text: "Could not send your request. Please try again." });
    setMsg({ text: "Request sent. The doctor will confirm or suggest another time." });
    setDoctor(""); setDate(""); setReason(""); load();
  };

  const cancel = async (a) => {
    if (!window.confirm("Cancel this appointment?")) return;
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", a.id);
    load();
  };

  const minDate = new Date().toLocaleDateString("en-CA");
  const now = new Date();
  const upcoming = items.filter((a) => new Date(a.starts_at) >= now).reverse();
  const past = items.filter((a) => new Date(a.starts_at) < now);

  const Row = ({ a, canCancel }) => (
    <li className="entry">
      <span className={`level ${statusClass[a.status]}`} aria-hidden="true">{a.status[0].toUpperCase()}</span>
      <div>
        <strong>{fmt(a.starts_at)}</strong>
        <p>With {a.doctor_name || "your doctor"} · {statusLabel[a.status]}</p>
        {a.reason && <p>Reason: {a.reason}</p>}
        {a.doctor_note && <p className="note">Doctor's note: {a.doctor_note}</p>}
      </div>
      {canCancel && ["requested", "confirmed"].includes(a.status) && <button className="link" onClick={() => cancel(a)}>Cancel</button>}
    </li>
  );

  return (
    <section className="wrap page">
      <Link to="/patient" className="back">Back to my dashboard</Link>
      <h1>My appointments</h1>
      <p className="lead">Ask a doctor for a visit and see when it is confirmed.</p>

      <div className="dash">
        <form className="panel form" onSubmit={book}>
          <h2>Request an appointment</h2>
          {doctors.length === 0 ? (
            <p className="hint">No verified doctors are available yet. Please check back soon, or use <Link to="/find-doctors">Find doctors</Link> to call a clinic.</p>
          ) : (
            <>
              <div className="field"><label htmlFor="ad">Doctor</label>
                <select id="ad" required value={doctor} onChange={(e) => setDoctor(e.target.value)}>
                  <option value="">Choose a doctor</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select></div>
              <div className="field"><label htmlFor="adt">Preferred date</label>
                <input id="adt" type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="field"><label htmlFor="atm">Preferred time</label>
                <input id="atm" type="time" required value={time} onChange={(e) => setTime(e.target.value)} /></div>
              <div className="field"><label htmlFor="ar">Reason (optional)</label>
                <textarea id="ar" rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Check-up, ongoing pain, medicine review" /></div>
              {msg && <p className={msg.bad ? "msg bad" : "msg"} role="status">{msg.text}</p>}
              <button className="btn" disabled={busy}>{busy ? "Sending..." : "Send request"}</button>
              <p className="hint">This is not for emergencies. If you are very unwell, go to the hospital.</p>
            </>
          )}
        </form>
      </div>

      <h2 className="gap">Upcoming</h2>
      {upcoming.length === 0 ? <div className="empty"><p>No upcoming appointments.</p></div> :
        <ul className="entries">{upcoming.map((a) => <Row key={a.id} a={a} canCancel />)}</ul>}

      {past.length > 0 && (<><h2 className="gap">Past</h2><ul className="entries">{past.map((a) => <Row key={a.id} a={a} />)}</ul></>)}
    </section>
  );
}
