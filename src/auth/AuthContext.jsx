import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { cancelAllReminders } from "../native.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const homeFor = (role) => (role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/patient");

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    if (!session) { setProfile(null); return; }
    setLoading(true);
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [session]);

  const value = {
    user: session?.user ?? null,
    profile,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, fullName, role, licenseNo) =>
      supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role, license_no: licenseNo || null } } }),
    signOut: () => { try { localStorage.removeItem("sicklecare-card"); } catch {} cancelAllReminders(); return supabase.auth.signOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
