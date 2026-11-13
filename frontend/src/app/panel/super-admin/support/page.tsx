"use client";

import { PanelShell } from "@/components/PanelShell";
import { SupportDesk } from "@/components/SupportDesk";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { superAdminNavItems } from "@/lib/superAdminNav";

export default function SuperAdminSupportPage() {
  const { user, loading } = useCurrentUser(["SUPER_ADMIN"]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-sm text-ink-mute">Ładowanie...</div>;
  return (
    <PanelShell navItems={superAdminNavItems} activeHref="/panel/super-admin/support" userLabel={`${user.firstName} ${user.lastName}`} userSubtitle="Super Admin">
      <SupportDesk admin />
    </PanelShell>
  );
}
