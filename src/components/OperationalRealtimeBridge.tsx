"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase, hasBrowserSupabaseEnv } from "@/lib/supabase-browser";

type OperationalRealtimeBridgeProps = {
  projectId: string;
};

const EVENT_NAME = "hocker:operational-refresh";
const FALLBACK_REFRESH_MS = 30_000;

export default function OperationalRealtimeBridge({ projectId }: OperationalRealtimeBridgeProps) {
  const router = useRouter();

  useEffect(() => {
    if (!projectId || !hasBrowserSupabaseEnv()) return;

    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`hocker:project:${projectId}:operations`, { config: { private: true } })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hocker_operational_events",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          window.dispatchEvent(new CustomEvent(EVENT_NAME));
          router.refresh();
        },
      )
      .subscribe();

    const fallback = window.setInterval(() => router.refresh(), FALLBACK_REFRESH_MS);

    return () => {
      window.clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  return null;
}
