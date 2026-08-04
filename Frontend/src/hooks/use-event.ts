"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { EVENT } from "@/lib/constants";

export interface EventInfo {
  name: string;
  date: string;
  location: string;
  university: string;
}

export function useEvent() {
  const [event, setEvent] = useState<EventInfo>({
    name: EVENT.name,
    date: EVENT.date,
    location: EVENT.location,
    university: EVENT.university,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await api.getEvent();
      setEvent({
        name: data.name,
        date: data.date,
        location: data.location,
        university: data.university ?? EVENT.university,
      });
    } catch {
      /* fallback to constants */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { event, refresh };
}
