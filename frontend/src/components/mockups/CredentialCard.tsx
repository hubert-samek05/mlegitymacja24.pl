"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { FakeQrCode } from "./FakeQrCode";
import { CREDENTIAL_SAMPLES, type CredentialSample } from "./credentialSamples";

export { CREDENTIAL_SAMPLES };
export type { CredentialSample };

export function CredentialCard({
  className = "",
  sample = CREDENTIAL_SAMPLES[0],
}: {
  className?: string;
  sample?: CredentialSample;
}) {
  return (
    <motion.div
      className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-card-lg ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* górna belka dokumentu */}
      <div className="bg-brand-gradient px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-200">
            {sample.companyName}
          </p>
          <ShieldCheck className="h-4.5 w-4.5 h-5 w-5 text-accent-300" />
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-600">
          Legitymacja zawodowa
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
          {sample.credentialType}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">{sample.holderName}</p>

        <div className="mt-5 flex items-end justify-between gap-4">
          <dl className="space-y-2.5 text-xs">
            <div>
              <dt className="uppercase tracking-wider text-ink-mute">Numer</dt>
              <dd className="font-mono font-semibold text-ink">{sample.credentialNumber}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-ink-mute">Ważna do</dt>
              <dd className="font-semibold text-ink">{sample.expiryDate}</dd>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-700">Aktywna</span>
            </div>
          </dl>

          <div className="rounded-lg border border-ink/10 bg-white p-1.5 shadow-sm">
            <FakeQrCode size={72} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-ink/10 bg-cream/60 px-6 py-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink-mute">
          mLegitymacja24
        </p>
        <p className="text-[10px] text-ink-mute">Kod odświeżany automatycznie</p>
      </div>
    </motion.div>
  );
}
