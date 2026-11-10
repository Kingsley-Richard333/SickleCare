import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

const plugin = async () => (await import("@capacitor/local-notifications")).LocalNotifications;
const norm = (d) => (d === "granted" ? "granted" : d === "denied" ? "denied" : "default");

export async function checkNotifyPermission() {
  if (!isNative) return "unsupported";
  return norm((await (await plugin()).checkPermissions()).display);
}

export async function ensureNotifyPermission() {
  if (!isNative) return "unsupported";
  return norm((await (await plugin()).requestPermissions()).display);
}

// A stable whole number for each medicine and time, so reminders can be replaced cleanly.
const idFor = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 2147483646) + 1; };

export async function scheduleMedicineReminders(meds, showNames) {
  if (!isNative) return;
  try {
    const LN = await plugin();
    const pending = await LN.getPending();
    if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications });
    const notifications = meds.filter((m) => m.active).flatMap((m) => m.times.map((t) => {
      const [hour, minute] = t.split(":").map(Number);
      return {
        id: idFor(m.id + t),
        title: showNames ? `Time for ${m.name}` : "Sicklecare reminder",
        body: showNames ? (m.dose || "Open Sicklecare to tick it off.") : "It is time to take your medicine.",
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      };
    }));
    if (notifications.length) await LN.schedule({ notifications });
  } catch (e) { console.error("Could not schedule reminders", e); }
}

export async function cancelAllReminders() {
  if (!isNative) return;
  try {
    const LN = await plugin();
    const pending = await LN.getPending();
    if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications });
  } catch {}
}
