"use client";

import { PanelShell } from "@/components/PanelShell";
import { SupportDesk } from "@/components/SupportDesk";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";

export default function FirmaSupportPage() {
  const { user, loading } = useCurrentUser(["COMPANY_ADMIN", "COMPANY_STAFF"]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-sm text-ink-mute">Ładowanie...</div>;
  return (
    <PanelShell navItems={companyNavItems} activeHref="/panel/firma/support" userLabel={`${user.firstName} ${user.lastName}`} userSubtitle={user.company?.name ?? "Firma"}>
      <SupportDesk admin={false} />
    </PanelShell>
  );
}
