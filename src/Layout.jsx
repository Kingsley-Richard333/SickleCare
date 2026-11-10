import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { usePwa } from "./pwa.js";
import { useAuth, homeFor } from "./auth/AuthContext.jsx";
import { useT } from "./i18n/index.jsx";

function useTheme() {
  const system = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("theme") || system(); } catch { return system(); } });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  return [theme, () => setTheme(theme === "dark" ? "light" : "dark")];
}

export default function Layout() {
  const [theme, toggle] = useTheme();
  const { online, canInstall, install } = usePwa();
  const { user, profile, signOut } = useAuth();
  const { t, lang, setLang, languages, reviewed } = useT();
  const links = [
    { to: "/symptom-check", label: t("nav.symptoms") },
    { to: "/find-doctors", label: t("nav.doctors") },
    { to: "/learn", label: t("nav.learn") },
  ];
  const codes = Object.keys(languages);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const close = () => setOpen(false);

  return (
    <>
      <a className="skip" href="#main">{t("skip")}</a>
      <header className="site-header">
        <div className="wrap bar">
          <Link to="/" className="brand"><span className="drop" aria-hidden="true" />Sicklecare</Link>
          <button className="menu-btn" aria-expanded={open} aria-controls="site-menu"
            aria-label={open ? t("menu.close") : t("menu.open")} onClick={() => setOpen(!open)}>
            <span aria-hidden="true" />
          </button>
          <div id="site-menu" className={open ? "menu open" : "menu"}>
          <nav aria-label={t("nav.main")} className="nav">
            {links.map((l) => <NavLink key={l.to} to={l.to} onClick={close}>{l.label}</NavLink>)}
          </nav>
          <div className="portals">
            {codes.length > 1 && (
              <select className="lang" aria-label={t("lang.label")} value={lang} onChange={(e) => setLang(e.target.value)}>
                {codes.map((c) => <option key={c} value={c}>{languages[c].meta.name}{languages[c].meta.reviewed ? "" : " (draft)"}</option>)}
              </select>
            )}
            <button className="theme" onClick={toggle} aria-label={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}>
              {theme === "dark" ? t("theme.light") : t("theme.dark")}
            </button>
            {canInstall && <button className="theme" onClick={install}>{t("install")}</button>}
            {user ? (
              <>
                <Link to={homeFor(profile?.role)} className="btn small" onClick={close}>{t("dashboard")}</Link>
                <Link to="/account" className="btn small ghost" onClick={close}>{t("account")}</Link>
                <button className="btn small ghost" onClick={signOut}>{t("logout")}</button>
              </>
            ) : (
              <>
                <Link to="/patient-login" className="btn small" onClick={close}>{t("patientLogin")}</Link>
                <Link to="/doctor-login" className="btn small ghost" onClick={close}>{t("doctorLogin")}</Link>
              </>
            )}
          </div>
          </div>
        </div>
      </header>
      {!reviewed && <div className="offline draft" role="note">{t("lang.draft")} / {languages.en.strings["lang.draft"]}</div>}
      {!online && <div className="offline" role="status">{t("offline")}</div>}
      <main id="main"><Outlet /></main>
      <footer className="site-footer">
        <div className="wrap foot">
          <strong>Sicklecare</strong>
          <p>{t("footer.note")}</p>
          <p><Link to="/privacy">{t("footer.privacy")}</Link> · <Link to="/terms">{t("footer.terms")}</Link></p>
        </div>
      </footer>
    </>
  );
}
