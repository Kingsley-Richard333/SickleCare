import { Link } from "react-router-dom";

export default function ComingSoon({ title, text }) {
  return (
    <section className="wrap page">
      <h1>{title}</h1>
      <p className="lead">{text}</p>
      <p>This page is next on the build list.</p>
      <Link to="/" className="btn">Back to home</Link>
    </section>
  );
}
