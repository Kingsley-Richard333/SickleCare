import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { providers as sample } from "../data/providers.js";
import { useT } from "../i18n/index.jsx";

const types = ["All", "Doctor", "Hospital", "Clinic"];
const typeKey = { All: "fd.type.all", Doctor: "fd.type.doctors", Hospital: "fd.type.hospitals", Clinic: "fd.type.clinics" };

export default function FindDoctors() {
  const { t } = useT();
  const [providers, setProviders] = useState(sample);
  const [real, setReal] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    supabase.from("providers").select("*").order("name").then(({ data }) => {
      if (data && data.length) { setProviders(data); setReal(true); }
    });
  }, []);
  const areas = useMemo(() => [...new Set(providers.map((p) => p.area).filter(Boolean))], [providers]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [area, setArea] = useState("");
  const [open24, setOpen24] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return providers
      .filter((p) => type === "All" || p.type === type)
      .filter((p) => !area || p.area === area)
      .filter((p) => !open24 || p.emergency)
      .filter((p) => !term || [p.name, p.specialty, p.facility, p.area].join(" ").toLowerCase().includes(term))
      .sort((a, b) => Number(b.emergency) - Number(a.emergency));
  }, [q, type, area, open24, providers]);

  const clear = () => { setQ(""); setType("All"); setArea(""); setOpen24(false); };

  return (
    <section className="wrap page">
      <h1>{t("fd.title")}</h1>
      <p className="lead">{t("fd.lead")}</p>
      {!real && <p className="notice">{t("fd.sample")}</p>}

      <div className="filters">
        <div className="field grow">
          <label htmlFor="q">{t("fd.search")}</label>
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("fd.searchPh")} />
        </div>
        <div className="field">
          <label htmlFor="area">{t("fd.area")}</label>
          <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">{t("fd.allAreas")}</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="chips" role="group" aria-label={t("fd.typeGroup")}>
        {types.map((x) => (
          <button key={x} className={type === x ? "chip on" : "chip"} aria-pressed={type === x} onClick={() => setType(x)}>{t(typeKey[x])}</button>
        ))}
        <label className={open24 ? "chip on" : "chip"}>
          <input type="checkbox" checked={open24} onChange={(e) => setOpen24(e.target.checked)} />
          {t("fd.er24")}
        </label>
      </div>

      <p className="count" aria-live="polite">{t(list.length === 1 ? "fd.result" : "fd.results", { n: list.length })}</p>

      {list.length === 0 ? (
        <div className="empty">
          <h2>{t("fd.none")}</h2>
          <p>{t("fd.noneText")}</p>
          <button className="btn" onClick={clear}>{t("fd.clear")}</button>
        </div>
      ) : (
        <ul className="providers">
          {list.map((p) => (
            <li key={p.id} className="provider">
              <div className="p-head">
                <span className={`tag ${p.type.toLowerCase()}`}>{t(`fd.tag.${p.type}`)}</span>
                {p.emergency && <span className="tag er">{t("fd.er")}</span>}
              </div>
              <h2>{p.name}</h2>
              <p className="spec">{p.specialty}</p>
              <p className="meta">
                {p.facility && <>{p.facility}<br /></>}
                {p.address}<br />
                {p.hours}
              </p>
              <div className="actions">
                <a className="btn small" href={`tel:${p.phone.replace(/\s/g, "")}`}>{t("fd.call", { phone: p.phone })}</a>
                <a className="btn small ghost" target="_blank" rel="noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.address)}`}>
                  {t("fd.directions")}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
