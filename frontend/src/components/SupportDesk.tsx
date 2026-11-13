"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { alertError, btnGhost, btnPrimary, card, inputCls } from "@/lib/ui";

interface Ticket {
  id: string;
  number: number;
  subject: string;
  category: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  updatedAt: string;
  company: { name: string };
  createdBy: { firstName: string; lastName: string };
  _count: { messages: number };
}

interface TicketDetail extends Omit<Ticket, "_count"> {
  messages: { id: string; body: string; isStaff: boolean; createdAt: string; author: { firstName: string; lastName: string } }[];
}

const categories: Record<string, string> = {
  TECHNICAL: "Problem techniczny",
  BILLING: "Płatności i subskrypcja",
  CREDENTIALS: "Legitymacje",
  ACCOUNT: "Konto i dostęp",
  OTHER: "Inne",
};

export function SupportDesk({ admin }: { admin: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"ALL" | Ticket["status"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "OTHER", message: "" });
  const [sending, setSending] = useState(false);
  const [current, setCurrent] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");

  const statusLabel = (t: Ticket["status"]) =>
    t === "CLOSED" ? "Zamknięte" : t === "ANSWERED" ? (admin ? "Czeka na klienta" : "Odpowiedź supportu") : admin ? "Do odpowiedzi" : "W obsłudze";
  const statusCls = (t: Ticket["status"]) =>
    t === "CLOSED" ? "bg-ink/[0.07] text-ink-soft" : t === "ANSWERED" ? (admin ? "bg-ink/[0.07] text-ink-soft" : "bg-emerald-100 text-emerald-800") : admin ? "bg-amber-100 text-amber-800" : "bg-brand-100 text-brand-800";

  async function load() {
    try {
      setTickets(await apiGet<Ticket[]>("/support/tickets"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać zgłoszeń");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function open(id: string) {
    setError(null);
    try {
      setCurrent(await apiGet<TicketDetail>(`/support/tickets/${id}`));
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się otworzyć zgłoszenia");
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await apiPost("/support/tickets", form, true);
      setForm({ subject: "", category: "OTHER", message: "" });
      setNewOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać zgłoszenia");
    } finally {
      setSending(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      await apiPost(`/support/tickets/${current.id}/messages`, { body: reply }, true);
      await Promise.all([open(current.id), load()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać wiadomości");
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: "OPEN" | "CLOSED") {
    if (!current) return;
    try {
      await apiPatch(`/support/tickets/${current.id}/status`, { status });
      await Promise.all([open(current.id), load()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zmienić statusu");
    }
  }

  const visible = tickets.filter((t) => filter === "ALL" || t.status === filter);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Support</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {admin ? "Zgłoszenia od firm korzystających z platformy." : "Masz pytanie lub problem? Napisz do nas — odpowiemy tutaj, w panelu."}
          </p>
        </div>
        {!admin && <button onClick={() => setNewOpen(true)} className={btnPrimary}>Nowe zgłoszenie</button>}
      </div>

      {error && <p className={`mt-4 ${alertError}`}>{error}</p>}

      <div className="mt-6 flex flex-wrap gap-1.5">
        {(["ALL", "OPEN", "ANSWERED", "CLOSED"] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${filter === k ? "bg-brand-900 text-white" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink"}`}>
            {k === "ALL" ? "Wszystkie" : statusLabel(k)}
          </button>
        ))}
      </div>

      <div className={`${card} mt-4 overflow-hidden`}>
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-ink-mute">Ładowanie...</p>
        ) : visible.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-mute">Brak zgłoszeń.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {visible.map((t) => (
              <li key={t.id}>
                <button onClick={() => open(t.id)} className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-ink/[0.03]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">#{t.number} · {t.subject}</p>
                    <p className="mt-0.5 text-xs text-ink-mute">
                      {admin ? `${t.company.name} · ` : ""}{categories[t.category] ?? t.category} · {t._count.messages} wiad. · {new Date(t.updatedAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusCls(t.status)}`}>{statusLabel(t.status)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nowe zgłoszenie" subtitle="Opisz sprawę — odpowiedź zobaczysz w tej zakładce.">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Temat</label>
            <input required minLength={3} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Kategoria</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Wiadomość</label>
            <textarea required minLength={3} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setNewOpen(false)} className={btnGhost}>Anuluj</button>
            <button type="submit" disabled={sending} className={btnPrimary}>{sending ? "Wysyłanie..." : "Wyślij zgłoszenie"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!current} onClose={() => setCurrent(null)} wide title={current ? `#${current.number} · ${current.subject}` : ""} subtitle={current ? `${admin ? current.company.name + " · " : ""}${categories[current.category] ?? current.category} · ${statusLabel(current.status)}` : undefined}>
        {current && (
          <div className="space-y-5">
            <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
              {current.messages.map((m) => (
                <div key={m.id} className={`rounded-lg border p-4 ${m.isStaff ? "border-brand-800/20 bg-brand-50" : "border-ink/10 bg-white"}`}>
                  <p className="text-xs text-ink-mute">
                    <span className="font-semibold text-ink">{m.isStaff ? "Support mLegitymacja24" : `${m.author.firstName} ${m.author.lastName}`}</span>
                    {" · "}{new Date(m.createdAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{m.body}</p>
                </div>
              ))}
            </div>
            {current.status === "CLOSED" ? (
              <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
                <p className="text-sm text-ink-mute">Zgłoszenie jest zamknięte.</p>
                <button onClick={() => setStatus("OPEN")} className={btnGhost}>Otwórz ponownie</button>
              </div>
            ) : (
              <form onSubmit={send} className="space-y-3 border-t border-ink/10 pt-4">
                <textarea required rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Napisz odpowiedź..." className={inputCls} />
                <div className="flex justify-between gap-3">
                  <button type="button" onClick={() => setStatus("CLOSED")} className={btnGhost}>Zamknij zgłoszenie</button>
                  <button type="submit" disabled={sending} className={btnPrimary}>{sending ? "Wysyłanie..." : "Wyślij"}</button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
