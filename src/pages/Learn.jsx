import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { articles, categories } from "../data/articles.js";
import { useT } from "../i18n/index.jsx";

export default function Learn() {
  const { t, lang } = useT();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return articles
      .filter((a) => cat === "All" || a.category === cat)
      .filter((a) => !term || (a.title + " " + a.summary).toLowerCase().includes(term));
  }, [q, cat]);

  return (
    <section className="wrap page">
      <h1>{t("learn.title")}</h1>
      <p className="lead">{t("learn.lead")}</p>
      <p className="notice">{t("learn.review")}</p>
      {lang !== "en" && <p className="notice">{t("learn.english")}</p>}

      <div className="field grow">
        <label htmlFor="lq">{t("learn.search")}</label>
        <input id="lq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("learn.searchPh")} />
      </div>

      <div className="chips lchips" role="group" aria-label={t("learn.topic")}>
        {["All", ...categories].map((c) => (
          <button key={c} className={cat === c ? "chip on" : "chip"} aria-pressed={cat === c} onClick={() => setCat(c)}>{t(`learn.cat.${c}`)}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h2>{t("learn.none")}</h2>
          <p>{t("learn.noneText")}</p>
          <button className="btn" onClick={() => { setQ(""); setCat("All"); }}>{t("learn.showAll")}</button>
        </div>
      ) : (
        <ul className="articles">
          {list.map((a) => (
            <li key={a.slug}>
              <Link to={`/learn/${a.slug}`} className="article-card">
                <span className="tag">{t(`learn.cat.${a.category}`)}</span>
                <h2>{a.title}</h2>
                <p>{a.summary}</p>
                <span className="mins">{t("learn.min", { n: a.minutes })}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
