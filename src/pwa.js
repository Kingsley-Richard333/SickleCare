import { useEffect, useState } from "react";
import { isNative } from "./native.js";

export function registerServiceWorker() {
  if (import.meta.env.PROD && !isNative && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

export function usePwa() {
  const [online, setOnline] = useState(navigator.onLine);
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const before = (e) => { e.preventDefault(); setInstallEvent(e); };
    const installed = () => setInstallEvent(null);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return { online, canInstall: !!installEvent, install };
}
