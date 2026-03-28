"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function useApi() {
  const { getToken } = useAuth();

  const fetchApi = useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const token = await getToken();
      return fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          ...init?.headers,
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    },
    [getToken]
  );

  return fetchApi;
}
