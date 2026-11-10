import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../i18n/index.jsx";

const level = (p) => (p <= 3 ? "low" : p <= 6 ? "mid" : "high");

export default function DailyCheckIn() {
  const { t } = useT();
  const [cups, setCups] = useState(0);
  const [pain, setPain] = useState(2);
  const goal = 8;
  const lv = level(pain);

  return (
    <div className="checkin">
      <div className="panel">
        <h3>{t("water.title")}</h3>
        <p className="hint">{cups >= goal ? t("water.done") : t("water.progress", { n: cups, goal })}</p>
        <div className="cups" role="group" aria-label={t("water.group")}>
          {Array.from({ length: goal }, (_, i) => (
            <button key={i} className={i < cups ? "cup full" : "cup"} aria-pressed={i < cups}
              aria-label={t("water.cup", { n: i + 1 })} onClick={() => setCups(i + 1 === cups ? i : i + 1)} />
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>{t("pain.title")}</h3>
        <label className="hint" htmlFor="pain">{t("pain.label", { n: pain })}</label>
        <input id="pain" type="range" min="0" max="10" value={pain} onChange={(e) => setPain(+e.target.value)} />
        <p className={`pain-msg ${lv}`}>{t(`pain.${lv}`)}</p>
        {pain >= 4 && <Link to="/find-doctors" className="btn small">{t("pain.find")}</Link>}
      </div>
    </div>
  );
}
