export function notify(message, type = "info", durationMs = 3200) {
  if (!message) return;

  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("app-notify", {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message: String(message),
        type,
        durationMs: Number(durationMs) || 3200,
      },
    })
  );
}
