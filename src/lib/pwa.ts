export interface ServiceWorkerCallbacks { onReady?: () => void; onUpdate?: (registration: ServiceWorkerRegistration) => void }
export async function registerServiceWorker({ onReady, onUpdate }: ServiceWorkerCallbacks = {}): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !import.meta.env.PROD) return null;
  try {
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
    if (registration.waiting && navigator.serviceWorker.controller) onUpdate?.(registration);
    const observed = new WeakSet<ServiceWorker>();
    const observe = () => {
      const worker = registration.installing;
      if (!worker || observed.has(worker)) return;
      observed.add(worker);
      const changed = () => { if (worker.state === 'installed' && navigator.serviceWorker.controller && registration.waiting) onUpdate?.(registration); };
      worker.addEventListener('statechange', changed);
      changed();
    };
    registration.addEventListener('updatefound', observe);
    observe();
    void navigator.serviceWorker.ready.then(ready => {
      if (ready.scope !== registration.scope) return;
      if (navigator.serviceWorker.controller) onReady?.();
      else navigator.serviceWorker.addEventListener('controllerchange', () => onReady?.(), { once: true });
    });
    return registration;
  } catch { return null; }
}
