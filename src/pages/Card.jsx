import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

const KEY = "sicklecare-card";
const tel = (n) => `tel:${n.replace(/[^\d+]/g, "")}`;

function Row({ label, children }) {
  if (!children) return null;
  return <div className="c-row"><dt>{label}</dt><dd>{children}</dd></div>;
}

export default function Card() {
  const { user, profile } = useAuth();
  const [d, setD] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from("patient_details").select("*").eq("id", user.id).maybeSingle().then(({ data, error }) => {
      if (!error) {
        setD(data);
        try { localStorage.setItem(KEY, JSON.stringify({ d: data, name: profile?.full_name })); } catch {}
      } else {
        try { const c = JSON.parse(localStorage.getItem(KEY)); if (c) { setD(c.d); setSaved(true); } } catch {}
      }
      setLoaded(true);
    });
  }, [user.id, profile?.full_name]);

  if (!loaded) return <section className="wrap page"><p className="lead">Loading...</p></section>;

  const empty = !d || !(d.genotype || d.blood_group || d.medicines || d.allergies || d.emergency_contact_name);

  return (
    <section className="wrap page">
      <Link to="/patient" className="back noprint">Back to my dashboard</Link>
      <h1 className="noprint">My emergency card</h1>

      {empty ? (
        <div className="empty">
          <p>Your card is empty. Add your details first so it can help in an emergency.</p>
          <Link to="/patient" className="btn">Add my details</Link>
        </div>
      ) : (
        <>
          {saved && <p className="notice noprint">You are offline. Showing your last saved card.</p>}
          <div className="ecard">
            <div className="e-head">
              <strong>I HAVE SICKLE CELL DISEASE</strong>
              <span>Please read this and get me medical help</span>
            </div>
            <div className="e-body">
              <h2>{profile?.full_name || "Patient"}</h2>
              <dl>
                <Row label="Genotype">{d.genotype}</Row>
                <Row label="Blood group">{d.blood_group}</Row>
                <Row label="Allergies">{d.allergies}</Row>
                <Row label="Medicines"><span className="pre">{d.medicines}</span></Row>
                <Row label="My doctor">{d.doctor_name}{d.doctor_phone && <> <a href={tel(d.doctor_phone)}>{d.doctor_phone}</a></>}</Row>
                <Row label="Emergency contact">{d.emergency_contact_name}{d.emergency_contact_phone && <> <a href={tel(d.emergency_contact_phone)}>{d.emergency_contact_phone}</a></>}</Row>
              </dl>
              <div className="e-help">
                <strong>If I am unwell:</strong>
                <ul>
                  <li>Take me to a hospital if I have a fever, chest pain, trouble breathing, weakness, confusion, or severe pain.</li>
                  <li>Keep me warm. Do not use cold packs.</li>
                  <li>Help me drink water if I can.</li>
                  <li>Tell the doctor I have sickle cell disease and show them this card.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="actions noprint">
            <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
            <Link to="/patient" className="btn ghost">Edit my details</Link>
          </div>
          <p className="hint noprint">This card is saved on your phone so you can open it without internet. Log out on shared devices.</p>
        </>
      )}
    </section>
  );
}
