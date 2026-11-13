"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CredentialCard } from "./CredentialCard";
import { CREDENTIAL_SAMPLES } from "./credentialSamples";

export function CredentialCarousel({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % CREDENTIAL_SAMPLES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <CredentialCard sample={CREDENTIAL_SAMPLES[index]} />
        </motion.div>
      </AnimatePresence>
      <div className="mt-5 flex justify-center gap-2">
        {CREDENTIAL_SAMPLES.map((sample, dotIndex) => (
          <button
            key={sample.credentialNumber}
            onClick={() => setIndex(dotIndex)}
            aria-label={`Pokaż przykład: ${sample.credentialType}`}
            className={`h-1 rounded-full transition-all duration-300 ${
              dotIndex === index ? "w-6 bg-ink" : "w-1.5 bg-ink/20 hover:bg-ink/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
