"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, ApiError, clearTokens, getAccessToken, revokeSession } from "./api";

export interface CurrentUser {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_STAFF" | "HOLDER";
  companyId: string | null;
  permissions?: string[];
  twoFactorEnabled: boolean;
  twoFactorMethod: "TOTP" | "EMAIL" | null;
  company?: { id: string; name: string; status: string } | null;
}

export function useCurrentUser(allowedRoles?: CurrentUser["role"][]) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/logowanie");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function load() {
      try {
        const data = await apiGet<CurrentUser>("/users/me");
        if (cancelled) return;
        if (allowedRoles && !allowedRoles.includes(data.role)) {
          router.replace("/logowanie");
          return;
        }
        setUser(data);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        // Tylko realne 401 wylogowuje — błąd sieci/restart serwera nie kasuje sesji
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          setError(err.message);
          setLoading(false);
          router.replace("/logowanie");
          return;
        }
        attempts += 1;
        if (attempts <= 8) {
          setTimeout(load, 1500);
          return;
        }
        setError(
          err instanceof Error ? err.message : "Błąd połączenia z serwerem"
        );
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading, error };
}

export function logout(router: ReturnType<typeof useRouter>) {
  revokeSession();
  clearTokens();
  router.replace("/logowanie");
}
