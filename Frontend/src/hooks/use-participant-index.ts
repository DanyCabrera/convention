"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { StudentWithTicket } from "@/types";

let cached: StudentWithTicket[] | null = null;
let pending: Promise<StudentWithTicket[]> | null = null;

function loadParticipants(): Promise<StudentWithTicket[]> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = api
      .getStudents()
      .then((students) => {
        cached = students;
        return students;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useParticipantIndex() {
  const [students, setStudents] = useState<StudentWithTicket[]>(cached ?? []);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    let active = true;
    loadParticipants()
      .then((data) => {
        if (active) setStudents(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { students, loading };
}
