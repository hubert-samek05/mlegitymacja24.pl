"use client";

import { useEffect, useState } from "react";
import { PanelShell } from "@/components/PanelShell";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import { PERMISSION_OPTIONS } from "@/lib/credential";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { companyNavItems } from "@/lib/companyNav";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { alertError, alertOk, btnDanger, btnGhost, btnPrimary, card, inputCls } from "@/lib/ui";

interface Staff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "COMPANY_ADMIN" | "COMPANY_STAFF";
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
}

type Role = "COMPANY_ADMIN" | "COMPANY_STAFF";
const initialForm = { firstName: "", lastName: "", email: "", password: "" };
const defaultPermissions = ["credentials.issue", "verifications.view"];
const PAGE_SIZE = 15;

function RoleFields({ role, permissions, onRole, onPermissions, disableRole }: { role: Role; permissions: string[]; onRole: (r: Role) => void; onPermissions: (p: string[]) => void; disableRole?: boolean }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-ink">Rola</label>
        <select value={role} disabled={disableRole} onChange={(e) => onRole(e.target.value as Role)} className={inputCls}>
          <option value="COMPANY_STAFF">Pracownik — wybrane uprawnienia</option>
          <option value="COMPANY_ADMIN">Administrator — pełny dostęp</option>
        </select>
        {disableRole && <p className="mt-1 text-xs text-ink-mute">Własnej roli nie można zmienić.</p>}
      </div>
      {role === "COMPANY_ADMIN" ? (
        <p className="rounded-md bg-cream/60 px-4 py-3 text-xs leading-relaxed text-ink-soft">
          Administrator ma wszystkie uprawnienia oraz zarządza pracownikami, danymi firmy i subskrypcją.
        </p>
      ) : (
        <fieldset>
          <legend className="block text-sm font-medium text-ink">Uprawnienia</legend>
          <div className="mt-2 space-y-2">
            {PERMISSION_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex cursor-pointer items-start gap-3 rounded-md border border-ink/10 px-4 py-3 transition-colors hover:bg-ink/[0.03]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={permissions.includes(opt.key)}
                  onChange={(e) => onPermissions(e.target.checked ? [...permissions, opt.key] : permissions.filter((p) => p !== opt.key))}
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{opt.label}</span>
                  <span className="block text-xs text-ink-mute">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

export default function PracownicyPage() {
  const { user, loading: userLoading } = useCurrentUser(["COMPANY_ADMIN"]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; role: Role; permissions: string[] }>({ firstName: "", lastName: "", role: "COMPANY_STAFF", permissions: [] });
  const [addOpen, setAddOpen] = useState(false);
  const [role, setRole] = useState<Role>("COMPANY_STAFF");
  const [permissions, setPermissions] = useState<string[]>(defaultPermissions);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadStaff() {
    setLoading(true);
    try {
      setStaff(await apiGet<Staff[]>("/users/company-staff"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać listy pracowników");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function update(field: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPost("/users/company-staff", { ...form, role, permissions }, true);
      setForm(initialForm);
      setRole("COMPANY_STAFF");
      setPermissions(defaultPermissions);
      setAddOpen(false);
      setSuccess("Pracownik został dodany. Przekaż mu hasło tymczasowe — po zalogowaniu może je zmienić w zakładce Moje konto.");
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać pracownika");
    } finally {
      setSubmitting(false);
    }
  }

  async function run(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      setSuccess(ok);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operacja nie powiodła się");
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(member: Staff) {
    setEditing(member);
    setEditForm({ firstName: member.firstName, lastName: member.lastName, role: member.role, permissions: member.permissions ?? [] });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await run(editing.id, () => apiPatch(`/users/company-staff/${editing.id}`, editForm), "Dane pracownika zostały zapisane.");
    setEditing(null);
  }

  function resetPassword(member: Staff) {
    const password = window.prompt(`Nowe hasło tymczasowe dla ${member.firstName} ${member.lastName} (min. 8 znaków):`);
    if (!password) return;
    run(member.id, () => apiPost(`/users/company-staff/${member.id}/reset-password`, { password }, true), "Hasło zostało zmienione. Pracownik został wylogowany ze wszystkich urządzeń.");
  }

  const totalPages = Math.max(1, Math.ceil(staff.length / PAGE_SIZE));

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-mute">Ładowanie...</div>;
  }

  return (
    <PanelShell navItems={companyNavItems} activeHref="/panel/firma/pracownicy" userLabel={`${user.firstName} ${user.lastName}`} userSubtitle={user.company?.name ?? "Firma"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Pracownicy</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">Nadaj dostęp osobom, które pracują w imieniu Twojej organizacji, i określ, co mogą robić.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className={btnPrimary}>Dodaj pracownika</button>
      </div>

      {error && <p className={`mt-4 ${alertError}`}>{error}</p>}
      {success && <p className={`mt-4 ${alertOk}`}>{success}</p>}

      <div className="mt-8">
        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-ink-mute">
                <tr>
                  <th className="px-6 py-3 font-medium">Pracownik</th>
                  <th className="px-6 py-3 font-medium">Rola</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-ink-mute">Ładowanie...</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-ink-mute">Brak pracowników.</td></tr>
                ) : (
                  staff.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE).map((member) => {
                    const self = member.id === user.id;
                    return (
                      <tr key={member.id} className="border-t border-ink/5 align-top">
                        <td className="px-6 py-4">
                          <p className="font-medium text-ink">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-ink-mute">{member.email}</p>
                          <p className="mt-0.5 text-[11px] text-ink-mute">
                            {member.lastLoginAt ? `Ostatnie logowanie: ${new Date(member.lastLoginAt).toLocaleDateString("pl-PL")}` : "Nie logował(a) się"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-ink-soft">
                          <p className="font-medium text-ink">{member.role === "COMPANY_ADMIN" ? "Administrator" : "Pracownik"}</p>
                          <p className="mt-0.5 max-w-[220px] text-xs text-ink-mute">
                            {member.role === "COMPANY_ADMIN"
                              ? "Pełny dostęp"
                              : PERMISSION_OPTIONS.filter((o) => member.permissions?.includes(o.key)).map((o) => o.label).join(", ") || "Bez uprawnień (tylko podgląd)"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${member.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {member.isActive ? "Aktywny" : "Zablokowany"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button disabled={busyId === member.id} onClick={() => openEdit(member)} className={btnGhost + " !px-3 !py-1.5 !text-xs"}>Edytuj</button>
                            <button disabled={busyId === member.id} onClick={() => resetPassword(member)} className={btnGhost + " !px-3 !py-1.5 !text-xs"}>Nowe hasło</button>
                            {!self && (
                              <button
                                disabled={busyId === member.id}
                                onClick={() => run(member.id, () => apiPatch(`/users/company-staff/${member.id}`, { isActive: !member.isActive }), member.isActive ? "Dostęp pracownika został zablokowany." : "Dostęp pracownika został przywrócony.")}
                                className={member.isActive ? btnDanger : btnGhost + " !px-3 !py-1.5 !text-xs"}
                              >
                                {member.isActive ? "Zablokuj" : "Odblokuj"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Dodaj pracownika" subtitle="Pracownik zaloguje się podanym adresem e-mail i hasłem tymczasowym.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Imię</label>
              <input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Nazwisko</label>
              <input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">E-mail</label>
            <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Hasło tymczasowe</label>
            <input required type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} className={inputCls} />
          </div>
          <RoleFields role={role} permissions={permissions} onRole={setRole} onPermissions={setPermissions} />
          <p className="text-xs text-ink-mute">Liczba kont zależy od limitu w Twoim planie subskrypcji.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className={btnGhost}>Anuluj</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>{submitting ? "Dodawanie..." : "Dodaj pracownika"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edytuj pracownika" subtitle={editing?.email}>
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Imię</label>
            <input required value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Nazwisko</label>
            <input required value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className={inputCls} />
          </div>
          <RoleFields role={editForm.role} permissions={editForm.permissions} onRole={(r) => setEditForm({ ...editForm, role: r })} onPermissions={(p) => setEditForm({ ...editForm, permissions: p })} disableRole={editing?.id === user.id} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditing(null)} className={btnGhost}>Anuluj</button>
            <button type="submit" className={btnPrimary}>Zapisz</button>
          </div>
        </form>
      </Modal>
    </PanelShell>
  );
}
