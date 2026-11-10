import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import { supabase } from "./lib/supabase.js";

export function useUnread() {
  const { user } = useAuth();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!user || !supabase) return;
    const load = () =>
      supabase.from("messages").select("id", { count: "exact", head: true })
        .is("read_at", null).neq("sender_id", user.id).then(({ count }) => setN(count || 0));
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [user]);
  return n;
}
