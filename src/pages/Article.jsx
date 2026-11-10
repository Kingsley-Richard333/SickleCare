import { Link, useParams } from "react-router-dom";
import { articles } from "../data/articles.js";

export default function Article() {
  const { slug } = useParams();
  const a = articles.find((x) => x.slug === slug);

  if (!a) {
    return (
      <section className="wrap page">
        <h1>Guide not found</h1>
        <p className="lead">That guide does not exist. Go back and pick another.</p>
        <Link to="/learn" className="btn">All guides</Link>
      </section>
    );
  }

  const more = articles.filter((x) => x.slug !== a.slug && x.category === a.category).slice(0, 2);

  return (
    <article className="wrap page prose">
      <Link to="/learn" className="back">Back to all guides</Link>
      <span className="tag">{a.category}</span>
      <h1>{a.title}</h1>
      <p className="mins">{a.minutes} min read</p>
      {a.body.map((s, i) => (
        <div key={i}>
          {s.h && <h2>{s.h}</h2>}
          {s.p && s.p.map((t, j) => <p key={j}>{t}</p>)}
          {s.list && <ul>{s.list.map((t) => <li key={t}>{t}</li>)}</ul>}
        </div>
      ))}
      <div className="callout">
        <strong>Not feeling well right now?</strong>
        <p>Use the symptom checker to find out what to do next.</p>
        <Link to="/symptom-check" className="btn small">Check my symptoms</Link>
      </div>
      {more.length > 0 && (
        <>
          <h2>Keep reading</h2>
          <ul className="more">
            {more.map((m) => <li key={m.slug}><Link to={`/learn/${m.slug}`}>{m.title}</Link></li>)}
          </ul>
        </>
      )}
      <p className="hint">This guide is general information, not medical advice.</p>
    </article>
  );
}
