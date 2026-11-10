import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

const urgent = /chest pain|can'?t breathe|cannot breathe|trouble breathing|short of breath|fever|seizure|unconscious|stroke|can'?t see|cannot see|severe pain|emergency|bleeding|very weak|confus/i;
const time = (t) => new Date(t).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function Messages() {
  const { user, profile } = useAuth();
  const isDoctor = profile?.role === "doctor";
  const [convos, setConvos] = useState(null);
  const [unread, setUnread] = useState({});
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const end = useRef(null);

  const loadConvos = useCallback(async () => {
    const [g, u] = await Promise.all([
      supabase.from("patient_access").select("*"),
      supabase.from("messages").select("id, patient_id, doctor_id").is("read_at", null).neq("sender_id", user.id),
    ]);
    setConvos((g.data || []).map((a) => ({
      id: isDoctor ? a.patient_id : a.doctor_id, name: isDoctor ? a.patient_name : a.doctor_name,
      patient_id: a.patient_id, doctor_id: a.doctor_id,
    })));
    const c = {};
    (u.data || []).forEach((m) => { const k = isDoctor ? m.patient_id : m.doctor_id; c[k] = (c[k] || 0) + 1; });
    setUnread(c);
  }, [user.id, isDoctor]);

  const loadThread = useCallback(async () => {
    if (!active) return;
    const { data } = await supabase.from("messages").select("*")
      .eq("patient_id", active.patient_id).eq("doctor_id", active.doctor_id).order("created_at");
    setMsgs(data || []);
    const ids = (data || []).filter((m) => m.sender_id !== user.id && !m.read_at).map((m) => m.id);
    if (ids.length) { await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", ids); loadConvos(); }
  }, [active, user.id, loadConvos]);

  useEffect(() => { loadConvos(); const id = setInterval(loadConvos, 20000); return () => clearInterval(id); }, [loadConvos]);
  useEffect(() => { loadThread(); const id = setInterval(loadThread, 15000); return () => clearInterval(id); }, [loadThread]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setErr("");
    const { error } = await supabase.from("messages").insert({ patient_id: active.patient_id, doctor_id: active.doctor_id, body });
    if (error) return setErr("Could not send. Please try again. You can only message people you are sharing records with.");
    setText(""); loadThread();
  };

  return (
    <section className="wrap page">
      <Link to={isDoctor ? "/doctor" : "/patient"} className="back">Back to my dashboard</Link>
      <h1>Messages</h1>
      <p className="notice">Not for emergencies. Doctors may take time to reply. If you are very unwell, go to the hospital.</p>

      {convos === null ? <p className="hint">Loading...</p> : convos.length === 0 ? (
        <div className="empty">
          {isDoctor
            ? <p>Patients appear here once they share their records with you.</p>
            : <><p>You can message a doctor once you share your records with them.</p><Link to="/patient/sharing" className="btn">Sharing with doctors</Link></>}
        </div>
      ) : (
        <div className={active ? "chat open" : "chat"}>
          <ul className="convos">
            {convos.map((c) => (
              <li key={c.id}>
                <button className={active?.id === c.id ? "convo on" : "convo"} onClick={() => { setMsgs([]); setActive(c); }}>
                  {c.name || (isDoctor ? "Patient" : "Doctor")}
                  {unread[c.id] > 0 && <span className="badge">{unread[c.id]}</span>}
                </button>
              </li>
            ))}
          </ul>

          <div className="thread">
            {!active ? <p className="hint">Choose a conversation.</p> : (
              <>
                <div className="thread-head">
                  <strong>{active.name}</strong>
                  <button className="link" onClick={() => setActive(null)}>All conversations</button>
                </div>
                <div className="bubbles" aria-live="polite">
                  {msgs.length === 0 && <p className="hint">No messages yet. Say hello.</p>}
                  {msgs.map((m) => (
                    <div key={m.id} className={m.sender_id === user.id ? "bubble mine" : "bubble"}>
                      <p>{m.body}</p><span>{time(m.created_at)}</span>
                    </div>
                  ))}
                  <div ref={end} />
                </div>
                {!isDoctor && urgent.test(text) && (
                  <p className="msg bad" role="alert">This sounds urgent. Messages may not be read quickly. Go to the nearest hospital or call your local emergency number now.</p>
                )}
                <form className="compose" onSubmit={send}>
                  <label htmlFor="mt" className="sr">Message</label>
                  <textarea id="mt" rows="2" maxLength="2000" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" />
                  <button className="btn">Send</button>
                </form>
                {err && <p className="msg bad" role="alert">{err}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
