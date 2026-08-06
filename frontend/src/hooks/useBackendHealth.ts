import { useEffect, useState } from "react";

type Health = "starting" | "ready" | "offline";

export function useBackendHealth(): Health {
  const [health, setHealth] = useState<Health>("starting");

  useEffect(() => {
    let cancelled = false;
    let failures = 0;

    const electronPort = (window as any).NAUKRI_BE_PORT;

    const url = electronPort
      ? `http://127.0.0.1:${electronPort}/api/health`
      : "/api/health";

    async function poll() {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error();
        }

        if (!cancelled) {
          setHealth("ready");
        }

        failures = 0;

      } catch {

        failures++;

        if (!cancelled && failures >= 5) {
          setHealth("offline");
        }

      }
    }

    poll();

    const id = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };

  }, []);

  return health;
}