import { Link } from "react-router-dom";
import Cells from "../components/Cells.jsx";
import DailyCheckIn from "../components/DailyCheckIn.jsx";
import { useT } from "../i18n/index.jsx";

const tools = [
  { to: "/symptom-check", key: "symptoms", tone: "a" },
  { to: "/find-doctors", key: "doctors", tone: "b" },
  { to: "/learn", key: "learn", tone: "c" },
];
const triggers = ["dehydration", "cold", "infection", "stress", "exertion"];

export default function Home() {
  const { t } = useT();
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>{t("hero.title")}</h1>
            <p className="lead">{t("hero.lead")}</p>
            <div className="actions">
              <Link to="/symptom-check" className="btn big">{t("hero.cta1")}</Link>
              <Link to="/find-doctors" className="btn big ghost">{t("hero.cta2")}</Link>
            </div>
          </div>
          <Cells />
        </div>
      </section>

      <section className="emergency" aria-label={t("emergency.aria")}>
        <div className="wrap">
          <strong>{t("emergency.label")}</strong> {t("emergency.text")}
        </div>
      </section>

      <section className="wrap block">
        <h2>{t("day.title")}</h2>
        <p className="lead">{t("day.lead")}</p>
        <DailyCheckIn />
      </section>

      <section className="wrap block">
        <h2>{t("tools.title")}</h2>
        <div className="tools">
          {tools.map((x) => (
            <Link key={x.to} to={x.to} className={`tool ${x.tone}`}>
              <h3>{t(`tool.${x.key}.title`)}</h3>
              <p>{t(`tool.${x.key}.text`)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap block">
        <h2>{t("triggers.title")}</h2>
        <p className="lead">{t("triggers.lead")}</p>
        <div className="triggers">
          {triggers.map((k) => (
            <details key={k}>
              <summary>{t(`trigger.${k}`)}</summary>
              <p>{t(`trigger.${k}.tip`)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="wrap block">
        <div className="split">
          <div className="home">
            <h2>{t("home.title")}</h2>
            <ul>{[1, 2, 3].map((n) => <li key={n}>{t(`home.${n}`)}</li>)}</ul>
          </div>
          <div className="urgent">
            <h2>{t("urgent.title")}</h2>
            <ul>{[1, 2, 3].map((n) => <li key={n}>{t(`urgent.${n}`)}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="wrap block">
        <div className="portal-cta">
          <div>
            <h2>{t("cta.patients.title")}</h2>
            <p>{t("cta.patients.text")}</p>
            <Link to="/patient-login" className="btn">{t("patientLogin")}</Link>
          </div>
          <div>
            <h2>{t("cta.doctors.title")}</h2>
            <p>{t("cta.doctors.text")}</p>
            <Link to="/doctor-login" className="btn ghost">{t("doctorLogin")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
