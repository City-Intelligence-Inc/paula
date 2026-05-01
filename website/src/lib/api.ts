import type { Family, Parent, Student, Tutor, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type": "application/json",
    },
  });
}

export function apiWithToken(token: string | null) {
  return function (path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };
}

// ---------------------------------------------------------
// v3.0 typed client — wraps the App Runner backend.
// Pass a fetcher (typically the one returned by useApi()) so
// callers can stay in sync with the active Clerk session.
// ---------------------------------------------------------

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export function client(fetchApi: Fetcher) {
  return {
    families: {
      list: () =>
        fetchApi("/api/families").then(jsonOrThrow) as Promise<{
          families: Family[];
        }>,
      get: (id: string) =>
        fetchApi(`/api/families/${id}`).then(jsonOrThrow) as Promise<{
          family: Family;
          parents: Parent[];
          students: Student[];
        }>,
      create: (body: Partial<Family>) =>
        fetchApi("/api/families", {
          method: "POST",
          body: JSON.stringify(body),
        }).then(jsonOrThrow) as Promise<{ family: Family }>,
    },
    parents: {
      list: () =>
        fetchApi("/api/parents").then(jsonOrThrow) as Promise<{
          parents: Parent[];
        }>,
      byEmail: (email: string) =>
        fetchApi(`/api/parents?email=${encodeURIComponent(email)}`).then(
          jsonOrThrow,
        ) as Promise<{ parents: Parent[] }>,
      create: (body: Partial<Parent>) =>
        fetchApi("/api/parents", {
          method: "POST",
          body: JSON.stringify(body),
        }).then(jsonOrThrow) as Promise<{ parent: Parent }>,
    },
    tutors: {
      list: () =>
        fetchApi("/api/tutors").then(jsonOrThrow) as Promise<{
          tutors: Tutor[];
        }>,
      sessions: (id: string, from?: string, to?: string) => {
        const qs = new URLSearchParams();
        if (from) qs.set("from", from);
        if (to) qs.set("to", to);
        const tail = qs.toString() ? `?${qs}` : "";
        return fetchApi(`/api/tutors/${id}/sessions${tail}`).then(
          jsonOrThrow,
        ) as Promise<{ sessions: unknown[] }>;
      },
    },
    users: {
      me: () =>
        fetchApi("/api/users/me").then(jsonOrThrow) as Promise<{ user: User }>,
    },
  };
}
