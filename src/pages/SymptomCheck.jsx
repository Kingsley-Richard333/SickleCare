import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../i18n/index.jsx";
import { FLAGS, LOCS, OTHERS, TIPS, assess } from "../lib/assess.js";

// Set this to the local emergency number for your users.
const EMERGENCY_NUMBER = "112";

function Choices({ legend, options, type, value, onChange }) {
  const checked = (v) => (type === "checkbox" ? value.includes(v) : value === v);
  return (
    <fieldset className="q">
      <legend>{legend}</legend>
      <div className="opts">
        {options.map(({ v, label }) => (
          <label key={v} className={checked(v) ? "opt on" : "opt"}>
            <input
              type={type}
              name={legend}
              checked={checked(v)}
              onChange={() =>
                type === "checkbox" ? onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]) : onChange(v)
              }
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const blank = { flags: [], pain: 0, where: [], duration: 0, relief: 0, others: [] };

export default function SymptomCheck() {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [a, setA] = useState(blank);
  const set = (k) => (v) => setA({ ...a, [k]: v });
  const done = step === 3;
  const result = done ? assess(a) : null;
  const opts = (prefix, list) => list.map((v) => ({ v, label: t(`${prefix}.${v}`) }));
  const restart = () => { setA(blank); setStep(0); };

  return (
    <section className="wrap page check">
      <h1>{t("sc.title")}</h1>
      {!done && (
        <>
          <p className="lead">{t("sc.lead")}</p>
          <div className="progress" role="progressbar" aria-valuemin="1" aria-valuemax="3" aria-valuenow={step + 1} aria-label={t("sc.progress")}>
            {[0, 1, 2].map((i) => <span key={i} className={i <= step ? "on" : ""} />)}
          </div>
        </>
      )}

      {step === 0 && (
        <div className="wizard">
          <Choices legend={t("sc.step1")} options={opts("sc.flag", FLAGS)} type="checkbox" value={a.flags} onChange={set("flags")} />
          <p className="hint">{t("sc.none")}</p>
        </div>
      )}

      {step === 1 && (
        <div className="wizard">
          <fieldset className="q">
            <legend>{t("sc.step2")}</legend>
            <label htmlFor="pain2" className="hint">{t("sc.painLevel", { n: a.pain })}</label>
            <input id="pain2" type="range" min="0" max="10" value={a.pain} onChange={(e) => set("pain")(+e.target.value)} />
          </fieldset>
          {a.pain > 0 && (
            <>
              <Choices legend={t("sc.where")} options={opts("sc.loc", LOCS)} type="checkbox" value={a.where} onChange={set("where")} />
              <Choices legend={t("sc.duration")} options={opts("sc.dur", [0, 1, 2])} type="radio" value={a.duration} onChange={set("duration")} />
              <Choices legend={t("sc.relief")} options={opts("sc.rel", [0, 1, 2])} type="radio" value={a.relief} onChange={set("relief")} />
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="wizard">
          <Choices legend={t("sc.step3")} options={opts("sc.oth", OTHERS)} type="checkbox" value={a.others} onChange={set("others")} />
          <p className="hint">{t("sc.none")}</p>
        </div>
      )}

      {done && (
        <div className={`result ${result.level}`} role="status">
          <h2>{t(`sc.res.${result.level}.title`)}</h2>
          <p>{t(`sc.res.${result.level}.text`, { num: EMERGENCY_NUMBER })}</p>
          <h3>{t("sc.why")}</h3>
          <ul>{result.reasons.map((r) => <li key={r.k}>{t(r.k, r.v)}</li>)}</ul>
          <h3>{t("sc.what")}</h3>
          <ul>{Array.from({ length: TIPS[result.level] }, (_, i) => <li key={i}>{t(`sc.res.${result.level}.tip${i + 1}`)}</li>)}</ul>
          <div className="actions">
            <Link to="/find-doctors" className="btn">{t("sc.findDoc")}</Link>
            <button className="btn ghost" onClick={restart}>{t("sc.again")}</button>
          </div>
          <p className="hint">{t("sc.disclaimer")}</p>
        </div>
      )}

      {!done && (
        <div className="actions">
          {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>{t("sc.back")}</button>}
          <button className="btn" onClick={() => setStep(step + 1)}>{step === 2 ? t("sc.see") : t("sc.next")}</button>
        </div>
      )}
    </section>
  );
}
