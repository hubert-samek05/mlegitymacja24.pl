"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, clearTokens, getAccessToken, revokeSession } from "./api";

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_STAFF" | "HOLDER";
  companyId: string | null;
  permissions?: string[];
  twoFactorEnabled: boolean;
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

    apiGet<CurrentUser>("/users/me")
      .then((data) => {
        if (allowedRoles && !allowedRoles.includes(data.role)) {
          router.replace("/logowanie");
          return;
        }
        setUser(data);
      })
      .catch((err) => {
        clearTokens();
        setError(err instanceof Error ? err.message : "Błąd uwierzytelniania");
        router.replace("/logowanie");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading, error };
}

export function logout(router: ReturnType<typeof useRouter>) {
  revokeSession();
  clearTokens();
  router.replace("/logowanie");
}
